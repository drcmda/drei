import * as React from 'react'
import * as THREE from 'three'
import { ReactThreeFiber, type ThreeElements } from '@react-three/fiber'
import { LineSegmentsGeometry, LineMaterial, LineMaterialParameters, Line2, LineSegments2 } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { Line } from './Line'

export type EdgesRef = THREE.Mesh<LineSegmentsGeometry, LineMaterial>
export type EdgesProps = Partial<ThreeElements['mesh']> & {
  threshold?: number
  lineWidth?: number
} & Omit<LineMaterialParameters, 'vertexColors' | 'color'> &
  Omit<ReactThreeFiber.Object3DNode<Line2, typeof Line2>, 'args'> &
  Omit<ReactThreeFiber.Object3DNode<LineMaterial, [LineMaterialParameters]>, 'color' | 'vertexColors' | 'args'> & {
    color?: THREE.ColorRepresentation
  }

export const Edges: ForwardRefComponent<EdgesProps, EdgesRef> = /* @__PURE__ */ React.forwardRef<EdgesRef, EdgesProps>(
  ({ threshold = 15, ...props }: EdgesProps, fref) => {
    const ref = React.useRef<LineSegments2>(null!)
    React.useImperativeHandle(fref, () => ref.current, [])

    const tmpPoints = React.useMemo(() => [0, 0, 0, 1, 0, 0], [])
    const memoizedGeometry = React.useRef<THREE.BufferGeometry>()
    const memoizedThreshold = React.useRef<number>()

    React.useLayoutEffect(() => {
      const parent = ref.current.parent as THREE.Mesh
      if (parent) {
        const geometry = parent.geometry
        if (geometry !== memoizedGeometry.current || threshold !== memoizedThreshold.current) {
          memoizedGeometry.current = geometry
          memoizedThreshold.current = threshold
          const points = (new THREE.EdgesGeometry(geometry, threshold).attributes.position as THREE.BufferAttribute)
            .array as Float32Array
          ref.current.geometry.setPositions(points)
          ref.current.geometry.attributes.instanceStart.needsUpdate = true
          ref.current.geometry.attributes.instanceEnd.needsUpdate = true
          ref.current.computeLineDistances()
        }
      }
    })

    return <Line segments points={tmpPoints} ref={ref} raycast={() => null} {...props} />
  }
)
