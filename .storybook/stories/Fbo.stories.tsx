import * as React from 'react'
import * as THREE from 'three'
import { createPortal, useFrame } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Fbo, TorusKnot, Box, PerspectiveCamera } from '../../src'

export default {
  title: 'Misc/Fbo',
  component: Fbo,
  decorators: [
    (Story) => (
      <Setup>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Fbo>

type Story = StoryObj<typeof Fbo>

function SpinningThing() {
  const mesh = React.useRef<React.ComponentRef<typeof TorusKnot>>(null!)

  useFrame(() => {
    mesh.current.rotation.x = mesh.current.rotation.y = mesh.current.rotation.z += 0.01
  })

  return (
    <TorusKnot ref={mesh} args={[1, 0.4, 100, 64]}>
      <meshNormalMaterial />
    </TorusKnot>
  )
}

function FboScene(props: React.ComponentProps<typeof Fbo>) {
  return <Fbo {...props}>{(target) => <TargetWrapper target={target} />}</Fbo>
}

function TargetWrapper({ target }: { target: THREE.WebGLRenderTarget }) {
  const cam = React.useRef<React.ComponentRef<typeof PerspectiveCamera>>(null!)

  const scene = React.useMemo(() => {
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('orange')
    return scene
  }, [])

  useFrame((state) => {
    cam.current.position.z = 5 + Math.sin(state.clock.getElapsedTime() * 1.5) * 2
    state.gl.setRenderTarget(target)
    state.gl.render(scene, cam.current)
    state.gl.setRenderTarget(null)
  })

  return (
    <>
      <PerspectiveCamera ref={cam} position={[0, 0, 3]} />
      {createPortal(<SpinningThing />, scene)}
      <Box args={[3, 3, 3]}>
        <meshStandardMaterial map={target?.texture} />
      </Box>
    </>
  )
}

export const FboSt = {
  args: { width: 512, height: 512, samples: 8, stencilBuffer: false, format: THREE.RGBAFormat },
  argTypes: {
    width: { control: 'range', min: 1, max: 2048, step: 1 },
    height: { control: 'range', min: 1, max: 2048, step: 1 },
    samples: { control: 'range', min: 0, max: 64, step: 1 },
  },
  render: (args) => <FboScene {...args} />,
  name: 'Default',
} satisfies Story
