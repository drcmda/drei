import { Box3, Vector3, Sphere, Group, Object3D } from 'three'
import * as React from 'react'
import { ThreeElements, useThree } from '@react-three/fiber'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type OnCenterCallbackProps = {
  /** The next parent above <Center> */
  parent: Object3D
  /** The outmost container group of the <Center> component */
  container: Object3D
  width: number
  height: number
  depth: number
  boundingBox: Box3
  boundingSphere: Sphere
  center: Vector3
  verticalAlignment: number
  horizontalAlignment: number
  depthAlignment: number
}

export type CenterProps = Omit<ThreeElements['group'], 'ref'> & {
  top?: boolean
  right?: boolean
  bottom?: boolean
  left?: boolean
  front?: boolean
  back?: boolean
  /** Disable all axes */
  disable?: boolean
  /** Disable x-axis centering */
  disableX?: boolean
  /** Disable y-axis centering */
  disableY?: boolean
  /** Disable z-axis centering */
  disableZ?: boolean
  /** See https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject */
  precise?: boolean
  /** Callback, fires in the useLayoutEffect phase, after measurement */
  onCentered?: (props: OnCenterCallbackProps) => void
  /** Optional cacheKey to keep the component from recalculating on every render */
  cacheKey?: any
}

export const Center: ForwardRefComponent<CenterProps, Group> = /* @__PURE__ */ React.forwardRef<Group, CenterProps>(
  function Center(
    {
      children,
      disable,
      disableX,
      disableY,
      disableZ,
      left,
      right,
      top,
      bottom,
      front,
      back,
      onCentered,
      precise = true,
      cacheKey = 0,
      ...props
    },
    fRef
  ) {
    const ref = React.useRef<Group>(null!)
    const outer = React.useRef<Group>(null!)
    const inner = React.useRef<Group>(null!)
    React.useLayoutEffect(() => {
      outer.current.matrixWorld.identity()
      const box3 = new Box3().setFromObject(inner.current, precise)
      const center = new Vector3()
      const sphere = new Sphere()
      const width = box3.max.x - box3.min.x
      const height = box3.max.y - box3.min.y
      const depth = box3.max.z - box3.min.z
      box3.getCenter(center)
      box3.getBoundingSphere(sphere)
      const vAlign = top ? height / 2 : bottom ? -height / 2 : 0
      const hAlign = left ? -width / 2 : right ? width / 2 : 0
      const dAlign = front ? depth / 2 : back ? -depth / 2 : 0

      outer.current.position.set(
        disable || disableX ? 0 : -center.x + hAlign,
        disable || disableY ? 0 : -center.y + vAlign,
        disable || disableZ ? 0 : -center.z + dAlign
      )

      // Only fire onCentered if the bounding box has changed
      if (typeof onCentered !== 'undefined') {
        onCentered({
          parent: ref.current.parent!,
          container: ref.current,
          width,
          height,
          depth,
          boundingBox: box3,
          boundingSphere: sphere,
          center: center,
          verticalAlignment: vAlign,
          horizontalAlignment: hAlign,
          depthAlignment: dAlign,
        })
      }
    }, [cacheKey, onCentered, top, left, front, disable, disableX, disableY, disableZ, precise, right, bottom, back])

    React.useImperativeHandle(fRef, () => ref.current, [])

    return (
      <group ref={ref} {...props}>
        <group ref={outer}>
          <group ref={inner}>{children}</group>
        </group>
      </group>
    )
  }
)
