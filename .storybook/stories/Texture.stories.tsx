import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Icosahedron, Texture } from '../../src'

export default {
  title: 'Loaders/Texture',
  component: Texture,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Texture>

type Story = StoryObj<typeof Texture>

function TextureScene(props: React.ComponentProps<typeof Texture>) {
  return (
    <Texture {...props}>
      {(textures) => (
        <>
          <Icosahedron position={[-2, 0, 0]}>
            <meshMatcapMaterial matcap={textures[0]} />
          </Icosahedron>
          <Icosahedron position={[2, 0, 0]}>
            <meshMatcapMaterial matcap={textures[1]} />
          </Icosahedron>
        </>
      )}
    </Texture>
  )
}

export const UseTextureSceneSt = {
  args: {
    input: ['matcap-1.png', 'matcap-2.png'],
  },
  render: (args) => <TextureScene {...args} />,
  name: 'Default',
} satisfies Story

//

function TextureScene2(props: React.ComponentProps<typeof Texture>) {
  return (
    <Texture {...props}>
      {(textures) => (
        <Icosahedron position={[0, 0, 0]}>
          <meshStandardMaterial {...(textures as any)} metalness={1} />
        </Icosahedron>
      )}
    </Texture>
  )
}

export const UseTextureSceneSt2 = {
  args: {
    input: {
      map: 'matcap-1.png',
      metalnessMap: 'matcap-2.png',
    },
  },
  render: (args) => <TextureScene2 {...args} />,
  name: 'With object input',
} satisfies Story
