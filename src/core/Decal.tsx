import * as React from 'react'
import * as THREE from 'three'
import * as FIBER from '@react-three/fiber'
import { applyProps } from '@react-three/fiber'
import { DecalGeometry } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type DecalProps = Omit<FIBER.ThreeElements['mesh'], 'ref' | 'children'> & {
  debug?: boolean
  mesh?: React.RefObject<THREE.Mesh>
  position?: FIBER.Vector3
  /** FIBER.Euler for manual orientation or a single float for closest-vertex-normal orient */
  rotation?: FIBER.Euler | number
  scale?: FIBER.Vector3
  map?: THREE.Texture
  children?: React.ReactNode
  polygonOffsetFactor?: number
  depthTest?: boolean
}

function isArray(vec: any): vec is number[] {
  return Array.isArray(vec)
}

function vecToArray(vec: number[] | FIBER.Vector3 | FIBER.Euler | number = [0, 0, 0]) {
  if (isArray(vec)) {
    return vec
  } else if (vec instanceof THREE.Vector3 || vec instanceof THREE.Euler) {
    return [vec.x, vec.y, vec.z]
  } else {
    return [vec, vec, vec]
  }
}

export const Decal: ForwardRefComponent<DecalProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef<
  THREE.Mesh,
  DecalProps
>(function Decal(
  { debug, depthTest = false, polygonOffsetFactor = -10, map, mesh, children, position, rotation, scale, ...props },
  forwardRef
) {
  const ref = React.useRef<THREE.Mesh>(null!)
  React.useImperativeHandle(forwardRef, () => ref.current)
  const helper = React.useRef<THREE.Mesh>(null!)
  const state = React.useRef({
    position: new THREE.Vector3(),
    rotation: new THREE.Euler(),
    scale: new THREE.Vector3(1, 1, 1),
  })

  React.useLayoutEffect(() => {
    const parent = mesh?.current || ref.current.parent
    const target = ref.current
    if (!(parent instanceof THREE.Mesh)) {
      throw new Error('Decal must have a Mesh as parent or specify its "mesh" prop')
    }

    if (parent) {
      applyProps(state.current as any, { position, scale })

      // Zero out the parents matrix world for this operation
      const matrixWorld = parent.matrixWorld.clone()
      parent.matrixWorld.identity()

      if (!rotation || typeof rotation === 'number') {
        const o = new THREE.Object3D()
        o.position.copy(state.current.position)

        // Thanks https://x.com/N8Programs !
        const vertices = parent.geometry.attributes.position.array
        if (parent.geometry.attributes.normal === undefined) parent.geometry.computeVertexNormals()
        const normal = parent.geometry.attributes.normal.array
        let distance = Infinity
        let closest = new THREE.Vector3()
        let closestNormal = new THREE.Vector3()
        const ox = o.position.x
        const oy = o.position.y
        const oz = o.position.z
        const vLength = vertices.length
        let chosenIdx = -1
        for (let i = 0; i < vLength; i += 3) {
          const x = vertices[i]
          const y = vertices[i + 1]
          const z = vertices[i + 2]
          const xDiff = x - ox
          const yDiff = y - oy
          const zDiff = z - oz
          const distSquared = xDiff * xDiff + yDiff * yDiff + zDiff * zDiff
          if (distSquared < distance) {
            distance = distSquared
            chosenIdx = i
          }
        }
        closestNormal.fromArray(normal, chosenIdx)

        // Get vector tangent to normal
        o.lookAt(o.position.clone().add(closestNormal))
        o.rotateZ(Math.PI)
        o.rotateY(Math.PI)

        if (typeof rotation === 'number') o.rotateZ(rotation)
        applyProps(state.current as any, { rotation: o.rotation })
      } else {
        applyProps(state.current as any, { rotation })
      }

      target.geometry = new DecalGeometry(parent, state.current.position, state.current.rotation, state.current.scale)
      // Reset parents matix-world
      parent.matrixWorld = matrixWorld

      return () => {
        target.geometry.dispose()
      }
    }
  }, [mesh, ...vecToArray(position), ...vecToArray(scale), ...vecToArray(rotation)])

  React.useLayoutEffect(() => {
    if (helper.current) {
      applyProps(helper.current as any, state.current)
      // Prevent the helpers from blocking rays
      helper.current.traverse((child) => (child.raycast = () => null))
    }
  }, [debug])

  // <meshStandardMaterial transparent polygonOffset polygonOffsetFactor={-10} {...props} />}
  return (
    <mesh
      ref={ref}
      material-transparent
      material-polygonOffset
      material-polygonOffsetFactor={polygonOffsetFactor}
      material-depthTest={depthTest}
      material-map={map}
      {...props}
    >
      {children}
      {debug && (
        <mesh ref={helper}>
          <boxGeometry />
          <meshNormalMaterial wireframe />
          <axesHelper />
        </mesh>
      )}
    </mesh>
  )
})
