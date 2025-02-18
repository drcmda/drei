import * as React from 'react'
import { Mesh, Shape, ExtrudeGeometry } from 'three'
import { ForwardRefComponent, NamedArrayTuple } from '../helpers/ts-utils'
import { toCreasedNormals } from 'three-stdlib'
import { ThreeElements } from '@react-three/fiber'

const eps = 0.00001

function createShape(width: number, height: number, radius0: number) {
  const shape = new Shape()
  const radius = radius0 - eps
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true)
  shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true)
  shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true)
  shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true)
  return shape
}

export type RoundedBoxProps = {
  args?: NamedArrayTuple<(width?: number, height?: number, depth?: number) => void>
  radius?: number
  smoothness?: number
  bevelSegments?: number
  steps?: number
  creaseAngle?: number
} & Omit<ThreeElements['mesh'], 'ref' | 'args'>

export const RoundedBox: ForwardRefComponent<RoundedBoxProps, Mesh> = /* @__PURE__ */ React.forwardRef<
  Mesh,
  RoundedBoxProps
>(function RoundedBox(
  {
    args: [width = 1, height = 1, depth = 1] = [],
    radius = 0.05,
    steps = 1,
    smoothness = 4,
    bevelSegments = 4,
    creaseAngle = 0.4,
    children,
    ...rest
  },
  ref
) {
  const shape = React.useMemo(() => createShape(width, height, radius), [width, height, radius])
  const params = React.useMemo(
    () => ({
      depth: depth - radius * 2,
      bevelEnabled: true,
      bevelSegments: bevelSegments * 2,
      steps,
      bevelSize: radius - eps,
      bevelThickness: radius,
      curveSegments: smoothness,
    }),
    [depth, radius, smoothness]
  )
  const geomRef = React.useRef<ExtrudeGeometry>(null!)

  React.useLayoutEffect(() => {
    if (geomRef.current) {
      geomRef.current.center()
      toCreasedNormals(geomRef.current, creaseAngle)
    }
  }, [shape, params])

  return (
    <mesh ref={ref} {...rest}>
      <extrudeGeometry ref={geomRef} args={[shape, params]} />
      {children}
    </mesh>
  )
})
