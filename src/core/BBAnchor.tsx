import * as React from 'react'
import * as THREE from 'three'
import { ThreeElements, useFrame } from '@react-three/fiber'

const boundingBox = /* @__PURE__ */ new THREE.Box3()
const boundingBoxSize = /* @__PURE__ */ new THREE.Vector3()

export type BBAnchorProps = ThreeElements['group'] & {
  anchor: THREE.Vector3 | [number, number, number]
}

export const BBAnchor = ({ anchor, ...props }: BBAnchorProps) => {
  const ref = React.useRef<THREE.Group>(null!)
  const parentRef = React.useRef<THREE.Object3D | null>(null)

  // Reattach group created by this component to the parent's parent,
  // so it becomes a sibling of its initial parent.
  // We do that so the children have no impact on a bounding box of a parent.
  React.useEffect(() => {
    if (ref.current?.parent?.parent) {
      parentRef.current = ref.current.parent
      ref.current.parent.parent.add(ref.current)
    }
  }, [])

  useFrame(() => {
    if (parentRef.current) {
      boundingBox.setFromObject(parentRef.current)
      boundingBox.getSize(boundingBoxSize)

      ref.current.position.set(
        parentRef.current.position.x + (boundingBoxSize.x * (Array.isArray(anchor) ? anchor[0] : anchor.x)) / 2,
        parentRef.current.position.y + (boundingBoxSize.y * (Array.isArray(anchor) ? anchor[1] : anchor.y)) / 2,
        parentRef.current.position.z + (boundingBoxSize.z * (Array.isArray(anchor) ? anchor[2] : anchor.z)) / 2
      )
    }
  })

  return <group ref={ref} {...props} />
}
