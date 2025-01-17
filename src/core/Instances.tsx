import * as THREE from 'three'
import * as React from 'react'
import { ReactThreeFiber, extend, useFrame } from '@react-three/fiber'
import Composer from 'react-composer'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { setUpdateRange } from '../helpers/deprecated'

declare global {
  namespace JSX {
    interface IntrinsicElements {
      positionMesh: ReactThreeFiber.Object3DNode<PositionMesh, typeof PositionMesh>
    }
  }
}

type Api = {
  getParent: () => React.MutableRefObject<InstancedMesh>
  subscribe: <T>(ref: React.MutableRefObject<T>) => void
}

export type InstancesProps = JSX.IntrinsicElements['instancedMesh'] & {
  context?: React.Context<Api>
  range?: number
  limit?: number
  frames?: number
}

export type InstanceProps = JSX.IntrinsicElements['positionMesh'] & {
  context?: React.Context<Api>
}

export type InstancedAttributeProps = JSX.IntrinsicElements['instancedBufferAttribute'] & {
  name: string
  defaultValue: any
  normalized?: boolean
  usage?: number
}

type InstancedMesh = Omit<THREE.InstancedMesh, 'instanceMatrix' | 'instanceColor'> & {
  instanceMatrix: THREE.InstancedBufferAttribute
  instanceColor: THREE.InstancedBufferAttribute
}

function isFunctionChild(
  value: any
): value is (
  props: React.ForwardRefExoticComponent<Omit<InstanceProps, 'ref'> & React.RefAttributes<unknown>>
) => React.ReactNode {
  return typeof value === 'function'
}

const _instanceLocalMatrix = /* @__PURE__ */ new THREE.Matrix4()
const _instanceWorldMatrix = /* @__PURE__ */ new THREE.Matrix4()
const _instanceIntersects: THREE.Intersection[] = []
const _mesh = /* @__PURE__ */ new THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>()

export class PositionMesh extends THREE.Group {
  color: THREE.Color
  instance: React.MutableRefObject<THREE.InstancedMesh | undefined>
  instanceKey: React.MutableRefObject<JSX.IntrinsicElements['positionMesh'] | undefined>
  constructor() {
    super()
    this.color = new THREE.Color('white')
    this.instance = { current: undefined }
    this.instanceKey = { current: undefined }
  }

  // This will allow the virtual instance have bounds
  get geometry() {
    return this.instance.current?.geometry
  }

  // And this will allow the virtual instance to receive events
  raycast(raycaster: THREE.Raycaster, intersects: THREE.Intersection[]) {
    const parent = this.instance.current
    if (!parent) return
    if (!parent.geometry || !parent.material) return
    _mesh.geometry = parent.geometry
    const matrixWorld = parent.matrixWorld
    const instanceId = parent.userData.instances.indexOf(this.instanceKey)
    // If the instance wasn't found or exceeds the parents draw range, bail out
    if (instanceId === -1 || instanceId > parent.count) return
    // calculate the world matrix for each instance
    parent.getMatrixAt(instanceId, _instanceLocalMatrix)
    _instanceWorldMatrix.multiplyMatrices(matrixWorld, _instanceLocalMatrix)
    // the mesh represents this single instance
    _mesh.matrixWorld = _instanceWorldMatrix
    // raycast side according to instance material
    if (parent.material instanceof THREE.Material) _mesh.material.side = parent.material.side
    else _mesh.material.side = parent.material[0].side
    _mesh.raycast(raycaster, _instanceIntersects)
    // process the result of raycast
    for (let i = 0, l = _instanceIntersects.length; i < l; i++) {
      const intersect = _instanceIntersects[i]
      intersect.instanceId = instanceId
      intersect.object = this
      intersects.push(intersect)
    }
    _instanceIntersects.length = 0
  }
}

const globalContext = /* @__PURE__ */ React.createContext<Api>(null!)
const parentMatrix = /* @__PURE__ */ new THREE.Matrix4()
const instanceMatrix = /* @__PURE__ */ new THREE.Matrix4()
const tempMatrix = /* @__PURE__ */ new THREE.Matrix4()
const translation = /* @__PURE__ */ new THREE.Vector3()
const rotation = /* @__PURE__ */ new THREE.Quaternion()
const scale = /* @__PURE__ */ new THREE.Vector3()

