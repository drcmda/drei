import * as React from 'react'
import { Group } from 'three'
import { ThreeElements, useFrame } from '@react-three/fiber'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type ScreenSpaceProps = Omit<ThreeElements['group'], 'ref'> & {
  depth?: number
}

export const ScreenSpace: ForwardRefComponent<ScreenSpaceProps, Group> = /* @__PURE__ */ React.forwardRef<
  Group,
  ScreenSpaceProps
>(({ children, depth = -1, ...rest }, ref) => {
  const localRef = React.useRef<Group>(null!)
  React.useImperativeHandle(ref, () => localRef.current, [])

  useFrame(({ camera }) => {
    localRef.current.quaternion.copy(camera.quaternion)
    localRef.current.position.copy(camera.position)
  })
  return (
    <group ref={localRef} {...rest}>
      <group position-z={-depth}>{children}</group>
    </group>
  )
})
