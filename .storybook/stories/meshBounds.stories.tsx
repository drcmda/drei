import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { meshBounds } from '../../src'

function MeshBounds(props: React.ComponentProps<'mesh'>) {
  const mesh = useTurntable<React.ComponentRef<'mesh'>>()

  const [hovered, setHover] = React.useState(false)

  return (
    <mesh
      {...props}
      raycast={meshBounds}
      ref={mesh}
      onPointerOver={() => setHover(true)}
      onPointerOut={() => setHover(false)}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="hotpink" wireframe={!hovered} />
    </mesh>
  )
}

export default {
  title: 'Misc/meshBounds',
  component: MeshBounds,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MeshBounds>

type Story = StoryObj<typeof MeshBounds>

function MeshBoundsScene(props: React.ComponentProps<typeof MeshBounds>) {
  return (
    <>
      <MeshBounds {...props} position={[0, 1, 0]} />
      <MeshBounds {...props} position={[1, -1, 0]} />
      <MeshBounds {...props} position={[-1, -1, 0]} />
    </>
  )
}

export const MeshBoundsSt = {
  render: (args) => <MeshBoundsScene {...args} />,
  name: 'Default',
} satisfies Story
