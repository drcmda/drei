import * as React from 'react'
import { MathUtils } from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { useGesture } from '@use-gesture/react'
import { easing } from 'maath'

export type PresentationControlProps = {
  snap?: Boolean | number
  global?: boolean
  cursor?: boolean
  speed?: number
  zoom?: number
  rotation?: [number, number, number]
  polar?: [number, number]
  azimuth?: [number, number]
  damping?: number
  enabled?: boolean
  children?: React.ReactNode
  domElement?: HTMLElement
}

export function PresentationControls({
  enabled = true,
  snap,
  global,
  domElement,
  cursor = true,
  children,
  speed = 1,
  rotation = [0, 0, 0],
  zoom = 1,
  polar = [0, Math.PI / 2],
  azimuth = [-Infinity, Infinity],
  damping = 0.25,
}: PresentationControlProps) {
  const events = useThree((state) => state.events)
  const gl = useThree((state) => state.gl)
  const explDomElement = domElement || events.connected || gl.domElement

  const { size } = useThree()
  const rPolar = React.useMemo(
    () => [rotation[0] + polar[0], rotation[0] + polar[1]],
    [rotation[0], polar[0], polar[1]]
  ) as [number, number]
  const rAzimuth = React.useMemo(
    () => [rotation[1] + azimuth[0], rotation[1] + azimuth[1]],
    [rotation[1], azimuth[0], azimuth[1]]
  ) as [number, number]
  const rInitial = React.useMemo(
    () => [MathUtils.clamp(rotation[0], ...rPolar), MathUtils.clamp(rotation[1], ...rAzimuth), rotation[2]],
    [rotation[0], rotation[1], rotation[2], rPolar, rAzimuth]
  )

  React.useEffect(() => {
    if (global && cursor && enabled) {
      explDomElement.style.cursor = 'grab'
      gl.domElement.style.cursor = ''
      return () => {
        explDomElement.style.cursor = 'default'
        gl.domElement.style.cursor = 'default'
      }
    }
  }, [global, cursor, explDomElement, enabled])

  const [animation] = React.useState({ scale: 1, rotation: rInitial, damping })
  const ref = React.useRef<THREE.Group>(null!)
  useFrame((state, delta) => {
    easing.damp3(ref.current.scale, animation.scale, animation.damping, delta)
    easing.dampE(ref.current.rotation, animation.rotation as any, animation.damping, delta)
  })

  const bind = useGesture(
    {
      onHover: ({ last }) => {
        if (cursor && !global && enabled) explDomElement.style.cursor = last ? 'auto' : 'grab'
      },
      onDrag: ({ down, delta: [x, y], memo: [oldY, oldX] = animation.rotation || rInitial }) => {
        if (!enabled) return [y, x]
        if (cursor) explDomElement.style.cursor = down ? 'grabbing' : 'grab'
        x = MathUtils.clamp(oldX + (x / size.width) * Math.PI * speed, ...rAzimuth)
        y = MathUtils.clamp(oldY + (y / size.height) * Math.PI * speed, ...rPolar)

        animation.scale = down && y > rPolar[1] / 2 ? zoom : 1
        animation.rotation = snap && !down ? rInitial : [y, x, 0]
        animation.damping = snap && !down && typeof snap !== 'boolean' ? (snap as number) : damping
        return [y, x]
      },
    },
    { target: global ? explDomElement : undefined }
  )
  return (
    <group ref={ref} {...(bind?.() as any)}>
      {children}
    </group>
  )
}
