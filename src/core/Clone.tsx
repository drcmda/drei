import * as THREE from 'three'
import * as React from 'react'
import { SkeletonUtils } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { ThreeElements } from '@react-three/fiber'

export type CloneProps = Omit<ThreeElements['group'], 'ref' | 'children'> & {
  /** Any pre-existing THREE.Object3D (groups, meshes, ...), or an array of objects */
  object: THREE.Object3D | THREE.Object3D[]
  /** Children will be placed within the object, or within the group that holds arrayed objects */
  children?: React.ReactNode
  /** Can clone materials and/or geometries deeply (default: false) */
  deep?: boolean | 'materialsOnly' | 'geometriesOnly'
  /** The property keys it will shallow-clone (material, geometry, visible, ...) */
  keys?: string[]
  /** Can either spread over props or fill in JSX children, applies to every mesh within */
  inject?: ThreeElements['mesh'] | React.ReactNode | ((object: THREE.Object3D) => React.ReactNode)
  /** Short access castShadow, applied to every mesh within */
  castShadow?: boolean
  /** Short access receiveShadow, applied to every mesh within */
  receiveShadow?: boolean
  isChild?: boolean
}

function createSpread(
  child: THREE.Object3D,
  {
    keys = [
      'near',
      'far',
      'color',
      'distance',
      'decay',
      'penumbra',
      'angle',
      'intensity',
      'skeleton',
      'visible',
      'castShadow',
      'receiveShadow',
      'morphTargetDictionary',
      'morphTargetInfluences',
      'name',
      'geometry',
      'material',
      'position',
      'rotation',
      'scale',
      'up',
      'userData',
      'bindMode',
      'bindMatrix',
      'bindMatrixInverse',
      'skeleton',
    ],
    deep,
    inject,
    castShadow,
    receiveShadow,
  }
) {
  let spread: Record<(typeof keys)[number], any> = {}
  for (const key of keys) {
    spread[key] = child[key]
  }

  if (deep) {
    if (spread.geometry && deep !== 'materialsOnly') spread.geometry = spread.geometry.clone()
    if (spread.material && deep !== 'geometriesOnly') spread.material = spread.material.clone()
  }
  if (inject) {
    if (typeof inject === 'function') spread = { ...spread, children: inject(child) }
    else if (React.isValidElement(inject)) spread = { ...spread, children: inject }
    else spread = { ...spread, ...(inject as any) }
  }

  if (child instanceof THREE.Mesh) {
    if (castShadow) spread.castShadow = true
    if (receiveShadow) spread.receiveShadow = true
  }
  return spread
}

export const Clone: ForwardRefComponent<CloneProps, THREE.Group> = /* @__PURE__ */ React.forwardRef(
  ({ isChild = false, object, children, deep, castShadow, receiveShadow, inject, keys, ...props }, forwardRef) => {
    const config = { keys, deep, inject, castShadow, receiveShadow }
    object = React.useMemo(() => {
      if (isChild === false && !Array.isArray(object)) {
        let isSkinned = false
        object.traverse((object) => {
          if ((object as any).isSkinnedMesh) isSkinned = true
        })
        if (isSkinned) return SkeletonUtils.clone(object)
      }
      return object
    }, [object, isChild])

    // Deal with arrayed clones
    if (Array.isArray(object)) {
      return (
        <group {...props} ref={forwardRef}>
          {object.map((o) => (
            <Clone key={o.uuid} object={o} {...config} />
          ))}
          {children}
        </group>
      )
    }

    // Singleton clones
    const { children: injectChildren, ...spread } = createSpread(object, config)
    const Element = (object.type[0].toLowerCase() + object.type.slice(1)) as unknown as React.ExoticComponent<any>

    return (
      <Element {...spread} {...props} ref={forwardRef}>
        {object.children.map((child) => {
          if (child.type === 'Bone') return <primitive key={child.uuid} object={child} {...config} />
          return <Clone key={child.uuid} object={child} {...config} isChild />
        })}
        {children}
        {injectChildren}
      </Element>
    )
  }
)
