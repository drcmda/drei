import {
  Box3,
  EventDispatcher,
  MathUtils,
  Matrix4,
  OrthographicCamera,
  PerspectiveCamera,
  Quaternion,
  Raycaster,
  Sphere,
  Spherical,
  Vector2,
  Vector3,
  Vector4,
} from 'three'

import * as React from 'react'
import { forwardRef, useMemo, useEffect } from 'react'
import { extend, useFrame, useThree, ReactThreeFiber, EventManager, ThreeElement } from '@react-three/fiber'

import CameraControlsImpl from 'camera-controls'
import { ForwardRefComponent, Overwrite } from '../helpers/ts-utils'

export type CameraControlsProps = Omit<
  Overwrite<
    ThreeElement<typeof CameraControlsImpl>,
    {
      camera?: PerspectiveCamera | OrthographicCamera
      domElement?: HTMLElement
      makeDefault?: boolean
      onStart?: (e?: { type: 'controlstart' }) => void
      onEnd?: (e?: { type: 'controlend' }) => void
      onChange?: (e?: { type: 'update' }) => void
      events?: boolean // Wether to enable events during controls interaction
      regress?: boolean
    }
  >,
  'ref' | 'args' | keyof EventDispatcher
>

export const CameraControls: ForwardRefComponent<CameraControlsProps, CameraControlsImpl> = /* @__PURE__ */ forwardRef<
  CameraControlsImpl,
  CameraControlsProps
>((props, ref) => {
  // useMemo is used here instead of useEffect, otherwise the useMemo below runs first and throws
  useMemo(() => {
    // to allow for tree shaking, we only import the subset of THREE that is used by camera-controls
    // see https://github.com/yomotsu/camera-controls#important
    const subsetOfTHREE = {
      Box3,
      MathUtils: {
        clamp: MathUtils.clamp,
      },
      Matrix4,
      Quaternion,
      Raycaster,
      Sphere,
      Spherical,
      Vector2,
      Vector3,
      Vector4,
    }

    CameraControlsImpl.install({ THREE: subsetOfTHREE })
    extend({ CameraControlsImpl })
  }, [])

  const { camera, domElement, makeDefault, onStart, onEnd, onChange, regress, ...restProps } = props

  const defaultCamera = useThree((state) => state.camera)
  const gl = useThree((state) => state.gl)
  const invalidate = useThree((state) => state.invalidate)
  const events = useThree((state) => state.events) as EventManager<HTMLElement>
  const setEvents = useThree((state) => state.setEvents)
  const set = useThree((state) => state.set)
  const get = useThree((state) => state.get)
  const performance = useThree((state) => state.performance)

  const explCamera = camera || defaultCamera
  const explDomElement = (domElement || events.connected || gl.domElement) as HTMLElement

  const controls = useMemo(() => new CameraControlsImpl(explCamera), [explCamera])

  useFrame((state, delta) => {
    if (controls.enabled) controls.update(delta)
  }, -1)

  useEffect(() => {
    controls.connect(explDomElement)
    return () => void controls.disconnect()
  }, [explDomElement, controls])

  useEffect(() => {
    const callback = (e) => {
      invalidate()
      if (regress) performance.regress()
      if (onChange) onChange(e)
    }

    const onStartCb: CameraControlsProps['onStart'] = (e) => {
      if (onStart) onStart(e)
    }

    const onEndCb: CameraControlsProps['onEnd'] = (e) => {
      if (onEnd) onEnd(e)
    }

    controls.addEventListener('update', callback)
    controls.addEventListener('controlstart', onStartCb)
    controls.addEventListener('controlend', onEndCb)
    controls.addEventListener('control', callback)
    controls.addEventListener('transitionstart', callback)
    controls.addEventListener('wake', callback)

    return () => {
      controls.removeEventListener('update', callback)
      controls.removeEventListener('controlstart', onStartCb)
      controls.removeEventListener('controlend', onEndCb)
      controls.removeEventListener('control', callback)
      controls.removeEventListener('transitionstart', callback)
      controls.removeEventListener('wake', callback)
    }
  }, [controls, onStart, onEnd, invalidate, setEvents, regress, onChange])

  useEffect(() => {
    if (makeDefault) {
      const old = get().controls
      set({ controls: controls as unknown as EventDispatcher })
      return () => set({ controls: old })
    }
  }, [makeDefault, controls])

  return <primitive ref={ref} object={controls} {...restProps} />
})

export type CameraControls = CameraControlsImpl
