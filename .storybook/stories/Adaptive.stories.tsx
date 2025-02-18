import React, { ComponentProps, Suspense } from 'react'
import { Vector3, type Material, type Mesh } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { useGLTF, AdaptiveDpr, AdaptiveEvents, OrbitControls } from '../../src'

import type { GLTF } from 'three-stdlib'

export default {
  title: 'Performance/Adaptive',
  component: AdaptiveDpr,
  decorators: [
    (Story) => (
      <Setup
        cameraPosition={new Vector3(0, 0, 30)}
        cameraFov={50}
        shadows
        controls={false}
        lights={false}
        performance={{ min: 0.2 }}
      >
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof AdaptiveDpr>

type Story = StoryObj<typeof AdaptiveDpr>

interface ArcherGLTF extends GLTF {
  materials: { material_0: Material }
  nodes: Record<'mesh_0' | 'mesh_1' | 'mesh_2', Mesh>
}

function Archer() {
  const {
    nodes: { mesh_0, mesh_1, mesh_2 },
    materials: { material_0 },
  } = useGLTF('/archer.glb') as ArcherGLTF

  return (
    <group dispose={null}>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <group position={[0, 0, 2]}>
          <mesh castShadow receiveShadow material={material_0} geometry={mesh_0.geometry} />
          <mesh castShadow receiveShadow material={material_0} geometry={mesh_1.geometry} />
          <mesh castShadow receiveShadow material={material_0} geometry={mesh_2.geometry} />
        </group>
      </group>
    </group>
  )
}

function AdaptiveScene(props: ComponentProps<typeof AdaptiveDpr>) {
  return (
    <>
      <Suspense fallback={null}>
        <Archer />
      </Suspense>
      <directionalLight
        intensity={0.2 * Math.PI}
        position={[10, 10, 5]}
        shadow-mapSize-width={64}
        shadow-mapSize-height={64}
        castShadow
        shadow-bias={-0.001}
      />
      <AdaptiveDpr {...props} />
      <AdaptiveEvents />
      <OrbitControls regress />
    </>
  )
}

export const AdaptiveSceneSt = {
  name: 'Default',
  render: (args) => <AdaptiveScene {...args} />,
  args: {
    pixelated: true,
  },
  argTypes: {
    pixelated: { control: 'boolean' },
  },
} satisfies Story
