import { ReactThreeFiber, ThreeElement, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { DeviceOrientationControls as DeviceOrientationControlsImp } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type DeviceOrientationControlsProps = Omit<ThreeElement<typeof DeviceOrientationControlsImp>, 'ref' | 'args'> & {
  camera?: THREE.Camera
  onChange?: (e?: THREE.Event) => void
  makeDefault?: boolean
}

export const DeviceOrientationControls: ForwardRefComponent<
  DeviceOrientationControlsProps,
  DeviceOrientationControlsImp
> = /* @__PURE__ */ React.forwardRef<DeviceOrientationControlsImp, DeviceOrientationControlsProps>(
  (props: DeviceOrientationControlsProps, ref) => {
    const { camera, onChange, makeDefault, ...rest } = props
    const defaultCamera = useThree((state) => state.camera)
    const invalidate = useThree((state) => state.invalidate)
    const get = useThree((state) => state.get)
    const set = useThree((state) => state.set)
    const explCamera = camera || defaultCamera
    const controls = React.useMemo(() => new DeviceOrientationControlsImp(explCamera), [explCamera])

    React.useEffect(() => {
      const callback = (e: THREE.Event) => {
        invalidate()
        if (onChange) onChange(e)
      }
      controls?.addEventListener?.('change', callback)
      return () => controls?.removeEventListener?.('change', callback)
    }, [onChange, controls, invalidate])

    useFrame(() => controls?.update(), -1)

    React.useEffect(() => {
      const current = controls
      current?.connect()
      return () => current?.dispose()
    }, [controls])

    React.useEffect(() => {
      if (makeDefault) {
        const old = get().controls
        // @ts-ignore https://github.com/three-types/three-ts-types/pull/1398
        set({ controls })
        return () => set({ controls: old })
      }
    }, [makeDefault, controls])

    return controls ? <primitive ref={ref} object={controls} {...rest} /> : null
  }
)
