import * as React from 'react'
import { Object3D } from 'three'
import { useThree, useFrame } from '@react-three/fiber'
import { Falsey } from 'utility-types'

type HelperType = Object3D & { update: () => void; dispose: () => void }
type HelperConstructor = new (...args: any[]) => any
type HelperArgs<T> = T extends [infer _, ...infer R] ? R : never

export function useHelper<T extends HelperConstructor>(
  object3D: React.RefObject<Object3D> | Falsey,
  helperConstructor: T,
  ...args: HelperArgs<ConstructorParameters<T>>
) {
  const helper = React.useRef<HelperType>(null)
  const scene = useThree((state) => state.scene)
  React.useLayoutEffect(() => {
    let currentHelper: HelperType = undefined!

    if (object3D && object3D?.current && helperConstructor) {
      helper.current = currentHelper = new (helperConstructor as any)(object3D.current, ...args)
    }

    if (currentHelper) {
      // Prevent the helpers from blocking rays
      currentHelper.traverse((child) => (child.raycast = () => null))
      scene.add(currentHelper)
      return () => {
        helper.current = undefined!
        scene.remove(currentHelper)
        currentHelper.dispose?.()
      }
    }
  }, [scene, helperConstructor, object3D, ...args])

  useFrame(() => void helper.current?.update?.())
  return helper
}

//

export type HelperProps<T extends HelperConstructor> = {
  type: T
  args?: HelperArgs<ConstructorParameters<T>>
}

export const Helper = <T extends HelperConstructor>({
  type: helperConstructor,
  args = [] as never,
}: HelperProps<T>) => {
  const thisRef = React.useRef<Object3D>(null!)
  const parentRef = React.useRef<Object3D>(null!)

  React.useLayoutEffect(() => {
    parentRef.current = thisRef.current.parent!
  })

  useHelper(parentRef, helperConstructor, ...args)

  return <object3D ref={thisRef} />
}
