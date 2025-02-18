/**
 * Original idea by https://x.com/verekia
 */

import { ThreeElements, Instance } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'

export type MultiMaterialProps = Omit<ThreeElements['group'], 'ref'>

export function MultiMaterial(props: MultiMaterialProps) {
  const group = React.useRef<THREE.Group>(null!)
  React.useLayoutEffect(() => {
    const parent = group.current.parent as THREE.Mesh<THREE.BufferGeometry, THREE.Material[]> | undefined
    const geometry = parent?.geometry
    if (geometry) {
      const oldMaterial = parent.material
      parent.material = (group.current as THREE.Group & { __r3f: Instance<THREE.Group> }).__r3f.children.map(
        (instance) => instance.object
      ) as THREE.Material[]
      const oldGroups = [...geometry.groups]
      geometry.clearGroups()
      parent.material.forEach((material, index) => {
        if (index < parent.material.length - 1) material.depthWrite = false
        geometry.addGroup(0, Infinity, index)
      })
      return () => {
        parent.material = oldMaterial
        geometry.groups = oldGroups
      }
    }
  })
  return <group ref={group} {...props} />
}
