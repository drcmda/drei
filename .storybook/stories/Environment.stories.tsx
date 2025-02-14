import * as React from 'react'
import { Vector3 } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Environment, ContactShadows, PerspectiveCamera, OrbitControls } from '../../src'

import { presetsObj } from '../../src/helpers/environment-assets'
import { ComponentProps } from 'react'

export default {
  title: 'Staging/Environment',
  component: Environment,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 10)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Environment>

type Story = StoryObj<typeof Environment>

const presets = Object.keys(presetsObj)

function EnvironmentScene1(props: ComponentProps<typeof Environment>) {
  return (
    <>
      <Environment {...props} />
      <mesh>
        <torusKnotGeometry args={[1, 0.5, 128, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
      <OrbitControls autoRotate />
    </>
  )
}

export const EnvironmentSt1 = {
  render: (args) => <EnvironmentScene1 {...args} />,
  args: {
    background: true,
    backgroundBlurriness: 0,
    preset: 'apartment',
  },
  argTypes: {
    background: { control: 'boolean' },
    backgroundBlurriness: { control: { type: 'range', min: 0, max: 1, step: 0.01 } },
    preset: {
      options: presets,
      control: {
        type: 'select',
      },
    },
  },

  name: 'Default',
} satisfies Story

function EnvironmentScene2(props: ComponentProps<typeof Environment>) {
  return (
    <>
      <Environment {...props} />
      <mesh>
        <torusKnotGeometry args={[1, 0.5, 128, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
      <OrbitControls autoRotate />
    </>
  )
}

export const EnvironmentSt2 = {
  render: (args) => <EnvironmentScene2 {...args} />,
  args: {
    background: true,
    path: 'cube/',
    files: ['px.png', 'nx.png', 'py.png', 'ny.png', 'pz.png', 'nz.png'],
  },
  argTypes: {
    background: { control: 'boolean' },
  },
  name: 'Files',
} satisfies Story

function EnvironmentScene3(props: ComponentProps<typeof Environment>) {
  return (
    <>
      <Environment {...props} />
      <mesh position={[0, 5, 0]}>
        <boxGeometry args={[10, 10, 10]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
      <ContactShadows resolution={1024} position={[0, 0, 0]} scale={100} blur={2} opacity={1} far={10} />
      <OrbitControls autoRotate />
      <PerspectiveCamera position={[40, 40, 40]} makeDefault />
    </>
  )
}

export const EnvironmentSt3 = {
  render: (args) => <EnvironmentScene3 {...args} />,
  args: {
    ground: { height: 15, radius: 60 },
    preset: 'park',
  },
  argTypes: {
    preset: {
      options: presets,
      control: {
        type: 'select',
      },
    },
  },
  name: 'Ground',
} satisfies Story

function EnvironmentScene4(props: ComponentProps<typeof Environment>) {
  return (
    <>
      <Environment {...props} />
      <mesh>
        <torusKnotGeometry args={[1, 0.5, 128, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
      <OrbitControls autoRotate />
    </>
  )
}

export const EnvironmentSt4 = {
  render: (args) => <EnvironmentScene4 {...args} />,
  args: {
    files: ['/gainmap/potsdamer_platz_1k.jpg'],
    background: true,
  },
  argTypes: {
    preset: {
      options: presets,
      control: {
        type: 'select',
      },
    },
  },
  name: 'Gainmap',
} satisfies Story

function EnvironmentScene5(props: ComponentProps<typeof Environment>) {
  return (
    <>
      <Environment {...props} />
      <mesh>
        <torusKnotGeometry args={[1, 0.5, 128, 32]} />
        <meshStandardMaterial metalness={1} roughness={0} />
      </mesh>
      <OrbitControls autoRotate />
    </>
  )
}

export const EnvironmentSt5 = {
  render: (args) => <EnvironmentScene5 {...args} />,
  args: {
    color: '#ff0000',
    background: true,
  },
  name: 'Color',
} satisfies Story
