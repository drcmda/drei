import * as React from 'react'
import * as THREE from 'three'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { ThreeElements } from '@react-three/fiber'

export type Args<T> = T extends new (...args: any) => any ? ConstructorParameters<T> : T
export type ShapeProps<T> = Omit<ThreeElements['mesh'], 'ref' | 'args'> & { args?: Args<T> }

function create<T>(type: string, effect?: (mesh: THREE.Mesh) => void): ForwardRefComponent<ShapeProps<T>, THREE.Mesh> {
  const El: any = type + 'Geometry'
  return React.forwardRef(({ args, children, ...props }: ShapeProps<T>, fref: React.ForwardedRef<THREE.Mesh>) => {
    const ref = React.useRef<THREE.Mesh>(null!)
    React.useImperativeHandle(fref, () => ref.current)
    React.useLayoutEffect(() => void effect?.(ref.current))
    return (
      <mesh ref={ref} {...props}>
        <El attach="geometry" args={args} />
        {children}
      </mesh>
    )
  })
}

export const Box = /* @__PURE__ */ create<typeof THREE.BoxGeometry>('box')
export const Circle = /* @__PURE__ */ create<typeof THREE.CircleGeometry>('circle')
export const Cone = /* @__PURE__ */ create<typeof THREE.ConeGeometry>('cone')
export const Cylinder = /* @__PURE__ */ create<typeof THREE.CylinderGeometry>('cylinder')
export const Sphere = /* @__PURE__ */ create<typeof THREE.SphereGeometry>('sphere')
export const Plane = /* @__PURE__ */ create<typeof THREE.PlaneGeometry>('plane')
export const Tube = /* @__PURE__ */ create<typeof THREE.TubeGeometry>('tube')
export const Torus = /* @__PURE__ */ create<typeof THREE.TorusGeometry>('torus')
export const TorusKnot = /* @__PURE__ */ create<typeof THREE.TorusKnotGeometry>('torusKnot')
export const Tetrahedron = /* @__PURE__ */ create<typeof THREE.TetrahedronGeometry>('tetrahedron')
export const Ring = /* @__PURE__ */ create<typeof THREE.RingGeometry>('ring')
export const Polyhedron = /* @__PURE__ */ create<typeof THREE.PolyhedronGeometry>('polyhedron')
export const Icosahedron = /* @__PURE__ */ create<typeof THREE.IcosahedronGeometry>('icosahedron')
export const Octahedron = /* @__PURE__ */ create<typeof THREE.OctahedronGeometry>('octahedron')
export const Dodecahedron = /* @__PURE__ */ create<typeof THREE.DodecahedronGeometry>('dodecahedron')
export const Extrude = /* @__PURE__ */ create<typeof THREE.ExtrudeGeometry>('extrude')
export const Lathe = /* @__PURE__ */ create<typeof THREE.LatheGeometry>('lathe')
export const Capsule = /* @__PURE__ */ create<typeof THREE.CapsuleGeometry>('capsule')
export const Shape = /* @__PURE__ */ create<typeof THREE.ShapeGeometry>('shape', ({ geometry }) => {
  // Calculate UVs (by https://discourse.threejs.org/u/prisoner849)
  // https://discourse.threejs.org/t/custom-shape-in-image-not-working/49348/10
  const pos = geometry.attributes.position as THREE.BufferAttribute
  const b3 = new THREE.Box3().setFromBufferAttribute(pos)
  const b3size = new THREE.Vector3()
  b3.getSize(b3size)
  const uv: number[] = []
  let x = 0,
    y = 0,
    u = 0,
    v = 0
  for (let i = 0; i < pos.count; i++) {
    x = pos.getX(i)
    y = pos.getY(i)
    u = (x - b3.min.x) / b3size.x
    v = (y - b3.min.y) / b3size.y
    uv.push(u, v)
  }
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2))
})
