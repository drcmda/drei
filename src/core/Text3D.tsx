import * as React from 'react'
import * as THREE from 'three'
import { extend, ThreeElement, ThreeElements } from '@react-three/fiber'
import { useMemo } from 'react'
import { mergeVertices, TextGeometry, TextGeometryParameters } from 'three-stdlib'
import { useFont, FontData } from './useFont'
import { ForwardRefComponent } from '../helpers/ts-utils'

declare module '@react-three/fiber' {
  interface ThreeElements {
    renamedTextGeometry: ThreeElement<typeof TextGeometry>
  }
}

export type Text3DProps = Omit<ThreeElements['mesh'], 'ref'> & {
  font: FontData | string
  bevelSegments?: number
  smooth?: number
} & Omit<TextGeometryParameters, 'font'>

const types = ['string', 'number']
const getTextFromChildren = (children) => {
  let label = ''
  const rest: React.ReactNode[] = []
  React.Children.forEach(children, (child) => {
    if (types.includes(typeof child)) label += child + ''
    else rest.push(child)
  })
  return [label, ...rest]
}

export const Text3D: ForwardRefComponent<
  React.PropsWithChildren<Text3DProps & { letterSpacing?: number; lineHeight?: number }>,
  THREE.Mesh
> = /* @__PURE__ */ React.forwardRef<
  THREE.Mesh,
  React.PropsWithChildren<Text3DProps & { letterSpacing?: number; lineHeight?: number }>
>(
  (
    {
      font: _font,
      letterSpacing = 0,
      lineHeight = 1,
      size = 1,
      height = 0.2,
      bevelThickness = 0.1,
      bevelSize = 0.01,
      bevelEnabled = false,
      bevelOffset = 0,
      bevelSegments = 4,
      curveSegments = 8,
      smooth,
      children,
      ...props
    },
    fref
  ) => {
    React.useMemo(() => extend({ RenamedTextGeometry: TextGeometry }), [])

    const ref = React.useRef<THREE.Mesh>(null!)
    const font = useFont(_font)

    const opts = useMemo(() => {
      return {
        font,
        size,
        height,
        bevelThickness,
        bevelSize,
        bevelEnabled,
        bevelSegments,
        bevelOffset,
        curveSegments,
        letterSpacing,
        lineHeight,
      }
    }, [
      font,
      size,
      height,
      bevelThickness,
      bevelSize,
      bevelEnabled,
      bevelSegments,
      bevelOffset,
      curveSegments,
      letterSpacing,
      lineHeight,
    ])

    /**
     * We need the `children` in the deps because we
     * need to be able to do `<Text3d>{state}</Text3d>`.
     */
    const [label, ...rest] = useMemo(() => getTextFromChildren(children), [children])
    const args = React.useMemo(() => [label, opts], [label, opts])

    React.useLayoutEffect(() => {
      if (smooth) {
        ref.current.geometry = mergeVertices(ref.current.geometry, smooth)
        ref.current.geometry.computeVertexNormals()
      }
    }, [args, smooth])

    React.useImperativeHandle(fref, () => ref.current, [])

    return (
      <mesh {...props} ref={ref}>
        <renamedTextGeometry args={args as ThreeElements['renamedTextGeometry']['args']} />
        {rest}
      </mesh>
    )
  }
)
