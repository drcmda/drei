import { createPortal, useFrame } from '@react-three/fiber'
import React, { useRef, useState } from 'react'
import { Scene } from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { Box, OrbitControls, PerspectiveCamera, Plane, useFBO, type OrbitControlsProps } from '../../src'

export default {
  title: 'Controls/OrbitControls',
  component: OrbitControls,
  args: {
    enableDamping: true,
    enablePan: true,
    enableRotate: true,
    enableZoom: true,
    reverseOrbit: false,
  },
  decorators: [
    (Story) => (
      <Setup controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof OrbitControls>

type Story = StoryObj<typeof OrbitControls>

function OrbitControlsScene(props: React.ComponentProps<typeof OrbitControls>) {
  return (
    <>
      <OrbitControls {...props} />
      <Box>
        <meshBasicMaterial wireframe />
      </Box>
    </>
  )
}

export const OrbitControlsStory = {
  render: (args) => <OrbitControlsScene {...args} />,
  name: 'Default',
} satisfies Story

//

const CustomCamera = (props: OrbitControlsProps) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useRef<React.ComponentRef<typeof PerspectiveCamera> | null>(null)
  const [virtualScene] = useState(() => new Scene())

  useFrame(({ gl }) => {
    if (virtualCamera.current) {
      gl.setRenderTarget(fbo)
      gl.render(virtualScene, virtualCamera.current)

      gl.setRenderTarget(null)
    }
  })

  return (
    <>
      <Plane args={[4, 4, 4]}>
        <meshBasicMaterial map={fbo.texture} />
      </Plane>

      {createPortal(
        <>
          <Box>
            <meshBasicMaterial wireframe />
          </Box>

          <PerspectiveCamera name="FBO Camera" ref={virtualCamera} position={[0, 0, 5]} />
          <OrbitControls camera={virtualCamera.current || undefined} {...props} />

          {/* @ts-ignore */}
          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const CustomCameraStory = {
  render: (args) => <CustomCamera {...args} />,
  name: 'Custom Camera',
} satisfies Story
