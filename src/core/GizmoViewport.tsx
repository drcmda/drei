import * as React from 'react'
import { useThree, ThreeEvent, ThreeElements } from '@react-three/fiber'
import { CanvasTexture } from 'three'
import { useGizmoContext } from './GizmoHelper'

type AxisProps = {
  color: string
  rotation: [number, number, number]
  scale?: [number, number, number]
}

type AxisHeadProps = Omit<ThreeElements['sprite'], 'ref'> & {
  arcStyle: string
  label?: string
  labelColor: string
  axisHeadScale?: number
  disabled?: boolean
  font: string
  onClick?: (e: ThreeEvent<MouseEvent>) => null
}

type GizmoViewportProps = ThreeElements['group'] & {
  axisColors?: [string, string, string]
  axisScale?: [number, number, number]
  labels?: [string, string, string]
  axisHeadScale?: number
  labelColor?: string
  hideNegativeAxes?: boolean
  hideAxisHeads?: boolean
  disabled?: boolean
  font?: string
  onClick?: (e: ThreeEvent<MouseEvent>) => null
}

function Axis({ scale = [0.8, 0.05, 0.05], color, rotation }: AxisProps) {
  return (
    <group rotation={rotation}>
      <mesh position={[0.4, 0, 0]}>
        <boxGeometry args={scale} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
    </group>
  )
}

function AxisHead({
  onClick,
  font,
  disabled,
  arcStyle,
  label,
  labelColor,
  axisHeadScale = 1,
  ...props
}: AxisHeadProps) {
  const gl = useThree((state) => state.gl)
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
      context.font = font
      context.textAlign = 'center'
      context.fillStyle = labelColor
      context.fillText(label, 32, 41)
    }
    return new CanvasTexture(canvas)
  }, [arcStyle, label, labelColor, font])

  const [active, setActive] = React.useState(false)
  const scale = (label ? 1 : 0.75) * (active ? 1.2 : 1) * axisHeadScale
  const handlePointerOver = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setActive(true)
  }
  const handlePointerOut = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation()
    setActive(false)
  }
  return (
    <sprite
      scale={scale}
      onPointerOver={!disabled ? handlePointerOver : undefined}
      onPointerOut={!disabled ? onClick || handlePointerOut : undefined}
      {...props}
    >
      <spriteMaterial
        map={texture}
        map-anisotropy={gl.capabilities.getMaxAnisotropy() || 1}
        alphaTest={0.3}
        opacity={label ? 1 : 0.75}
        toneMapped={false}
      />
    </sprite>
  )
}

export const GizmoViewport = ({
  hideNegativeAxes,
  hideAxisHeads,
  disabled,
  font = '18px Inter var, Arial, sans-serif',
  axisColors = ['#ff2060', '#20df80', '#2080ff'],
  axisHeadScale = 1,
  axisScale,
  labels = ['X', 'Y', 'Z'],
  labelColor = '#000',
  onClick,
  ...props
}: GizmoViewportProps) => {
  const [colorX, colorY, colorZ] = axisColors
  const { tweenCamera } = useGizmoContext()
  const axisHeadProps = {
    font,
    disabled,
    labelColor,
    onClick,
    axisHeadScale,
    onPointerDown: !disabled
      ? (e: ThreeEvent<PointerEvent>) => {
          tweenCamera(e.object.position)
          e.stopPropagation()
        }
      : undefined,
  }
  return (
    <group scale={40} {...props}>
      <Axis color={colorX} rotation={[0, 0, 0]} scale={axisScale} />
      <Axis color={colorY} rotation={[0, 0, Math.PI / 2]} scale={axisScale} />
      <Axis color={colorZ} rotation={[0, -Math.PI / 2, 0]} scale={axisScale} />
      {!hideAxisHeads && (
        <>
          <AxisHead arcStyle={colorX} position={[1, 0, 0]} label={labels[0]} {...axisHeadProps} />
          <AxisHead arcStyle={colorY} position={[0, 1, 0]} label={labels[1]} {...axisHeadProps} />
          <AxisHead arcStyle={colorZ} position={[0, 0, 1]} label={labels[2]} {...axisHeadProps} />
          {!hideNegativeAxes && (
            <>
              <AxisHead arcStyle={colorX} position={[-1, 0, 0]} {...axisHeadProps} />
              <AxisHead arcStyle={colorY} position={[0, -1, 0]} {...axisHeadProps} />
              <AxisHead arcStyle={colorZ} position={[0, 0, -1]} {...axisHeadProps} />
            </>
          )}
        </>
      )}
    </group>
  )
}
