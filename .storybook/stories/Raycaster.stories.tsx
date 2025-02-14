import * as THREE from 'three'
import * as React from 'react'

import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Raycaster } from '../../src'
import { ComponentProps, useRef } from 'react'
import { useFrame } from '@react-three/fiber'

export default {
  title: 'Abstractions/Raycaster',
  component: Raycaster,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
  argTypes: {
    near: { control: { type: 'range', min: 0, max: 15 } },
    far: { control: { type: 'range', min: 0, max: 15 } },
  },
} satisfies Meta<typeof Raycaster>

type Story = StoryObj<typeof Raycaster>

function RaycasterScene(props: React.ComponentProps<typeof Raycaster>) {
  const raycasterRef = useRef<THREE.Raycaster>(null)

  React.useEffect(() => {
    console.log('raycasterRef', raycasterRef)
  })

  return (
    <>
      <color attach="background" args={['#303030']} />

      <Raycaster ref={raycasterRef} {...props} />

      <Capsule position-x={-2} />
      <Capsule />
      <Capsule position-x={2} />
    </>
  )
}

export const RaycasterSt = {
  render: (args) => <RaycasterScene {...args} />,
  args: {
    origin: [-4, 0, 0],
    direction: [1, 0, 0],
    near: 1,
    far: 8,
    helper: [20],
  },

  name: 'Default',
} satisfies Story

const Capsule = ({
  // layers,
  ...props
}: ComponentProps<'mesh'>) => {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (!meshRef.current) return
    meshRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5 + meshRef.current.position.x)
    meshRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.5) * Math.PI * 1
  })

  return (
    <mesh ref={meshRef} {...props}>
      {/* <Layers layers={layers} /> */}

      <capsuleGeometry args={[0.5, 0.5, 4, 32]} />
      <meshNormalMaterial side={THREE.DoubleSide} />
    </mesh>
  )
}
