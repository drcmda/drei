import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { MeshWobbleMaterial, Torus } from '../../src'

export default {
  title: 'Shaders/MeshWobbleMaterial',
  component: MeshWobbleMaterial,
  args: {
    color: '#f25042',
    speed: 1,
    factor: 0.6,
  },
  argTypes: {
    color: { control: 'color' },
    speed: { control: { type: 'range', min: 0, max: 10, step: 0.1 } },
    factor: { control: { type: 'range', min: 0, max: 1, step: 0.1 } },
  },
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MeshWobbleMaterial>

type Story = StoryObj<typeof MeshWobbleMaterial>

function MeshWobbleMaterialScene(props: React.ComponentProps<typeof MeshWobbleMaterial>) {
  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial {...props} />
    </Torus>
  )
}

export const MeshWobbleMaterialSt = {
  render: (args) => <MeshWobbleMaterialScene {...args} />,
  name: 'Default',
} satisfies Story

//

function MeshWobbleMaterialRefScene(props: React.ComponentProps<typeof MeshWobbleMaterial>) {
  const material = React.useRef<React.ComponentRef<typeof MeshWobbleMaterial>>(null)

  useFrame(({ clock }) => {
    if (material.current === null) return
    material.current.factor = Math.abs(Math.sin(clock.getElapsedTime())) * 2
  })

  return (
    <Torus args={[1, 0.25, 16, 100]}>
      <MeshWobbleMaterial {...props} ref={material} />
    </Torus>
  )
}

export const MeshWobbleMaterialRefSt = {
  render: (args) => <MeshWobbleMaterialRefScene {...args} />,
  name: 'Ref',
} satisfies Story
