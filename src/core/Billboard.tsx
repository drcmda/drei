import * as React from 'react'
import { Group, Quaternion } from 'three'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type BillboardProps = Omit<ThreeElements['group'], 'ref'> & {
  follow?: boolean
  lockX?: boolean
  lockY?: boolean
  lockZ?: boolean
}

/**
 * Wraps children in a billboarded group. Sample usage:
 *
 * ```js
 * <Billboard>
 *   <Text>hi</Text>
 * </Billboard>
 * ```
 */
export const Billboard: ForwardRefComponent<BillboardProps, Group> = /* @__PURE__ */ React.forwardRef<
  Group,
  BillboardProps
>(function Billboard({ children, follow = true, lockX = false, lockY = false, lockZ = false, ...props }, fref) {
  const inner = React.useRef<Group>(null!)
  const localRef = React.useRef<Group>(null!)
  const q = new Quaternion()

  useFrame(({ camera }) => {
    if (!follow || !localRef.current) return

    // save previous rotation in case we're locking an axis
    const prevRotation = localRef.current.rotation.clone()

    // always face the camera
    localRef.current.updateMatrix()
    localRef.current.updateWorldMatrix(false, false)
    localRef.current.getWorldQuaternion(q)
    camera.getWorldQuaternion(inner.current.quaternion).premultiply(q.invert())

    // readjust any axis that is locked
    if (lockX) localRef.current.rotation.x = prevRotation.x
    if (lockY) localRef.current.rotation.y = prevRotation.y
    if (lockZ) localRef.current.rotation.z = prevRotation.z
  })

  React.useImperativeHandle(fref, () => localRef.current, [])
  return (
    <group ref={localRef} {...props}>
      <group ref={inner}>{children}</group>
    </group>
  )
})
