import * as React from 'react'
import { Mesh, Shape, ExtrudeBufferGeometry } from 'three'
import { NamedArrayTuple } from '../helpers/ts-utils'

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

type Props = {
  args?: NamedArrayTuple<(width?: number, height?: number, depth?: number) => void>
  radius?: number
  smoothness?: number
} & Omit<JSX.IntrinsicElements['mesh'], 'args'>

export const RoundedBox = React.forwardRef<Mesh, Props>(function RoundedBox(
  { args: [width = 1, height = 1, depth = 1] = [], radius = 0.05, smoothness = 4, children, ...rest },
  ref
) {
  const shape = React.useMemo(() => createShape(width, height, radius), [width, height, radius])
  const params = React.useMemo(
    () => ({
      depth: depth - radius * 2,
      bevelEnabled: true,
      bevelSegments: smoothness * 2,
      steps: 1,
      bevelSize: radius - eps,
      bevelThickness: radius,
      curveSegments: smoothness,
    }),
    [depth, radius, smoothness]
  )
  const geomRef = React.useRef<ExtrudeBufferGeometry>()

  React.useLayoutEffect(() => {
    if (geomRef.current) {
      geomRef.current.center()
    }
  }, [shape, params])

  return (
    <mesh ref={ref} {...rest}>
      <extrudeBufferGeometry attach="geometry" ref={geomRef} args={[shape, params]} />
      {children}
    </mesh>
  )
})
