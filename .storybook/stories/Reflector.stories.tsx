import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, RepeatWrapping, Vector2 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { MeshReflectorMaterial, useTexture, TorusKnot, Box, Environment } from '../../src'

export default {
  title: 'Shaders/MeshReflectorMaterial',
  component: MeshReflectorMaterial,
  args: {
    resolution: 1024,
    mirror: 0.75,
    mixBlur: 10,
    mixStrength: 2,
    minDepthThreshold: 0.8,
    maxDepthThreshold: 1.2,
    depthToBlurRatioBias: 0.2,
    color: '#a0a0a0',
    metalness: 0.5,
    roughness: 1,
  },
  decorators: [
    (Story) => (
      <Setup cameraFov={20} cameraPosition={new Vector3(-2, 2, 6)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MeshReflectorMaterial>

type Story = StoryObj<typeof MeshReflectorMaterial>

function ReflectorScene({
  blur = [0, 0],
  depthScale = 0,
  distortion = 0,
  normalScale = new Vector2(0),
  ...props
}: React.ComponentProps<typeof MeshReflectorMaterial>) {
  const roughnessMap = useTexture('roughness_floor.jpeg')
  const normalMap = useTexture('NORM.jpg')
  const distortionMap = useTexture('dist_map.jpeg')
  const $box = React.useRef<React.ComponentRef<typeof TorusKnot>>(null!)

  React.useEffect(() => {
    distortionMap.wrapS = distortionMap.wrapT = RepeatWrapping
    distortionMap.repeat.set(4, 4)
  }, [distortionMap])

  useFrame(({ clock }) => {
    $box.current.position.y += Math.sin(clock.getElapsedTime()) / 25
    $box.current.rotation.y = clock.getElapsedTime() / 2
  })

  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[10, 10]} />
        <MeshReflectorMaterial
          blur={blur}
          depthScale={depthScale}
          distortion={distortion}
          distortionMap={distortionMap}
          roughnessMap={roughnessMap}
          normalMap={normalMap}
          normalScale={normalScale}
          {...props}
        />
      </mesh>

      <Box args={[2, 3, 0.2]} position={[0, 1.6, -3]}>
        <meshPhysicalMaterial color="hotpink" />
      </Box>
      <TorusKnot args={[0.5, 0.2, 128, 32]} ref={$box} position={[0, 1, 0]}>
        <meshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <spotLight intensity={1 * Math.PI} position={[10, 6, 10]} penumbra={1} angle={0.3} />
      <Environment preset="city" />
    </>
  )
}

export const ReflectorSt = {
  render: (args) => <ReflectorScene {...args} />,
  name: 'Default',
} satisfies Story

//

export const ReflectorBlur = {
  args: {
    blur: 500,
  },
  render: (args) => <ReflectorScene {...args} />,
  name: 'Blur',
} satisfies Story

//

export const ReflectorDepth = {
  args: {
    depthScale: 2,
  },
  render: (args) => <ReflectorScene {...args} />,
  name: 'Depth',
} satisfies Story

//

export const ReflectorDistortion = {
  args: {
    distortion: 1,
  },
  render: (args) => <ReflectorScene {...args} />,
  name: 'Distortion',
} satisfies Story

//

export const ReflectorNormalMap = {
  args: {
    normalScale: new Vector2(0.5, 0.5),
  },
  render: (args) => <ReflectorScene {...args} />,
  name: 'NormalMap',
} satisfies Story

//

export const ReflectorOffset = {
  args: {
    reflectorOffset: 1,
  },
  render: (args) => <ReflectorScene {...args} />,
  name: 'ReflectorOffset',
} satisfies Story
