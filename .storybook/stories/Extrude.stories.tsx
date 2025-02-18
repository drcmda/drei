import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Extrude } from '../../src'

export default {
  title: 'Shapes/Extrude',
  component: Extrude,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(-30, 30, 30)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Extrude>

type Story = StoryObj<typeof Extrude>

function ExtrudeScene(props: React.ComponentProps<typeof Extrude>) {
  const ref = useTurntable<React.ComponentRef<typeof Extrude>>()

  return (
    <>
      <Extrude ref={ref} {...props}>
        <meshPhongMaterial color="#f3f3f3" wireframe />
      </Extrude>
    </>
  )
}

const shape = new THREE.Shape()
const width = 8
const length = 12
shape.moveTo(0, 0)
shape.lineTo(0, width)
shape.lineTo(length, width)
shape.lineTo(length, 0)
shape.lineTo(0, 0)

export const ExtrudeSt = {
  args: {
    args: [
      shape,
      {
        steps: 2,
        depth: 16,
        bevelEnabled: true,
        bevelThickness: 1,
        bevelSize: 1,
        bevelOffset: 0,
        bevelSegments: 1,
      },
    ],
  },
  render: (args) => <ExtrudeScene {...args} />,
  name: 'Default',
} satisfies Story
