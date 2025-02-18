import { applyProps, ReactThreeFiber, ThreeElements } from '@react-three/fiber'
import * as React from 'react'
import * as THREE from 'three'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type LightProps = Omit<ThreeElements['mesh'], 'ref'> & {
  args?: any[]
  map?: THREE.Texture
  toneMapped?: boolean
  color?: ReactThreeFiber.Color
  form?: 'circle' | 'ring' | 'rect' | 'plane' | 'box' | any
  scale?: number | [number, number, number] | [number, number]
  intensity?: number
  target?: boolean | [number, number, number] | THREE.Vector3
  light?: Partial<ThreeElements['pointLight']>
}

export const Lightformer: ForwardRefComponent<LightProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  (
    {
      light,
      args,
      map,
      toneMapped = false,
      color = 'white',
      form: Form = 'rect',
      intensity = 1,
      scale = 1,
      target = [0, 0, 0],
      children,
      ...props
    },
    forwardRef
  ) => {
    // Apply emissive power
    const ref = React.useRef<THREE.Mesh<THREE.BufferGeometry, THREE.MeshBasicMaterial>>(null!)
    React.useImperativeHandle(forwardRef, () => ref.current, [])
    React.useLayoutEffect(() => {
      if (!children && !props.material) {
        applyProps(ref.current.material as any, { color })
        ref.current.material.color.multiplyScalar(intensity)
      }
    }, [color, intensity, children, props.material])

    // Target light
    React.useLayoutEffect(() => {
      if (!props.rotation) ref.current.quaternion.identity()
      if (target && !props.rotation) {
        'boolean' === typeof target
          ? ref.current.lookAt(0, 0, 0)
          : ref.current.lookAt(Array.isArray(target) ? new THREE.Vector3(...target) : target)
      }
    }, [target, props.rotation])

    // Fix 2-dimensional scale
    scale = Array.isArray(scale) && scale.length === 2 ? [scale[0], scale[1], 1] : scale
    return (
      <mesh ref={ref} scale={scale} {...props}>
        {Form === 'circle' ? (
          <ringGeometry args={args ? (args as any) : [0, 0.5, 64]} />
        ) : Form === 'ring' ? (
          <ringGeometry args={args ? (args as any) : [0.25, 0.5, 64]} />
        ) : Form === 'rect' || Form === 'plane' ? (
          <planeGeometry args={args ? (args as any) : [1, 1]} />
        ) : Form === 'box' ? (
          <boxGeometry args={args ? (args as any) : [1, 1, 1]} />
        ) : (
          <Form args={args} />
        )}
        {children ? children : <meshBasicMaterial toneMapped={toneMapped} map={map} side={THREE.DoubleSide} />}
        {light && <pointLight castShadow {...light} />}
      </mesh>
    )
  }
)
