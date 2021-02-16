import * as React from 'react'
import { BoxGeometry, CanvasTexture, Event } from 'three'
import { useGizmoHelper } from './GizmoHelper'

function Axis({ color, rotation }: JSX.IntrinsicElements['mesh'] & { color: string }) {
  const geometry = React.useMemo(() => new BoxGeometry(0.8, 0.05, 0.05).translate(0.4, 0, 0), [])
  return (
    <mesh geometry={geometry} rotation={rotation}>
      <meshBasicMaterial color={color} toneMapped={false} />
    </mesh>
  )
}

function AxisHead({
  arcStyle,
  label,
  labelColor,
  ...props
}: JSX.IntrinsicElements['sprite'] & { arcStyle: string; label?: string; labelColor: string }) {
  const texture = React.useMemo(() => {
    const canvas = document.createElement('canvas')
    canvas.width = 64
    canvas.height = 64

    const context = canvas.getContext('2d')!
    context.beginPath()
    context.arc(32, 32, 16, 0, 2 * Math.PI)
    context.closePath()
    context.fillStyle = arcStyle
    context.fill()

    if (label) {
      context.font = '24px Arial'
      context.textAlign = 'center'
      context.fillStyle = labelColor
      context.fillText(label, 32, 41)
    }
    return new CanvasTexture(canvas)
  }, [arcStyle, label, labelColor])

  const [active, setActive] = React.useState(false)
  const scale = (label ? 1 : 0.75) * (active ? 1.2 : 1)
  const pointerOver = (e: Event) => void (setActive(true), e.stopPropagation())
  const pointerOut = (e: Event) => void (setActive(false), e.stopPropagation())
  return (
    <sprite scale={[scale, scale, scale]} onPointerOver={pointerOver} onPointerOut={pointerOut} {...props}>
      <spriteMaterial map={texture} toneMapped={false} />
    </sprite>
  )
}

type BlenderViewportGizmoProps = {
  axisColors?: [string, string, string]
  labelColor?: string
}

export const BlenderViewportGizmo = ({
  axisColors = ['#ff3653', '#8adb00', '#2c8fff'],
  labelColor = '#000',
  ...props
}: BlenderViewportGizmoProps) => {
  // axis colors
  const [colorX, colorY, colorZ] = axisColors
  const { tweenCamera, raycast } = useGizmoHelper()
  // common label color, raycasting provided by NavigationGizmo
  const axisHeadProps = {
    labelColor,
    onPointerDown: (e: Event) => void (tweenCamera(e.object.position), e.stopPropagation()),
    raycast,
  }
  return (
    <group scale={[40, 40, 40]} {...props}>
      <Axis color={colorX} rotation={[0, 0, 0]} />
      <Axis color={colorY} rotation={[0, 0, Math.PI / 2]} />
      <Axis color={colorZ} rotation={[0, -Math.PI / 2, 0]} />
      <AxisHead arcStyle={colorX} position={[1, 0, 0]} label="X" {...axisHeadProps} />
      <AxisHead arcStyle={colorY} position={[0, 1, 0]} label="Y" {...axisHeadProps} />
      <AxisHead arcStyle={colorZ} position={[0, 0, 1]} label="Z" {...axisHeadProps} />
      <AxisHead arcStyle={colorX} position={[-1, 0, 0]} {...axisHeadProps} />
      <AxisHead arcStyle={colorY} position={[0, -1, 0]} {...axisHeadProps} />
      <AxisHead arcStyle={colorZ} position={[0, 0, -1]} {...axisHeadProps} />
      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </group>
  )
}
