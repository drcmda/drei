import * as THREE from 'three'
import * as React from 'react'
import { ComponentProps } from 'react'
import { FlakesTexture } from 'three-stdlib'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { useGLTF, AccumulativeShadows, RandomizedLight, OrbitControls, Environment } from '../../src'

export default {
  title: 'Staging/AccumulativeShadows',
  component: AccumulativeShadows,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof AccumulativeShadows>

type Story = StoryObj<typeof AccumulativeShadows>

function AccumulativeShadowScene(props: ComponentProps<typeof AccumulativeShadows>) {
  return (
    <>
      <color attach="background" args={['goldenrod']} />

      <Suzi rotation={[-0.63, 0, 0]} scale={2} position={[0, -1.175, 0]} />

      <AccumulativeShadows {...props} position={[0, -0.5, 0]}>
        <RandomizedLight amount={8} radius={4} ambient={0.5} bias={0.001} position={[5, 5, -10]} />
      </AccumulativeShadows>

      <OrbitControls autoRotate={true} />
      <Environment preset="city" />
    </>
  )
}

function Suzi(props: ComponentProps<'group'>) {
  const { scene, materials } = useGLTF('/suzanne-high-poly.gltf')
  React.useLayoutEffect(() => {
    scene.traverse((obj) => (obj as any).isMesh && (obj.receiveShadow = obj.castShadow = true))

    const material = materials.default as THREE.MeshStandardMaterial
    material.color.set('orange')
    material.roughness = 0
    material.normalMap = new THREE.CanvasTexture(
      new FlakesTexture() as HTMLCanvasElement,
      THREE.UVMapping,
      THREE.RepeatWrapping,
      THREE.RepeatWrapping
    )
    material.normalMap.flipY = false
    material.normalMap.repeat.set(40, 40)
    material.normalScale.set(0.05, 0.05)
  })
  return <primitive object={scene} {...props} />
}

export const AccumulativeShadowSt = {
  name: 'Default',
  render: (args) => <AccumulativeShadowScene {...args} />,
  args: {
    temporal: true,
    frames: 100,
    color: 'goldenrod',
    alphaTest: 0.65,
    opacity: 2,
    scale: 14,
  },
  argTypes: {
    color: { control: 'color' },
  },
} satisfies Story