const isInstancedBufferAttribute = (attr: any): attr is THREE.InstancedBufferAttribute =>
  attr.isInstancedBufferAttribute

export const Instance = /* @__PURE__ */ React.forwardRef(({ context, children, ...props }: InstanceProps, ref) => {
  React.useMemo(() => extend({ PositionMesh }), [])
  const group = React.useRef<JSX.IntrinsicElements['positionMesh']>()
  React.useImperativeHandle(ref, () => group.current, [])
  const { subscribe, getParent } = React.useContext(context || globalContext)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <positionMesh instance={getParent()} instanceKey={group} ref={group as any} {...props}>
      {children}
    </positionMesh>
  )
})

export const Instances: ForwardRefComponent<InstancesProps, THREE.InstancedMesh> = /* @__PURE__ */ React.forwardRef<
  THREE.InstancedMesh,
  InstancesProps
>(({ context, children, range, limit = 1000, frames = Infinity, ...props }, ref) => {
  const [{ localContext, instance }] = React.useState(() => {
    const localContext = React.createContext<Api>(null!)
    return {
      localContext,
      instance: React.forwardRef((props: InstanceProps, ref) => (
        <Instance context={localContext} {...props} ref={ref} />
      )),
    }
  })

  const parentRef = React.useRef<InstancedMesh>(null!)
  React.useImperativeHandle(ref, () => parentRef.current, [])
  const [instances, setInstances] = React.useState<React.MutableRefObject<PositionMesh>[]>([])
  const [[matrices, colors]] = React.useState(() => {
    const mArray = new Float32Array(limit * 16)
    for (let i = 0; i < limit; i++) tempMatrix.identity().toArray(mArray, i * 16)
    return [mArray, new Float32Array([...new Array(limit * 3)].map(() => 1))]
  })

  React.useEffect(() => {
    // We might be a frame too late? 🤷‍♂️
    parentRef.current.instanceMatrix.needsUpdate = true
  })

  let iterations = 0
  let count = 0

  const attributes = React.useRef<[string, THREE.InstancedBufferAttribute][]>([])
  React.useLayoutEffect(() => {
    attributes.current = Object.entries(parentRef.current.geometry.attributes).filter(([_name, value]) =>
      isInstancedBufferAttribute(value)
    ) as [string, THREE.InstancedBufferAttribute][]
  })

  useFrame(() => {
    if (frames === Infinity || iterations < frames) {
      parentRef.current.updateMatrix()
      parentRef.current.updateMatrixWorld()
      parentMatrix.copy(parentRef.current.matrixWorld).invert()

      count = Math.min(limit, range !== undefined ? range : limit, instances.length)
      parentRef.current.count = count
      setUpdateRange(parentRef.current.instanceMatrix, { offset: 0, count: count * 16 })
      setUpdateRange(parentRef.current.instanceColor, { offset: 0, count: count * 3 })

      for (let i = 0; i < instances.length; i++) {
        const instance = instances[i].current
        // Multiply the inverse of the InstancedMesh world matrix or else
        // Instances will be double-transformed if <Instances> isn't at identity
        instance.matrixWorld.decompose(translation, rotation, scale)
        instanceMatrix.compose(translation, rotation, scale).premultiply(parentMatrix)
        instanceMatrix.toArray(matrices, i * 16)
        parentRef.current.instanceMatrix.needsUpdate = true
        instance.color.toArray(colors, i * 3)
        parentRef.current.instanceColor.needsUpdate = true
      }
      iterations++
    }

    if (frames === Infinity || iterations === frames) {
      if (parentRef.current.boundingBox) parentRef.current.computeBoundingBox()
      if (parentRef.current.boundingSphere) parentRef.current.computeBoundingSphere()
    }
  })

  const api = React.useMemo(
    () => ({
      getParent: () => parentRef,
      subscribe: (ref) => {
        setInstances((instances) => [...instances, ref])
        return () => setInstances((instances) => instances.filter((item) => item.current !== ref.current))
      },
    }),
    []
  )

  return (
    <instancedMesh
      userData={{ instances, limit, frames }}
      matrixAutoUpdate={false}
      ref={parentRef}
      args={[null as any, null as any, 0]}
      raycast={() => null}
      {...props}
    >
      <instancedBufferAttribute
        attach="instanceMatrix"
        count={matrices.length / 16}
        array={matrices}
        itemSize={16}
        usage={THREE.DynamicDrawUsage}
      />
      <instancedBufferAttribute
        attach="instanceColor"
        count={colors.length / 3}
        array={colors}
        itemSize={3}
        usage={THREE.DynamicDrawUsage}
      />
      {isFunctionChild(children) ? (
        <localContext.Provider value={api}>{children(instance)}</localContext.Provider>
      ) : context ? (
        <context.Provider value={api}>{children}</context.Provider>
      ) : (
        <globalContext.Provider value={api}>{children}</globalContext.Provider>
      )}
    </instancedMesh>
  )
})

