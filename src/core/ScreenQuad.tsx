// reference: https://medium.com/@luruke/simple-postprocessing-in-three-js-91936ecadfb7
// and @gsimone ;)
import * as THREE from 'three'
import * as React from 'react'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { ThreeElements } from '@react-three/fiber'

function createScreenQuadGeometry() {
  const geometry = new THREE.BufferGeometry()
  const vertices = new Float32Array([-1, -1, 3, -1, -1, 3])
  geometry.boundingSphere = new THREE.Sphere()
  geometry.boundingSphere.set(new THREE.Vector3(), Infinity)
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 2))
  return geometry
}

export type ScreenQuadProps = Omit<ThreeElements['mesh'], 'ref' | 'args'>

export const ScreenQuad: ForwardRefComponent<ScreenQuadProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef<
  THREE.Mesh,
  ScreenQuadProps
>(function ScreenQuad({ children, ...restProps }, ref) {
  const geometry = React.useMemo(createScreenQuadGeometry, [])

  return (
    <mesh ref={ref} geometry={geometry} frustumCulled={false} {...restProps}>
      {children}
    </mesh>
  )
})
