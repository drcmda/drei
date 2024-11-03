/**
 * Original idea by https://x.com/verekia
 */

import * as React from 'react'

export function MultiMaterial(props: JSX.IntrinsicElements['group']) {
  const group = React.useRef(null!)
  React.useLayoutEffect(() => {
    const parent = (group.current as any)?.parent
    const geometry = parent?.geometry
    if (geometry) {
      const oldMaterial = parent.material
      parent.material = (group.current as any).__r3f.objects
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
