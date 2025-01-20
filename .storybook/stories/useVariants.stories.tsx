import * as React from 'react'
import { Vector3 } from 'three'
import type { GLTF } from 'three-stdlib'
import type { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { useAnimations, useGLTF, useMatcapTexture, useVariants } from '../../src'

export default {
  title: 'Abstractions/useVariants',
  component: UseVariantsScene,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 2)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof UseVariantsScene>

interface UseVariantsSceneProps {
  inVariant: string
}

type Story = StoryObj<typeof UseVariantsScene>

useGLTF.preload('MaterialsVariantsShoe.glb')

function UseVariantsScene({ inVariant }: UseVariantsSceneProps) {
  const root = React.useRef<React.ElementRef<'group'>>(null)
  const gltf = useGLTF('MaterialsVariantsShoe.glb') as GLTF
  const { variants, activeVariant, setVariant, materials } = useVariants(gltf, inVariant)
  return (
    <>
      <color attach="background" args={['#FFBE85']} />
      <group position={[0, -0.5, 0]}>
        <group ref={root} dispose={null} scale={10}>
          <primitive object={gltf.scene} />
        </group>
      </group>
    </>
  )
}

export const UseVariantsSt = {
  args: {
    inVariant: 'midnight',
  },
  argTypes: {
    inVariant: { control: 'select', options: ['street', 'beach', 'midnight', 'storm(not in model)'] },
  },
  render: (args) => <UseVariantsScene {...args} />,
  name: 'Default',
} satisfies Story
