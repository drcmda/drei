import * as React from 'react'
import { Vector3 } from 'three'
import { useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Segment, Segments, OrbitControls } from '../../src'

export default {
  title: 'Performance/Segments',
  decorators: [
    (Story) => (
      <Setup controls={false} cameraPosition={new Vector3(10, 10, 10)}>
        <Story />
      </Setup>
    ),
  ],
  component: Segments,
} satisfies Meta<typeof Segments>

type Story = StoryObj<typeof Segments>

function BasicSegmentsScene(props: React.ComponentProps<typeof Segments>) {
  return (
    <>
      <Segments {...props}>
        <Segment start={[0, 0, 0]} end={[10, 0, 0]} color={'red'} />
        <Segment start={[0, 0, 0]} end={[0, 10, 0]} color={'blue'} />
        <Segment start={[0, 0, 0]} end={[0, 0, 10]} color={'green'} />
        <Segment start={[0, 0, 0]} end={[-10, 0, 0]} color={[1, 0, 0]} />
        <Segment start={[0, 0, 0]} end={[0, -10, 0]} color={[0, 1, 0]} />
        <Segment start={[0, 0, 0]} end={[0, 0, -10]} color={[1, 1, 0]} />
      </Segments>
      <OrbitControls />
    </>
  )
}

export const BasicSegmentsSt = {
  args: {
    limit: 6,
    lineWidth: 2.0,
  },
  render: (args) => <BasicSegmentsScene {...args} />,
  name: 'Basic',
} satisfies Story

//

function AnimatedSegments(props: React.ComponentProps<typeof Segments>) {
  const ref = React.useRef<React.ComponentRef<typeof Segment>[]>([])
  useFrame(({ clock }) => {
    ref.current.forEach((r, i) => {
      const time = clock.elapsedTime
      const x = Math.sin((i / 5000) * Math.PI) * 10
      const y = Math.cos((i / 5000) * Math.PI) * 10
      const z = Math.cos((i * time) / 1000)
      r.start.set(x, y, z)
      r.end.set(x + Math.sin(time + i), y + Math.cos(time + i), z)
      r.color.setRGB(x / 10, y / 10, z)
    })
  })
  return (
    <Segments {...props}>
      {Array.from({ length: 10000 }).map((_, i) => (
        <Segment
          key={i}
          ref={(r) => {
            ref.current[i] = r!
            return () => void (ref.current[i] = null!)
          }}
          color="orange"
          start={[0, 0, 0]}
          end={[0, 0, 0]}
        />
      ))}
    </Segments>
  )
}

function ManySegmentsScene(props: React.ComponentProps<typeof Segments>) {
  return (
    <>
      <AnimatedSegments {...props} />
      <OrbitControls />
    </>
  )
}

export const ManySegmentsSt = {
  args: {
    limit: 10000,
    lineWidth: 0.1,
  },
  render: (args) => <ManySegmentsScene {...args} />,
  name: 'Performance',
} satisfies Story
