import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Sampler, ComputedAttribute, TransformFn } from '../../src'
import { BufferAttribute, InstancedMesh, Mesh, Vector3 } from 'three'

export default {
  title: 'Misc/Sampler',
  component: Sampler,
  args: {
    count: 500,
  },
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Sampler>

type Story = StoryObj<typeof Sampler>

function SamplerScene(props: React.ComponentProps<typeof Sampler>) {
  return (
    <>
      <Sampler {...props}>
        <mesh>
          <torusKnotGeometry />
          <meshNormalMaterial />
        </mesh>

        <instancedMesh args={[null!, null!, 1_000]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshNormalMaterial />
        </instancedMesh>
      </Sampler>
    </>
  )
}

export const SamplerSt = {
  render: (args) => <SamplerScene {...args} />,
  name: 'Default',
} satisfies Story

//

function RefAPIScene(props: React.ComponentProps<typeof Sampler>) {
  const meshRef = React.useRef<Mesh>(null!)
  const instancesRef = React.useRef<InstancedMesh>(null!)

  return (
    <>
      <Sampler {...props} mesh={meshRef} instances={instancesRef} />

      <mesh ref={meshRef}>
        <torusKnotGeometry />
        <meshNormalMaterial />
      </mesh>

      <instancedMesh ref={instancesRef} args={[null!, null!, 1_000]}>
        <sphereGeometry args={[0.1, 32, 32]} />
        <meshNormalMaterial />
      </instancedMesh>
    </>
  )
}

export const RefAPISt = {
  render: (args) => <RefAPIScene {...args} />,
  name: 'Using Refs',
} satisfies Story

//

function TransformSamplerScene(props: React.ComponentProps<typeof Sampler>) {
  return (
    <>
      <Sampler {...props} transform={transformInstances}>
        <mesh>
          <torusKnotGeometry />
          <meshNormalMaterial />
        </mesh>

        <instancedMesh args={[null!, null!, 1_000]}>
          <sphereGeometry args={[0.1, 32, 32]} />
          <meshNormalMaterial />
        </instancedMesh>
      </Sampler>
    </>
  )
}

export const SamplerTransformSt = {
  render: (args) => <TransformSamplerScene {...args} />,
  name: 'With transform',
} satisfies Story

//

function remap(x: number, [low1, high1]: number[], [low2, high2]: number[]) {
  return low2 + ((x - low1) * (high2 - low2)) / (high1 - low1)
}

const computeUpness = (geometry) => {
  const { array, count } = geometry.attributes.normal
  const arr = Float32Array.from({ length: count })

  const normalVector = new Vector3()
  const up = new Vector3(0, 1, 0)

  for (let i = 0; i < count; i++) {
    const n = array.slice(i * 3, i * 3 + 3)
    normalVector.set(n[0], n[1], n[2])

    const dot = normalVector.dot(up)
    const value = dot > 0.4 ? remap(dot, [0.4, 1], [0, 1]) : 0
    arr[i] = Number(value)
  }

  return new BufferAttribute(arr, 1)
}

function SamplerWeightScene(props: React.ComponentProps<typeof Sampler>) {
  return (
    <>
      <Sampler {...props}>
        <mesh>
          <torusKnotGeometry>
            <ComputedAttribute name="upness" compute={computeUpness} />
          </torusKnotGeometry>
          <meshNormalMaterial />
        </mesh>

        <instancedMesh args={[null!, null!, 1_000]}>
          <sphereGeometry args={[0.1, 32, 32, Math.PI / 2]} />
          <meshNormalMaterial />
        </instancedMesh>
      </Sampler>
    </>
  )
}

const transformInstances: TransformFn = ({ dummy, position }) => {
  dummy.position.copy(position)
  dummy.scale.setScalar(Math.random() * 0.75)
}

export const SamplerWeightSt = {
  args: {
    weight: 'upness',
    transform: transformInstances,
  },
  render: (args) => <SamplerWeightScene {...args} />,
  name: 'With weight',
} satisfies Story
