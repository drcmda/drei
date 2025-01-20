import * as React from 'react'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { Group, Matrix4, Object3D, OrthographicCamera as OrthographicCameraImpl, Quaternion, Vector3 } from 'three'
import { OrthographicCamera } from './OrthographicCamera'
import { OrbitControls as OrbitControlsType } from 'three-stdlib'
import { Hud } from './Hud'
import { CameraControls as CameraControlsType } from './CameraControls'

type GizmoHelperContext = {
  tweenCamera: (direction: Vector3) => void
}

const Context = /* @__PURE__ */ React.createContext<GizmoHelperContext>({} as GizmoHelperContext)

export const useGizmoContext = () => {
  return React.useContext<GizmoHelperContext>(Context)
}

const turnRate = 2 * Math.PI // turn rate in angles per second
const dummy = /* @__PURE__ */ new Object3D()
const matrix = /* @__PURE__ */ new Matrix4()
const [q1, q2] = [/* @__PURE__ */ new Quaternion(), /* @__PURE__ */ new Quaternion()]
const target = /* @__PURE__ */ new Vector3()
const targetPosition = /* @__PURE__ */ new Vector3()

type ControlsProto = { update(delta?: number): void; target: Vector3 }

export type GizmoHelperProps = ThreeElements['group'] & {
  alignment?:
    | 'top-left'
    | 'top-right'
    | 'bottom-right'
    | 'bottom-left'
    | 'bottom-center'
    | 'center-right'
    | 'center-left'
    | 'center-center'
    | 'top-center'
  margin?: [number, number]
  renderPriority?: number
  autoClear?: boolean
  onUpdate?: () => void // update controls during animation
  // TODO: in a new major state.controls should be the only means of consuming controls, the
  // onTarget prop can then be removed!
  onTarget?: () => Vector3 // return the target to rotate around
}

const isOrbitControls = (controls: ControlsProto): controls is OrbitControlsType => {
  return 'minPolarAngle' in (controls as OrbitControlsType)
}

const isCameraControls = (controls: CameraControlsType | ControlsProto): controls is CameraControlsType => {
  return 'getTarget' in (controls as CameraControlsType)
}

export const GizmoHelper = ({
  alignment = 'bottom-right',
  margin = [80, 80],
  renderPriority = 1,
  onUpdate,
  onTarget,
  children,
}: GizmoHelperProps): any => {
  const size = useThree((state) => state.size)
  const mainCamera = useThree((state) => state.camera)
  // @ts-ignore
  const defaultControls = useThree((state) => state.controls) as ControlsProto
  const invalidate = useThree((state) => state.invalidate)
  const gizmoRef = React.useRef<Group>(null!)
  const virtualCam = React.useRef<OrthographicCameraImpl>(null!)

  const animating = React.useRef(false)
  const radius = React.useRef(0)
  const focusPoint = React.useRef(new Vector3(0, 0, 0))
  const defaultUp = React.useRef(new Vector3(0, 0, 0))

  React.useEffect(() => {
    defaultUp.current.copy(mainCamera.up)
  }, [mainCamera])

  const tweenCamera = React.useCallback(
    (direction: Vector3) => {
      animating.current = true
      if (defaultControls || onTarget) {
        focusPoint.current =
          onTarget?.() ||
          (isCameraControls(defaultControls) ? defaultControls.getTarget(focusPoint.current) : defaultControls?.target)
      }
      radius.current = mainCamera.position.distanceTo(target)

      // Rotate from current camera orientation
      q1.copy(mainCamera.quaternion)

      // To new current camera orientation
      targetPosition.copy(direction).multiplyScalar(radius.current).add(target)

      dummy.lookAt(targetPosition)

      q2.copy(dummy.quaternion)

      invalidate()
    },
    [defaultControls, mainCamera, onTarget, invalidate]
  )

  useFrame((_, delta) => {
    if (virtualCam.current && gizmoRef.current) {
      // Animate step
      if (animating.current) {
        if (q1.angleTo(q2) < 0.01) {
          animating.current = false
          // Orbit controls uses UP vector as the orbit axes,
          // so we need to reset it after the animation is done
          // moving it around for the controls to work correctly
          if (isOrbitControls(defaultControls)) {
            mainCamera.up.copy(defaultUp.current)
          }
        } else {
          const step = delta * turnRate
          // animate position by doing a slerp and then scaling the position on the unit sphere
          q1.rotateTowards(q2, step)
          // animate orientation
          mainCamera.position.set(0, 0, 1).applyQuaternion(q1).multiplyScalar(radius.current).add(focusPoint.current)
          mainCamera.up.set(0, 1, 0).applyQuaternion(q1).normalize()
          mainCamera.quaternion.copy(q1)

          if (isCameraControls(defaultControls))
            defaultControls.setPosition(mainCamera.position.x, mainCamera.position.y, mainCamera.position.z)

          if (onUpdate) onUpdate()
          else if (defaultControls) defaultControls.update(delta)
          invalidate()
        }
      }

      // Sync Gizmo with main camera orientation
      matrix.copy(mainCamera.matrix).invert()
      gizmoRef.current?.quaternion.setFromRotationMatrix(matrix)
    }
  })

  const gizmoHelperContext = React.useMemo(() => ({ tweenCamera }), [tweenCamera])

  // Position gizmo component within scene
  const [marginX, marginY] = margin
  const x = alignment.endsWith('-center')
    ? 0
    : alignment.endsWith('-left')
      ? -size.width / 2 + marginX
      : size.width / 2 - marginX
  const y = alignment.startsWith('center-')
    ? 0
    : alignment.startsWith('top-')
      ? size.height / 2 - marginY
      : -size.height / 2 + marginY

  return (
    <Hud renderPriority={renderPriority}>
      <Context.Provider value={gizmoHelperContext}>
        <OrthographicCamera makeDefault ref={virtualCam} position={[0, 0, 200]} />
        <group ref={gizmoRef} position={[x, y, 0]}>
          {children}
        </group>
      </Context.Provider>
    </Hud>
  )
}
