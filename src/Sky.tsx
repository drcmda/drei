import React, { forwardRef, useMemo } from 'react'
import { ReactThreeFiber } from 'react-three-fiber'
import { Sky as SkyImpl } from 'three/examples/jsm/objects/Sky'
import { Vector3 } from 'three'

type Props = {
  distance?: number
  sunPosition?: ReactThreeFiber.Vector3
  mieCoefficient?: number
  mieDirectionalG?: number
  rayleigh?: number
  turbidity?: number
}

export type Sky = Props & ReactThreeFiber.Object3DNode<SkyImpl, typeof SkyImpl>

declare global {
  namespace JSX {
    interface IntrinsicElements {
      skyImpl: Sky
    }
  }
}

export const Sky = forwardRef(
  (
    {
      distance = 100,
      mieCoefficient = 0.005,
      mieDirectionalG = 0.8,
      rayleigh = 1,
      turbidity = 2,
      sunPosition = [0, Math.PI, 0],
      ...props
    }: Props,
    ref
  ) => {
    const scale = useMemo(() => new Vector3().setScalar(distance), [distance])
    const sky = useMemo(() => new SkyImpl(), [])

    return (
      <primitive
        object={sky}
        ref={ref}
        material-uniforms-mieCoefficient-value={mieCoefficient}
        material-uniforms-mieDirectionalG-value={mieDirectionalG}
        material-uniforms-rayleigh-value={rayleigh}
        material-uniforms-sunPosition-value={sunPosition}
        material-uniforms-turbidity-value={turbidity}
        scale={scale}
        {...props}
      />
    )
  }
)
