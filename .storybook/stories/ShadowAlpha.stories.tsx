import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { useFrame } from '@react-three/fiber'
import { BufferGeometry, MeshStandardMaterial, type Mesh } from 'three'
import { Icosahedron, Plane, ShadowAlpha } from '../../src'

export default {
  title: 'Misc/ShadowAlpha',
  component: ShadowAlpha,
  decorators: [
    (Story) => (
      <Setup lights={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof ShadowAlpha>

type Story = StoryObj<typeof ShadowAlpha>

function ShadowAlphaScene(props: React.ComponentProps<typeof ShadowAlpha>) {
  const mesh = React.useRef<Mesh<BufferGeometry, MeshStandardMaterial>>(null!)

  useFrame(({ clock }) => {
    const time = clock.elapsedTime
    mesh.current.material.opacity = Math.sin(time * 2) * 0.5 + 0.5
  })

  return (
    <>
      <Icosahedron castShadow ref={mesh} args={[1, 2]} position-y={2}>
        <meshStandardMaterial color="lightblue" transparent />
        <ShadowAlpha {...props} />
      </Icosahedron>

      <Plane receiveShadow args={[4, 4]} rotation={[-Math.PI / 2, 0, 0]}>
        <meshStandardMaterial color="white" />
      </Plane>

      <directionalLight castShadow position={[10, 40, 10]} />
      <ambientLight intensity={0.5 * Math.PI} />
    </>
  )
}

export const ShadowAlphaSt = {
  render: (args) => <ShadowAlphaScene {...args} />,
  name: 'Default',
} satisfies Story
