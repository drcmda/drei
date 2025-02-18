import * as React from 'react'
import { Color, Vector3 } from 'three'

import { Setup } from '../Setup'

import { MarchingCube, MarchingCubes, MarchingPlane, OrbitControls } from '../../src'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

export default {
  title: 'Abstractions/MarchingCubes',
  component: MarchingCubes,
  args: {
    resolution: 40,
    maxPolyCount: 40000,
  },
  decorators: [
    (Story) => (
      <Setup controls={false} cameraPosition={new Vector3(0, 0, 10)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MarchingCubes>

type Story = StoryObj<typeof MarchingCubes>

function MarchingCubesScene({
  planeX,
  planeY,
  planeZ,
  ...props
}: {
  planeX?: boolean
  planeY?: boolean
  planeZ?: boolean
} & React.ComponentProps<typeof MarchingCubes>) {
  const cubeRefOne = React.useRef<React.ComponentRef<typeof MarchingCube>>(null)
  const cubeRefTwo = React.useRef<React.ComponentRef<typeof MarchingCube>>(null)

  useFrame(({ clock }) => {
    if (!cubeRefOne.current || !cubeRefTwo.current) return
    const time = clock.getElapsedTime()
    cubeRefOne.current.position.set(0.5, Math.sin(time * 0.4) * 0.5 + 0.5, 0.5)
    cubeRefTwo.current.position.set(0.5, Math.cos(time * 0.4) * 0.5 + 0.5, 0.5)
  })

  return (
    <>
      <MarchingCubes {...props} enableColors={true} scale={2}>
        <MarchingCube ref={cubeRefOne} color={new Color('#f0f')} position={[0.5, 0.6, 0.5]} />
        <MarchingCube ref={cubeRefTwo} color={new Color('#ff0')} position={[0.5, 0.5, 0.5]} />

        {planeX && <MarchingPlane planeType="x" />}
        {planeY && <MarchingPlane planeType="y" />}
        {planeZ && <MarchingPlane planeType="z" />}

        <meshPhongMaterial specular={0xffffff} shininess={2} vertexColors={true} />
      </MarchingCubes>
      <axesHelper />
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const MarchingCubesSt1 = {
  render: (args) => <MarchingCubesScene {...args} planeX />,
  name: 'planeX',
} satisfies Story

export const MarchingCubesSt2 = {
  render: (args) => <MarchingCubesScene {...args} planeY />,
  name: 'planeY',
} satisfies Story

export const MarchingCubesSt3 = {
  render: (args) => <MarchingCubesScene {...args} planeZ />,
  name: 'planeZ',
} satisfies Story

export const MarchingCubesSt4 = {
  render: (args) => <MarchingCubesScene {...args} planeX planeY />,
  name: 'planeX planeY',
} satisfies Story

export const MarchingCubesSt5 = {
  render: (args) => <MarchingCubesScene {...args} planeX planeZ />,
  name: 'planeX planeZ',
} satisfies Story

export const MarchingCubesSt6 = {
  render: (args) => <MarchingCubesScene {...args} planeX planeY planeZ />,
  name: 'planeX planeY planeZ',
} satisfies Story
