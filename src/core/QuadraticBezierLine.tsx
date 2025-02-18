import * as React from 'react'
import { QuadraticBezierCurve3, Vector3 } from 'three'
import { Line2 } from 'three-stdlib'
import { Line, LineProps } from './Line'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type QuadraticBezierLineRef = Line2 & {
  setPoints(
    start: Vector3 | [number, number, number],
    end: Vector3 | [number, number, number],
    mid: Vector3 | [number, number, number]
  ): void
}

export type QuadraticBezierLineProps = Omit<LineProps, 'points' | 'ref'> & {
  start: Vector3 | [number, number, number]
  end: Vector3 | [number, number, number]
  mid?: Vector3 | [number, number, number]
  segments?: number
}

const v = /* @__PURE__ */ new Vector3()
export const QuadraticBezierLine: ForwardRefComponent<QuadraticBezierLineProps, QuadraticBezierLineRef> =
  /* @__PURE__ */ React.forwardRef<QuadraticBezierLineRef, QuadraticBezierLineProps>(function QuadraticBezierLine(
    { start = [0, 0, 0], end = [0, 0, 0], mid, segments = 20, ...rest },
    forwardref
  ) {
    const ref = React.useRef<QuadraticBezierLineRef>(null!)
    React.useImperativeHandle(forwardref, () => ref.current)
    const [curve] = React.useState(
      () => new QuadraticBezierCurve3(undefined as any, undefined as any, undefined as any)
    )
    const getPoints = React.useCallback((start, end, mid, segments = 20) => {
      if (start instanceof Vector3) curve.v0.copy(start)
      else curve.v0.set(...(start as [number, number, number]))
      if (end instanceof Vector3) curve.v2.copy(end)
      else curve.v2.set(...(end as [number, number, number]))
      if (mid instanceof Vector3) {
        curve.v1.copy(mid)
      } else if (Array.isArray(mid)) {
        curve.v1.set(...(mid as [number, number, number]))
      } else {
        curve.v1.copy(
          curve.v0
            .clone()
            .add(curve.v2.clone().sub(curve.v0))
            .add(v.set(0, curve.v0.y - curve.v2.y, 0))
        )
      }
      return curve.getPoints(segments)
    }, [])

    React.useLayoutEffect(() => {
      ref.current.setPoints = (
        start: Vector3 | [number, number, number],
        end: Vector3 | [number, number, number],
        mid: Vector3 | [number, number, number]
      ) => {
        const points = getPoints(start, end, mid)
        if (ref.current.geometry) ref.current.geometry.setPositions(points.map((p) => p.toArray()).flat())
      }
    }, [])

    const points = React.useMemo(() => getPoints(start, end, mid, segments), [start, end, mid, segments])
    return <Line ref={ref} points={points} {...rest} />
  })
