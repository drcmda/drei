import * as React from 'react'
import { Object3D, Group } from 'three'
import { useThree, ReactThreeFiber } from 'react-three-fiber'
import { TransformControls as TransformControlsImpl } from 'three/examples/jsm/controls/TransformControls'
import useEffectfulState from '../helpers/useEffectfulState'
import pick from 'lodash.pick'
import omit from 'lodash.omit'

export type TransformControls = ReactThreeFiber.Object3DNode<TransformControlsImpl, typeof TransformControlsImpl>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      transformControlsImpl: TransformControls
    }
  }
}

type Props = JSX.IntrinsicElements['group'] & {
  enabled: boolean
  axis: string | null
  mode: string
  translationSnap: number | null
  rotationSnap: number | null
  scaleSnap?: number | null
  space: string
  size: number
  dragging: boolean
  showX: boolean
  showY: boolean
  showZ: boolean
}

export const TransformControls = React.forwardRef(
  ({ children, ...props }: { children: React.ReactElement<Object3D> } & TransformControls, ref) => {
    const transformOnlyPropNames = [
      'enabled',
      'axis',
      'mode',
      'translationSnap',
      'rotationSnap',
      'scaleSnap',
      'space',
      'size',
      'dragging',
      'showX',
      'showY',
      'showZ',
    ]

    const { camera, ...rest } = props
    const transformProps = pick(rest, transformOnlyPropNames)
    const objectProps = omit(rest, transformOnlyPropNames)

    const { camera: defaultCamera, gl, invalidate } = useThree()
    const explCamera = camera || defaultCamera

    const controls = useEffectfulState(
      () => {
        if (explCamera) {
          return new TransformControlsImpl(explCamera, gl.domElement)
        }
      },
      [explCamera, gl.domElement],
      ref as any
    )

    const group = React.useRef<Group>()
    React.useLayoutEffect(() => void controls?.attach(group.current as Object3D), [children, controls])

    React.useEffect(() => {
      controls?.addEventListener?.('change', invalidate)
      return () => controls?.removeEventListener?.('change', invalidate)
    }, [controls, invalidate])

    return controls ? (
      <>
        <primitive dispose={undefined} object={controls} {...transformProps} />
        <group ref={group} {...objectProps}>
          {children}
        </group>
      </>
    ) : null
  }
)
