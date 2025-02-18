import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Circle } from '../../src/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Circle',
  component: Circle,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Circle>

type Story = StoryObj<typeof Circle>

function CircleScene(props: React.ComponentProps<typeof Circle>) {
  const ref = useTurntable<React.ComponentRef<typeof Circle>>()

  return (
    <Circle ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Circle>
  )
}

export const CircleSt = {
  args: {},
  render: (args) => <CircleScene {...args} />,
  name: 'Default',
} satisfies Story
