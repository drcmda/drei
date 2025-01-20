import { ThreeElements, useFrame } from '@react-three/fiber'
import * as React from 'react'
import { forwardRef, useRef } from 'react'
import { Object3D, Vector3 } from 'three'
import { calculateScaleFactor } from './calculateScaleFactor'
import { ForwardRefComponent } from '../helpers/ts-utils'

const worldPos = /* @__PURE__ */ new Vector3()

export type ScreenSizerProps = Omit<ThreeElements['object3D'], 'ref'> & {
  /** Scale factor. Defaults to 1, which equals 1 pixel size. */
  scale?: number
}

/**
 * Wraps children in an `Object3D` and attempts to scale from
 * world units to screen units * scale factor.
 *
 * For example, this will render a box of roughly 1x1 pixel size,
 * independently of how far the camera is.
 *
 * ```jsx
 * <ScreenSizer>
 *   <Box />
 * </ScreenSizer>
 * ```
 */
export const ScreenSizer: ForwardRefComponent<ScreenSizerProps, Object3D> = /* @__PURE__ */ forwardRef<
  Object3D,
  ScreenSizerProps
>(({ scale = 1, ...props }, ref) => {
  const container = useRef<Object3D>(null!)
  React.useImperativeHandle(ref, () => container.current, [])

  useFrame((state) => {
    const obj = container.current
    if (!obj) return
    const sf = calculateScaleFactor(obj.getWorldPosition(worldPos), scale, state.camera, state.size)
    obj.scale.setScalar(sf * scale)
  })

  return <object3D ref={container} {...props} />
})
