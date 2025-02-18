import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Shadow, Icosahedron, Plane } from '../../src'

export default {
  title: 'Misc/Shadow',
  component: Shadow,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Shadow>

type Story = StoryObj<typeof Shadow>

function ShadowScene(props: React.ComponentProps<typeof Shadow>) {
  const shadow = React.useRef<React.ComponentRef<typeof Shadow>>(null!)
  const mesh = React.useRef<React.ComponentRef<typeof Icosahedron>>(null!)

  useFrame(({ clock }) => {
    shadow.current.scale.x = Math.sin(clock.getElapsedTime()) + 3
    shadow.current.scale.y = Math.sin(clock.getElapsedTime()) + 3

    mesh.current.position.y = Math.sin(clock.getElapsedTime()) + 2.5
  })

  return (
    <>
      <Icosahedron ref={mesh} args={[1, 2]} position-y={2}>
        <meshBasicMaterial color="lightblue" wireframe />
      </Icosahedron>

      <Shadow ref={shadow} {...props} />

      <Plane args={[4, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshBasicMaterial color="white" />
      </Plane>
    </>
  )
}

export const ShadowSt = {
  args: {
    scale: [2, 2, 2],
    position: [0, 0.1, 0],
    rotation: [-Math.PI / 2, 0, 0],
  },
  render: (args) => <ShadowScene {...args} />,
  name: 'Default',
} satisfies Story
