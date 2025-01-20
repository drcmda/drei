import * as React from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Box, CubeCamera } from '../../src'
import { ComponentProps } from 'react'

export default {
  title: 'Camera/CubeCamera',
  component: CubeCamera,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(0, 10, 40)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof CubeCamera>

type Story = StoryObj<typeof CubeCamera>

declare module '@react-three/fiber' {
  interface ThreeElements {
    axisHelper: object
  }
}

function Sphere({ offset = 0, ...props }: ComponentProps<typeof CubeCamera> & { offset?: number }) {
  const ref = React.useRef<THREE.Mesh>(null!)
  useFrame(({ clock }) => {
    ref.current.position.y = Math.sin(offset + clock.elapsedTime) * 5
  })

  return (
    <CubeCamera {...props}>
      {(texture) => (
        <mesh ref={ref}>
          <sphereGeometry args={[5, 64, 64]} />
          <meshStandardMaterial roughness={0} metalness={1} envMap={texture} />
        </mesh>
      )}
    </CubeCamera>
  )
}

function Scene(props: ComponentProps<typeof CubeCamera>) {
  return (
    <>
      <fog attach="fog" args={['#f0f0f0', 100, 200]} />

      <Sphere position={[-10, 10, 0]} {...props} />
      <Sphere position={[10, 9, 0]} offset={2000} {...props} />

      <Box material-color="hotpink" args={[5, 5, 5]} position-y={2.5} />

      <gridHelper args={[100, 10]} />
    </>
  )
}

export const DefaultStory = {
  render: (args) => <Scene {...args} />,
  name: 'Default',
} satisfies Story
