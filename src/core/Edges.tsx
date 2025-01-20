import * as React from 'react'
import * as THREE from 'three'
import { ThreeElement, type ThreeElements } from '@react-three/fiber'
import { LineSegmentsGeometry, LineMaterial, LineMaterialParameters, Line2, LineSegments2 } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { Line } from './Line'

export type EdgesRef = THREE.Mesh<LineSegmentsGeometry, LineMaterial>
export type EdgesProps = Partial<ThreeElements['mesh']> & {
  threshold?: number
  lineWidth?: number
} & Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
  Omit<ThreeElement<typeof Line2>, 'args' | 'geometry'> &
  Omit<ThreeElement<typeof LineMaterial>, 'color' | 'vertexColors' | 'args'> & {
    geometry?: THREE.BufferGeometry
    color?: THREE.ColorRepresentation
  }

export const Edges: ForwardRefComponent<EdgesProps, EdgesRef> = /* @__PURE__ */ React.forwardRef<EdgesRef, EdgesProps>(
  ({ threshold = 15, geometry: explicitGeometry, ...props }: EdgesProps, fref) => {
    const ref = React.useRef<LineSegments2>(null!)
    React.useImperativeHandle(fref, () => ref.current, [])

    const tmpPoints = React.useMemo(() => [0, 0, 0, 1, 0, 0], [])
    const memoizedGeometry = React.useRef<THREE.BufferGeometry>(null)
    const memoizedThreshold = React.useRef<number>(null)

    React.useLayoutEffect(() => {
      const parent = ref.current.parent as THREE.Mesh
      const geometry = explicitGeometry ?? parent?.geometry
      if (!geometry) return

      const cached = memoizedGeometry.current === geometry && memoizedThreshold.current === threshold
      if (cached) return
      memoizedGeometry.current = geometry
      memoizedThreshold.current = threshold

      const points = (new THREE.EdgesGeometry(geometry, threshold).attributes.position as THREE.BufferAttribute)
        .array as Float32Array
      ref.current.geometry.setPositions(points)
      ref.current.geometry.attributes.instanceStart.needsUpdate = true
      ref.current.geometry.attributes.instanceEnd.needsUpdate = true
      ref.current.computeLineDistances()
    })

    return <Line segments points={tmpPoints} ref={ref as any} raycast={() => null} {...props} />
  }
)
