import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { MeshDistortMaterial, Icosahedron } from '../../src'

export default {
  title: 'Shaders/MeshDistortMaterial',
  component: MeshDistortMaterial,
  args: {
    color: '#f25042',
    speed: 1,
    distort: 0.6,
    radius: 1,
  },
  argTypes: {
    color: { control: 'color' },
    speed: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    distort: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
    radius: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  },
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MeshDistortMaterial>

type Story = StoryObj<typeof MeshDistortMaterial>

function MeshDistortMaterialScene(props: React.ComponentProps<typeof MeshDistortMaterial>) {
  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial {...props} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialSt = {
  render: (args) => <MeshDistortMaterialScene {...args} />,
  name: 'Default',
} satisfies Story

//

function MeshDistortMaterialRefScene(props: React.ComponentProps<typeof MeshDistortMaterial>) {
  const material = React.useRef<React.ComponentRef<typeof MeshDistortMaterial>>(null!)

  useFrame(({ clock }) => {
    material.current.distort = Math.sin(clock.getElapsedTime())
  })

  return (
    <Icosahedron args={[1, 4]}>
      <MeshDistortMaterial {...props} ref={material} />
    </Icosahedron>
  )
}

export const MeshDistortMaterialRefSt = {
  render: (args) => <MeshDistortMaterialRefScene {...args} />,
  name: 'Ref',
} satisfies Story
