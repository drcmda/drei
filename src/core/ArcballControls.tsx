import { EventManager, ReactThreeFiber, ThreeElement, useFrame, useThree } from '@react-three/fiber'
import * as React from 'react'
import { forwardRef, useEffect, useMemo } from 'react'
import { ArcballControls as ArcballControlsImpl } from 'three-stdlib'

import type { Event, OrthographicCamera, PerspectiveCamera } from 'three'
import { ForwardRefComponent, Overwrite } from '../helpers/ts-utils'

export type ArcballControlsProps = Omit<
  Overwrite<
    ThreeElement<typeof ArcballControlsImpl>,
    {
      target?: ReactThreeFiber.Vector3
      camera?: OrthographicCamera | PerspectiveCamera
      domElement?: HTMLElement
      regress?: boolean
      makeDefault?: boolean
      onChange?: (e?: Event) => void
      onStart?: (e?: Event) => void
      onEnd?: (e?: Event) => void
    }
  >,
  'ref' | 'args'
>

export const ArcballControls: ForwardRefComponent<ArcballControlsProps, ArcballControlsImpl> =
  /* @__PURE__ */ forwardRef<ArcballControlsImpl, ArcballControlsProps>(
    ({ camera, makeDefault, regress, domElement, onChange, onStart, onEnd, ...restProps }, ref) => {
      const invalidate = useThree((state) => state.invalidate)
      const defaultCamera = useThree((state) => state.camera)
      const gl = useThree((state) => state.gl)
      const events = useThree((state) => state.events) as EventManager<HTMLElement>
      const set = useThree((state) => state.set)
      const get = useThree((state) => state.get)
      const performance = useThree((state) => state.performance)
      const explCamera = camera || defaultCamera
      const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement
      const controls = useMemo(() => new ArcballControlsImpl(explCamera), [explCamera])

      useFrame(() => {
        if (controls.enabled) controls.update()
      }, -1)

      useEffect(() => {
        controls.connect(explDomElement)
        return () => void controls.dispose()
      }, [explDomElement, regress, controls, invalidate])

      useEffect(() => {
        const callback = (e: Event) => {
          invalidate()
          if (regress) performance.regress()
          if (onChange) onChange(e)
        }

        controls.addEventListener('change', callback)
        if (onStart) controls.addEventListener('start', onStart)
        if (onEnd) controls.addEventListener('end', onEnd)

        return () => {
          controls.removeEventListener('change', callback)
          if (onStart) controls.removeEventListener('start', onStart)
          if (onEnd) controls.removeEventListener('end', onEnd)
        }
      }, [onChange, onStart, onEnd])

      useEffect(() => {
        if (makeDefault) {
          const old = get().controls
          // @ts-ignore https://github.com/three-types/three-ts-types/pull/1398
          set({ controls })
          return () => set({ controls: old })
        }
      }, [makeDefault, controls])

      return <primitive ref={ref} object={controls} {...restProps} />
    }
  )
