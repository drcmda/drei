import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Dodecahedron } from '../../src/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Dodecahedron',
  component: Dodecahedron,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Dodecahedron>

type Story = StoryObj<typeof Dodecahedron>

function DodecahedronScene(props: React.ComponentProps<typeof Dodecahedron>) {
  const ref = useTurntable<React.ComponentRef<typeof Dodecahedron>>()

  return (
    <Dodecahedron ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Dodecahedron>
  )
}

export const DodecahedronSt = {
  args: {},
  render: (args) => <DodecahedronScene {...args} />,
  name: 'Default',
} satisfies Story
