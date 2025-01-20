import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Ring } from '../../src/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Ring',
  component: Ring,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Ring>

type Story = StoryObj<typeof Ring>

function RingScene(props: React.ComponentProps<typeof Ring>) {
  const ref = useTurntable<React.ComponentRef<typeof Ring>>()

  return (
    <Ring ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Ring>
  )
}

export const RingSt = {
  args: {},
  render: (args) => <RingScene {...args} />,
  name: 'Default',
} satisfies Story
