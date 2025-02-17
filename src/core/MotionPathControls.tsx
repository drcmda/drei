import * as THREE from 'three'
import * as React from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { easing, misc } from 'maath'

type MotionPathProps = JSX.IntrinsicElements['group'] & {
  /** An optional array of THREE curves */
  curves?: THREE.Curve<THREE.Vector3>[]
  /** Show debug helpers */
  debug?: boolean
  /** Color of debug helpers */
  debugColor?: THREE.ColorRepresentation
  /** The target object that is moved, default: null (the default camera) */
  object?: React.MutableRefObject<THREE.Object3D>
  /** An object where the target looks towards, can also be a vector, default: null */
  focus?: [x: number, y: number, z: number] | React.MutableRefObject<THREE.Object3D>
  /** Should the target object loop back to the start when reaching the end, default: true */
  loop?: boolean
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
  focus: React.MutableRefObject<THREE.Object3D> | [x: number, y: number, z: number] | undefined
  /** The target object that is moved along the curve */
  object: React.MutableRefObject<THREE.Object3D>
  /** The 0-1 normalised and damped current goal position along curve */
  offset: number
  /** The current point on the curve */
  point: THREE.Vector3
  /** The current tangent on the curve */
  tangent: THREE.Vector3
  /** The next point on the curve */
  next: THREE.Vector3
}

export type MotionPathRef = THREE.Group & { motion: MotionState }

const isObject3DRef = (ref: any): ref is React.MutableRefObject<THREE.Object3D> =>
  ref?.current instanceof THREE.Object3D

const MotionContext = /* @__PURE__ */ React.createContext<MotionState>(null!)

export function useMotion() {
  const context = React.useContext(MotionContext)
  if (!context) throw new Error('useMotion hook must be used in a MotionPathControls component.')
  return context
}

function Debug({ points = 50, color = 'black' }: { points?: number; color?: THREE.ColorRepresentation }) {
  const { path } = useMotion()
  const [dots, setDots] = React.useState<THREE.Vector3[]>([])

  const material = React.useMemo(() => new THREE.MeshBasicMaterial({ color: color }), [color])
  const geometry = React.useMemo(() => new THREE.SphereGeometry(0.025, 16, 16), [])

  const last = React.useRef<THREE.Curve<THREE.Vector3>[]>([])

  React.useEffect(() => {
    if (path.curves !== last.current) {
      setDots(path.getPoints(points))
      last.current = path.curves
    }
  })

  return dots.map((item, index) => (
    <mesh key={index} material={material} geometry={geometry} position={[item.x, item.y, item.z]} />
  ))
}

export const MotionPathControls = /* @__PURE__ */ React.forwardRef<MotionPathRef, MotionPathProps>(
  (
    {
      children,
      curves = [],
      debug = false,
      debugColor = 'black',
      object,
      focus,
      loop = true,
      offset = undefined,
      smooth = false,
      eps = 0.00001,
      damping = 0.1,
      focusDamping = 0.1,
      maxSpeed = Infinity,
      ...props
    }: MotionPathProps,
    fref
  ) => {
    const { camera } = useThree()

    const ref = React.useRef<MotionPathRef>(null!)
    const pos = React.useRef<number>(offset ?? 0)

    const path = React.useMemo(() => new THREE.CurvePath<THREE.Vector3>(), [])

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
      const _curves = curves.length > 0 ? curves : ((ref.current as any)?.__r3f?.objects ?? [])
      for (let i = 0; i < _curves.length; i++) path.add(_curves[i])

      // Smoothen curve
      if (smooth) {
        const points = path.getPoints(typeof smooth === 'number' ? smooth : 1)
        const catmull = new THREE.CatmullRomCurve3(points)
        path.curves = [catmull]
      }
      path.updateArcLengths()
    })

    React.useImperativeHandle(fref, () => Object.assign(ref.current, { motion: state }), [state])

    React.useLayoutEffect(() => {
      // When offset changes, normalise pos to avoid overshoot spinning
      pos.current = misc.repeat(pos.current, 1)
    }, [offset])

    const vec = React.useMemo(() => new THREE.Vector3(), [])

    useFrame((_state, delta) => {
      const lastOffset = state.offset

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
      state.offset = loop ? misc.repeat(pos.current, 1) : misc.clamp(pos.current, 0, 1)

      if (path.getCurveLengths().length > 0) {
        path.getPointAt(state.offset, state.point)
        path.getTangentAt(state.offset, state.tangent).normalize()
        path.getPointAt(misc.repeat(pos.current - (lastOffset - state.offset), 1), state.next)
        const target = object?.current instanceof THREE.Object3D ? object.current : camera
        target.position.copy(state.point)

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
        <MotionContext.Provider value={state}>
          {children}
          {debug && <Debug color={debugColor} />}
        </MotionContext.Provider>
      </group>
    )
  }
)
