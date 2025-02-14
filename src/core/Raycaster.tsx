import * as THREE from 'three'
import * as React from 'react'
import { ComponentProps, forwardRef, useRef, useState } from 'react'
import { useFrame, type Vector3 } from '@react-three/fiber'
// import { RaycasterHelper } from '@gsimone/three-raycaster-helper'
import { RaycasterHelper } from '../tmp/raycaster-helper'

import { useHelper } from '..'
import { Falsey } from 'utility-types'

type HelperArgs<T> = T extends [any, ...infer R] ? R : never

type RaycasterProps = Omit<ComponentProps<'raycaster'>, 'args'> & {
  /** Origin of the raycaster  */
  origin: Vector3
  /** Direction of the raycaster  */
  direction: Vector3
} & {
  /** Whether or not to display the RaycasterHelper - you can pass additional params for the ctor here */
  helper?: Falsey | HelperArgs<ConstructorParameters<typeof RaycasterHelper>>
}

function toThreeVec3(v: Vector3) {
  return v instanceof THREE.Vector3 ? v : new THREE.Vector3(...(typeof v === 'number' ? [v, v, v] : v))
}

/**
 * `<raycaster>` wrapper, with a `helper` prop to visualize it
 */
export const Raycaster = forwardRef<THREE.Raycaster, RaycasterProps>(
  ({ origin: _origin, direction: _direction, near, far, helper = false, ...props }, fref) => {
    const origin = toThreeVec3(_origin)
    const direction = toThreeVec3(_direction)

    const [r] = useState(() => new THREE.Raycaster(origin, direction))

    const raycasterRef = useRef<THREE.Raycaster>(null)
    const ref = fref || raycasterRef
    const isCallbackRef = typeof ref === 'function'

    const args = helper || []
    const raycasterHelperRef = useHelper(helper && !isCallbackRef && ref, RaycasterHelper, ...args)

    // Update the hits with intersection results
    useFrame(({ scene }) => {
      if (!helper) return
      if (!ref || isCallbackRef) return

      if (!raycasterHelperRef.current || !ref.current) return
      raycasterHelperRef.current.hits = ref.current.intersectObjects(scene.children)
    })

    return <primitive ref={ref} object={r} {...{ origin, direction, near, far }} {...props} />
  }
)
