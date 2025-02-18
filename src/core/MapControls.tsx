import { EventManager, ReactThreeFiber, ThreeElement, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { MapControls as MapControlsImpl } from 'three-stdlib'
import { ForwardRefComponent, Overwrite } from '../helpers/ts-utils'

export type MapControlsProps = Omit<
  Overwrite<
    ThreeElement<typeof MapControlsImpl>,
    {
      target?: ReactThreeFiber.Vector3
      camera?: THREE.Camera
      makeDefault?: boolean
      onChange?: (e?: THREE.Event) => void
      onStart?: (e?: THREE.Event) => void
      onEnd?: (e?: THREE.Event) => void
      domElement?: HTMLElement
    }
  >,
  'ref' | 'args'
>

export const MapControls: ForwardRefComponent<MapControlsProps, MapControlsImpl> = /* @__PURE__ */ React.forwardRef<
  MapControlsImpl,
  MapControlsProps
>((props = { enableDamping: true }, ref) => {
  const { domElement, camera, makeDefault, onChange, onStart, onEnd, ...rest } = props
  const invalidate = useThree((state) => state.invalidate)
  const defaultCamera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const events = useThree((state) => state.events) as EventManager<HTMLElement>
  const set = useThree((state) => state.set)
  const get = useThree((state) => state.get)
  const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement

  const explCamera = (camera || defaultCamera) as THREE.OrthographicCamera | THREE.PerspectiveCamera
  const controls = React.useMemo(() => new MapControlsImpl(explCamera), [explCamera])

  React.useEffect(() => {
    controls.connect(explDomElement)
    const callback = (e: THREE.Event) => {
      invalidate()
      if (onChange) onChange(e)
    }
    controls.addEventListener('change', callback)

    if (onStart) controls.addEventListener('start', onStart)
    if (onEnd) controls.addEventListener('end', onEnd)

    return () => {
      controls.dispose()
      controls.removeEventListener('change', callback)
      if (onStart) controls.removeEventListener('start', onStart)
      if (onEnd) controls.removeEventListener('end', onEnd)
    }
  }, [onChange, onStart, onEnd, controls, invalidate, explDomElement])

  React.useEffect(() => {
    if (makeDefault) {
      const old = get().controls
      // @ts-ignore https://github.com/three-types/three-ts-types/pull/1398
      set({ controls })
      return () => set({ controls: old })
    }
  }, [makeDefault, controls])

  useFrame(() => controls.update(), -1)

  return <primitive ref={ref} object={controls} enableDamping {...rest} />
})