export interface MergedProps extends InstancesProps {
  meshes: THREE.Mesh[]
  children: React.ReactNode
}

export const Merged: ForwardRefComponent<any, THREE.Group> = /* @__PURE__ */ React.forwardRef<THREE.Group, any>(
  function Merged({ meshes, children, ...props }, ref) {
    const isArray = Array.isArray(meshes)
    // Filter out meshes from collections, which may contain non-meshes
    if (!isArray) for (const key of Object.keys(meshes)) if (!meshes[key].isMesh) delete meshes[key]
    return (
      <group ref={ref}>
        <Composer
          components={(isArray ? meshes : Object.values(meshes)).map(({ geometry, material }) => (
            <Instances key={geometry.uuid} geometry={geometry} material={material} {...props} />
          ))}
        >
          {(args) =>
            isArray
              ? children(...args)
              : children(
                  Object.keys(meshes)
                    .filter((key) => meshes[key].isMesh)
                    .reduce((acc, key, i) => ({ ...acc, [key]: args[i] }), {})
                )
          }
        </Composer>
      </group>
    )
  }
)

/** Idea and implementation for global instances and instanced attributes by
/*  Matias Gonzalez Fernandez https://x.com/matiNotFound
/*  and Paul Henschel https://x.com/0xca0a
*/
export function createInstances<T = InstanceProps>() {
  const context = React.createContext<Api>(null!)
  return [
    React.forwardRef<THREE.InstancedMesh, InstancesProps>((props, fref) => (
      <Instances ref={fref} context={context} {...props} />
    )),
    React.forwardRef<PositionMesh & T, T & InstanceProps>((props, fref) => (
      <Instance ref={fref} context={context} {...props} />
    )),
  ] as const
}

export const InstancedAttribute = React.forwardRef(
  ({ name, defaultValue, normalized, usage = THREE.DynamicDrawUsage }: InstancedAttributeProps, fref) => {
    const ref = React.useRef<THREE.InstancedBufferAttribute>(null!)
    React.useImperativeHandle(fref, () => ref.current, [])
    React.useLayoutEffect(() => {
      const parent = (ref.current as any).__r3f.parent
      parent.geometry.attributes[name] = ref.current
      const value = Array.isArray(defaultValue) ? defaultValue : [defaultValue]
      const array = Array.from({ length: parent.userData.limit }, () => value).flat()
      ref.current.array = new Float32Array(array)
      ref.current.itemSize = value.length
      ref.current.count = array.length / ref.current.itemSize
      return () => {
        delete parent.geometry.attributes[name]
      }
    }, [name])
    let iterations = 0
    useFrame(() => {
      const parent = (ref.current as any).__r3f.parent
      if (parent.userData.frames === Infinity || iterations < parent.userData.frames) {
        for (let i = 0; i < parent.userData.instances.length; i++) {
          const instance = parent.userData.instances[i].current
          const value = instance[name]
          if (value !== undefined) {
            ref.current.set(
              Array.isArray(value) ? value : typeof value.toArray === 'function' ? value.toArray() : [value],
              i * ref.current.itemSize
            )
            ref.current.needsUpdate = true
          }
        }
        iterations++
      }
    })
    return <instancedBufferAttribute ref={ref} usage={usage} normalized={normalized} />
  }
)
