import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Lathe } from '../../src'

export default {
  title: 'Shapes/Lathe',
  component: Lathe,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(-30, 30, 30)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Lathe>

type Story = StoryObj<typeof Lathe>

function LatheScene(props: React.ComponentProps<typeof Lathe>) {
  const ref = useTurntable<React.ComponentRef<typeof Lathe>>()

  return (
    <Lathe ref={ref} {...props}>
      <meshPhongMaterial color="#f3f3f3" wireframe />
    </Lathe>
  )
}

const points = Array.from({ length: 10 }, (_, i) => new THREE.Vector2(Math.sin(i * 0.2) * 10 + 5, (i - 5) * 2))

export const LatheSt = {
  args: {
    args: [points],
  },
  render: (args) => <LatheScene {...args} />,
  name: 'Default',
} satisfies Story
