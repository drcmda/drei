/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import { Object3D } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { Falsey } from 'utility-types'

type HelperConstructor = new (...args: any[]) => Object3D & { update: () => void; dispose?: () => void }
type HelperArgs<T> = T extends [any, ...infer R] ? R : never

/**
 * Instantiate a `THREE.*Helper` for an existing node and add it to the scene.
 *
 * Examples:
 *
 * ```ts
 * useHelper(sphereRef, BoxHelper, 'royalblue')
 * useHelper(sphereRef, VertexNormalsHelper, 1, 0xff0000)

 * useHelper(raycasterRef, RaycasterHelper, 20)
 * ```
 */
export function useHelper<H extends HelperConstructor>(
  /** A ref to the node the helper is instantiate on (type inferred from H's ctor 1st param) */
  nodeRef: React.RefObject<ConstructorParameters<H>[0]> | Falsey,
  /** `*Helper` class */
  helperConstructor: H,
  /** Rest of arguments for H (types inferred from H's ctor params, omitting first) */
  ...args: HelperArgs<ConstructorParameters<H>>
) {
  const helperRef = React.useRef<InstanceType<H>>(null!)
  const scene = useThree((state) => state.scene)

  React.useLayoutEffect(() => {
    let currentHelper: InstanceType<H> = undefined!

    if (nodeRef && nodeRef?.current && helperConstructor) {
      helperRef.current = currentHelper = new helperConstructor(nodeRef.current, ...args) as InstanceType<H>
    }

    if (currentHelper) {
      // Prevent the helpers from blocking rays
      currentHelper.traverse((child) => (child.raycast = () => null))
      scene.add(currentHelper)
      return () => {
        helperRef.current = null!
        scene.remove(currentHelper)
        currentHelper.dispose?.()
      }
    }
  }, [scene, helperConstructor, nodeRef, args])

  useFrame(() => void helperRef.current?.update?.())
  return helperRef
}

//

export type HelperProps<H extends HelperConstructor> = {
  /** `*Helper` class */
  type: H
  /** Rest of arguments for H (types inferred from H's ctor params, omitting first) */
  args?: HelperArgs<ConstructorParameters<H>>
}

/**
 * Instantiate a `THREE.*Helper` for parent node and add it to the scene.
 */

export const Helper = <H extends HelperConstructor>({
  type: helperConstructor,
  args = [] as never,
}: HelperProps<H>) => {
  const parentRef = React.useRef<Object3D>(null!)

  useHelper(parentRef, helperConstructor, ...args)

  return (
    <object3D
      ref={(obj) => {
        parentRef.current = obj?.parent!
      }}
    />
  )
}
