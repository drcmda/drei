import * as THREE from 'three'
import * as React from 'react'
import { ThreeElements, useFrame, useThree, Instance } from '@react-three/fiber'
import { easing, misc } from 'maath'

export type MotionPathProps = Omit<ThreeElements['group'], 'ref'> & {
  /** An optional array of THREE curves */
  curves?: THREE.Curve<THREE.Vector3>[]
  /** Show debug helpers */
  debug?: boolean
  /** The target object that is moved, default: null (the default camera) */
  object?: React.RefObject<THREE.Object3D>
  /** An object where the target looks towards, can also be a vector, default: null */
  focus?: [x: number, y: number, z: number] | React.RefObject<THREE.Object3D>
  /** Position between 0 (start) and end (1), if this is not set useMotion().current must be used, default: null */
  offset?: number
  /** Optionally smooth the curve, default: false */
  smooth?: boolean | number
  /** Damping tolerance, default: 0.00001 */
  eps?: number
  /** Damping factor for movement along the curve, default: 0.1 */
  damping?: number
  /** Damping factor for lookAt, default: 0.1 */
  focusDamping?: number
  /** Damping maximum speed, default: Infinity */
  maxSpeed?: number
}

type MotionState = {
  /** The user-defined, mutable, current goal position along the curve, it may be >1 or <0 */
  current: number
  /** The combined curve */
  path: THREE.CurvePath<THREE.Vector3>
  /** The focus object */
  focus: React.RefObject<THREE.Object3D> | [x: number, y: number, z: number] | undefined
  /** The target object that is moved along the curve */
  object: React.RefObject<THREE.Object3D>
  /** The 0-1 normalised and damped current goal position along curve */
  offset: number
  /** The current point on the curve */
  point: THREE.Vector3
  /** The current tangent on the curve */
  tangent: THREE.Vector3
  /** The next point on the curve */
  next: THREE.Vector3
}

const isObject3DRef = (ref: any): ref is React.RefObject<THREE.Object3D> => ref?.current instanceof THREE.Object3D

const context = /* @__PURE__ */ React.createContext<MotionState>(null!)

export function useMotion() {
  return React.useContext(context) as MotionState
}

function Debug({ points = 50 }: { points?: number }) {
  const { path } = useMotion()
  const [dots, setDots] = React.useState<THREE.Vector3[]>([])
  const [material] = React.useState(() => new THREE.MeshBasicMaterial({ color: 'black' }))
  const [geometry] = React.useState(() => new THREE.SphereGeometry(0.025, 16, 16))
  const last = React.useRef<THREE.Curve<THREE.Vector3>[]>([])
  React.useEffect(() => {
    if (path.curves !== last.current) {
      setDots(path.getPoints(points))
      last.current = path.curves
    }
  })
  return (
    <>
      {dots.map((item: { x: any; y: any; z: any }, index: any) => (
        <mesh key={index} material={material} geometry={geometry} position={[item.x, item.y, item.z]} />
      ))}
    </>
  )
}

export const MotionPathControls = /* @__PURE__ */ React.forwardRef<THREE.Group, MotionPathProps>(
  (
    {
      children,
      curves = [],
      object,
      debug = false,
      smooth = false,
      focus,
      offset = undefined,
      eps = 0.00001,
      damping = 0.1,
      focusDamping = 0.1,
      maxSpeed = Infinity,
      ...props
    },
    fref
  ) => {
    const { camera } = useThree()
    const ref = React.useRef<THREE.Group>(null!)
    const [path] = React.useState(() => new THREE.CurvePath<THREE.Vector3>())

    const pos = React.useRef(offset ?? 0)
    const state = React.useMemo<MotionState>(
      () => ({
        focus,
        object: object?.current instanceof THREE.Object3D ? object : { current: camera },
        path,
        current: pos.current,
        offset: pos.current,
        point: new THREE.Vector3(),
        tangent: new THREE.Vector3(),
        next: new THREE.Vector3(),
      }),
      [focus, object]
    )

    React.useLayoutEffect(() => {
      path.curves = []
      const _curves =
        curves.length > 0
          ? curves
          : (ref.current as THREE.Group & { __r3f: Instance<THREE.Group> }).__r3f!.children.map(
              (instance) => instance.object
            )
      for (var i = 0; i < _curves.length; i++) path.add(_curves[i])

      //Smoothen curve
      if (smooth) {
        const points = path.getPoints(typeof smooth === 'number' ? smooth : 1)
        const catmull = new THREE.CatmullRomCurve3(points)
        path.curves = [catmull]
      }
      path.updateArcLengths()
    })

    React.useImperativeHandle(fref, () => ref.current, [])

    React.useLayoutEffect(() => {
      // When offset changes, normalise pos to avoid overshoot spinning
      pos.current = misc.repeat(pos.current, 1)
    }, [offset])

    let last = 0
    const [vec] = React.useState(() => new THREE.Vector3())

    useFrame((_state, delta) => {
      last = state.offset
      easing.damp(
        pos,
        'current',
        offset !== undefined ? offset : state.current,
        damping,
        delta,
        maxSpeed,
        undefined,
        eps
      )
      state.offset = misc.repeat(pos.current, 1)

      if (path.getCurveLengths().length > 0) {
        path.getPointAt(state.offset, state.point)
        path.getTangentAt(state.offset, state.tangent).normalize()
        path.getPointAt(misc.repeat(pos.current - (last - state.offset), 1), state.next)
        const target = object?.current instanceof THREE.Object3D ? object.current : camera
        target.position.copy(state.point)
        //@ts-ignore
        if (focus) {
          easing.dampLookAt(
            target,
            isObject3DRef(focus) ? focus.current.getWorldPosition(vec) : focus,
            focusDamping,
            delta,
            maxSpeed,
            undefined,
            eps
          )
        }
      }
    })

    return (
      <group ref={ref} {...props}>
        <context.Provider value={state}>
          {children}
          {debug && <Debug />}
        </context.Provider>
      </group>
    )
  }
)
