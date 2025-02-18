import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Octahedron } from '../../src/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Octahedron',
  component: Octahedron,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Octahedron>

type Story = StoryObj<typeof Octahedron>

function OctahedronScene(props: React.ComponentProps<typeof Octahedron>) {
  const ref = useTurntable<React.ComponentRef<typeof Octahedron>>()

  return (
    <Octahedron ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Octahedron>
  )
}

export const OctahedronSt = {
  args: {},
  render: (args) => <OctahedronScene {...args} />,
  name: 'Default',
} satisfies Story
