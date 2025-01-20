import { EventManager, RootState, ThreeElement, useThree } from '@react-three/fiber'
import { DomEvent } from '@react-three/fiber/dist/declarations/src/core/events'
import * as React from 'react'
import * as THREE from 'three'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type PointerLockControlsProps = Omit<ThreeElement<typeof PointerLockControlsImpl>, 'ref'> & {
  domElement?: HTMLElement
  selector?: string
  enabled?: boolean
  camera?: THREE.Camera
  onChange?: (e?: THREE.Event) => void
  onLock?: (e?: THREE.Event) => void
  onUnlock?: (e?: THREE.Event) => void
  makeDefault?: boolean
}

export const PointerLockControls: ForwardRefComponent<PointerLockControlsProps, PointerLockControlsImpl> =
  /* @__PURE__ */ React.forwardRef<PointerLockControlsImpl, PointerLockControlsProps>(
    ({ domElement, selector, onChange, onLock, onUnlock, enabled = true, makeDefault, ...props }, ref) => {
      const { camera, ...rest } = props
      const setEvents = useThree((state) => state.setEvents)
      const gl = useThree((state) => state.gl)
      const defaultCamera = useThree((state) => state.camera)
      const invalidate = useThree((state) => state.invalidate)
      const events = useThree((state) => state.events) as EventManager<HTMLElement>
      const get = useThree((state) => state.get)
      const set = useThree((state) => state.set)
      const explCamera = camera || defaultCamera
      const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement

      const controls = React.useMemo(() => new PointerLockControlsImpl(explCamera), [explCamera])

      React.useEffect(() => {
        if (enabled) {
          controls.connect(explDomElement)
          // Force events to be centered while PLC is active
          const oldComputeOffsets = get().events.compute
          setEvents({
            compute(event: DomEvent, state: RootState) {
              const offsetX = state.size.width / 2
              const offsetY = state.size.height / 2
              state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1)
              state.raycaster.setFromCamera(state.pointer, state.camera)
            },
          })
          return () => {
            controls.disconnect()
            setEvents({ compute: oldComputeOffsets })
          }
        }
      }, [enabled, controls])

      React.useEffect(() => {
        const callback = (e: THREE.Event) => {
          invalidate()
          if (onChange) onChange(e)
        }

        controls.addEventListener('change', callback)

        if (onLock) controls.addEventListener('lock', onLock)
        if (onUnlock) controls.addEventListener('unlock', onUnlock)

        // Enforce previous interaction
        const handler = () => controls.lock()
        const elements = selector ? Array.from(document.querySelectorAll(selector)) : [document]
        elements.forEach((element) => element && element.addEventListener('click', handler))

        return () => {
          controls.removeEventListener('change', callback)
          if (onLock) controls.removeEventListener('lock', onLock)
          if (onUnlock) controls.removeEventListener('unlock', onUnlock)
          elements.forEach((element) => (element ? element.removeEventListener('click', handler) : undefined))
        }
      }, [onChange, onLock, onUnlock, selector, controls, invalidate])

      React.useEffect(() => {
        if (makeDefault) {
          const old = get().controls
          // @ts-ignore https://github.com/three-types/three-ts-types/pull/1398
          set({ controls })
          return () => set({ controls: old })
        }
      }, [makeDefault, controls])

      return <primitive ref={ref} object={controls} {...rest} />
    }
  )
