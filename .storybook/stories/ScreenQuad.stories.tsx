import * as React from 'react'
import * as THREE from 'three'
import { extend, useThree, useFrame, ThreeElements } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { ScreenQuad, shaderMaterial } from '../../src'

export default {
  title: 'Shapes/ScreenQuad',
  component: ScreenQuad,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof ScreenQuad>

type Story = StoryObj<typeof ScreenQuad>

const ColorShiftMaterial = shaderMaterial(
  { time: 0, resolution: new THREE.Vector2() },
  `
  void main() {
    gl_Position = vec4(position, 1.0);
  }
  `,
  `
  uniform float time;
  uniform vec2 resolution;
  vec3 colorA = vec3(0.149,0.141,0.912);
  vec3 colorB = vec3(1.000,0.833,0.224);
  void main() {
    vec3 color = vec3(0.0);
    float pct = abs(sin(time));
    color = mix(colorA, colorB, pct);
    gl_FragColor = vec4(color,1.0);

    #include <tonemapping_fragment>
    #include <encodings_fragment>
  }
  `
)

extend({ ColorShiftMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    colorShiftMaterial: ThreeElements['shaderMaterial'] & {
      time: number
      resolution: number[]
    }
  }
}

function ScreenQuadScene(props: React.ComponentProps<typeof ScreenQuad>) {
  const size = useThree((state) => state.size)
  const ref = React.useRef<ThreeElements['colorShiftMaterial']>(null!)

  useFrame((state) => {
    if (ref.current.uniforms) {
      ref.current.uniforms.time.value = state.clock.elapsedTime
    }
  })

  return (
    <ScreenQuad {...props}>
      <colorShiftMaterial ref={ref} time={0} resolution={[size.width, size.height]} />
    </ScreenQuad>
  )
}

export const ScreenQuadSt = {
  render: (args) => <ScreenQuadScene {...args} />,
  name: 'Default',
} satisfies Story
