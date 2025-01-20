import * as React from 'react'
import { useFrame, useThree, createPortal, ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { useCamera, OrthographicCamera } from '../../src'

export default {
  title: 'Misc/useCamera',
  component: UseCameraScene,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof UseCameraScene>

type Story = StoryObj<typeof UseCameraScene>

function UseCameraScene() {
  const virtualCam = React.useRef<THREE.OrthographicCamera>(null!)
  const ref = React.useRef<THREE.Mesh>(null)

  const [hover, setHover] = React.useState<null | number>(null)

  const gl = useThree(({ gl }) => gl)
  const scene = useThree(({ scene }) => scene)
  const camera = useThree(({ camera }) => camera)

  const virtualScene = React.useMemo(() => new THREE.Scene(), [])

  const matrix = new THREE.Matrix4()

  useFrame(() => {
    matrix.copy(camera.matrix).invert()

    if (ref.current) {
      ref.current.quaternion.setFromRotationMatrix(matrix)
    }

    gl.autoClear = true
    gl.render(scene, camera)

    gl.autoClear = false
    gl.clearDepth()
    gl.render(virtualScene, virtualCam.current)
  }, 1)

  const handlePointerOut = () => setHover(null)
  const handlePointerMove = (e: ThreeEvent<PointerEvent>) => setHover(Math.floor(e.faceIndex ?? 0 / 2))
  return createPortal(
    <>
      <OrthographicCamera ref={virtualCam} makeDefault={false} position={[0, 0, 100]} zoom={2} />

      <mesh ref={ref} raycast={useCamera(virtualCam)} onPointerOut={handlePointerOut} onPointerMove={handlePointerMove}>
        {[...Array(6)].map((_, index) => (
          <meshLambertMaterial key={index} color="hotpink" wireframe={hover !== index} />
        ))}
        <boxGeometry args={[60, 60, 60]} />
      </mesh>

      <ambientLight intensity={0.5} />
      <pointLight position={[10, 10, 10]} intensity={0.5} />
    </>,
    virtualScene
  )
}

export const UseCameraSt = {
  render: () => <UseCameraScene />,
  name: 'Default',
} satisfies Story
