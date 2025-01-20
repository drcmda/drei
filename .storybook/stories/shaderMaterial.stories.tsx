import * as React from 'react'
import { extend } from '@react-three/fiber'
import { Texture } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { Box, shaderMaterial, useTexture } from '../../src'

const MyMaterial = shaderMaterial(
  { map: new Texture(), repeats: 1 },
  /* glsl */ `
    varying vec2 vUv;

    void main()	{
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1);
    }
  `,
  /* glsl */ `
    varying vec2 vUv;
    uniform float repeats;
    uniform sampler2D map;

    float random (vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main(){
      vec2 uv = vUv;

      uv *= repeats;
      uv = fract(uv);

      vec3 color = vec3(
        texture2D(map, uv).r,
        texture2D(map, uv + vec2(0.01, 0.01)).g,
        texture2D(map, uv - vec2(0.01, 0.01)).b
      );

      gl_FragColor = vec4(color, 1.0);

      #include <tonemapping_fragment>
      #include <encodings_fragment>
    }
  `
)
extend({ MyMaterial })

declare module '@react-three/fiber' {
  interface ThreeElements {
    myMaterial: ThreeElements['shaderMaterial'] & {
      repeats: number
      map: Texture | Texture[]
    }
  }
}

function ShaderMaterial(props: React.ComponentProps<'myMaterial'>) {
  return <myMaterial {...props} />
}

export default {
  title: 'Shaders/shaderMaterial',
  component: ShaderMaterial,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof ShaderMaterial>

type Story = StoryObj<typeof ShaderMaterial>

function ShaderMaterialScene(args) {
  const map = useTexture(`images/living-room-2.jpg`)

  return (
    <Box args={[5, 5, 5]}>
      <ShaderMaterial {...args} map={map} />
    </Box>
  )
}

export const ShaderMaterialSt = {
  args: {
    repeats: 2,
  },
  argTypes: {
    repeats: { control: { type: 'range', min: 1, max: 10, step: 1 } },
  },
  render: (args) => <ShaderMaterialScene {...args} />,
  name: 'Default',
} satisfies Story
