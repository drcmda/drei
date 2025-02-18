import * as THREE from 'three'
import * as React from 'react'
import { ThreeElements } from '@react-three/fiber'

export type ResizeProps = Omit<ThreeElements['group'], 'ref'> & {
  /** Whether to fit into width (x axis), undefined */
  width?: boolean
  /** Whether to fit into height (y axis), undefined */
  height?: boolean
  /** Whether to fit into depth (z axis), undefined */
  depth?: boolean
  /** You can optionally pass the Box3, otherwise will be computed, undefined */
  box3?: THREE.Box3
  /** See https://threejs.org/docs/index.html?q=box3#api/en/math/Box3.setFromObject */
  precise?: boolean
}

export const Resize = /* @__PURE__ */ React.forwardRef<THREE.Group, ResizeProps>(
  ({ children, width, height, depth, box3, precise = true, ...props }, fRef) => {
    const ref = React.useRef<THREE.Group>(null!)
    const outer = React.useRef<THREE.Group>(null!)
    const inner = React.useRef<THREE.Group>(null!)

    React.useLayoutEffect(() => {
      outer.current.matrixWorld.identity()
      let box = box3 || new THREE.Box3().setFromObject(inner.current, precise)
      const w = box.max.x - box.min.x
      const h = box.max.y - box.min.y
      const d = box.max.z - box.min.z

      let dimension = Math.max(w, h, d)
      if (width) dimension = w
      if (height) dimension = h
      if (depth) dimension = d

      outer.current.scale.setScalar(1 / dimension)
    }, [width, height, depth, box3, precise])

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
