import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Polyhedron } from '../../src/core/shapes'
import { useTurntable } from '../useTurntable'

export default {
  title: 'Shapes/Polyhedron',
  component: Polyhedron,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Polyhedron>

type Story = StoryObj<typeof Polyhedron>

function PolyhedronScene(props: React.ComponentProps<typeof Polyhedron>) {
  const ref = useTurntable<React.ComponentRef<typeof Polyhedron>>()

  return (
    <Polyhedron ref={ref} {...props}>
      <meshStandardMaterial wireframe />
    </Polyhedron>
  )
}

// prettier-ignore
const verticesOfCube = [
  -1, -1, -1, 1, -1, -1, 1, 1, -1, -1, 1, -1,
  -1, -1, 1, 1, -1, 1, 1, 1, 1, -1, 1, 1,
];

// prettier-ignore
const indicesOfFaces = [
  2, 1, 0, 0, 3, 2,
  0, 4, 7, 7, 3, 0,
  0, 1, 5, 5, 4, 0,
  1, 2, 6, 6, 5, 1,
  2, 3, 7, 7, 6, 2,
  4, 5, 6, 6, 7, 4
];

export const PolyhedronSt = {
  args: {
    args: [verticesOfCube, indicesOfFaces],
  },
  render: (args) => <PolyhedronScene {...args} />,
  name: 'Default',
} satisfies Story
