import { createPortal, useFrame } from '@react-three/fiber'
import React, { ComponentProps, useRef, useState } from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { ArcballControls, Box, PerspectiveCamera, Plane, useFBO } from '../../src'

import { Scene, type OrthographicCamera, type PerspectiveCamera as PerspectiveCameraType } from 'three'

export default {
  title: 'Controls/ArcballControls',
  component: ArcballControls,
  decorators: [
    (Story) => (
      <Setup controls={false}>
        <Story />
      </Setup>
    ),
  ],
  args: {
    enablePan: true,
    enableRotate: true,
    enableZoom: true,
  },
} satisfies Meta<typeof ArcballControls>

type Story = StoryObj<typeof ArcballControls>

function DefaultScene(props: ComponentProps<typeof ArcballControls>) {
  return (
    <>
      <ArcballControls {...props} />
      <Box>
        <meshBasicMaterial wireframe />
      </Box>
    </>
  )
}

export const ArcballControlsSt1 = {
  render: (args) => <DefaultScene {...args} />,
  name: 'Default',
} satisfies Story

const CustomCamera = ({ ...props }: ComponentProps<typeof ArcballControls>) => {
  /**
   * we will render our scene in a render target and use it as a map.
   */
  const fbo = useFBO(400, 400)
  const virtualCamera = useRef<PerspectiveCameraType>(null!)
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

          <ArcballControls camera={virtualCamera.current} {...props} />

          <color attach="background" args={['hotpink']} />
        </>,
        virtualScene
      )}
    </>
  )
}

export const ArcballControlsSt2 = {
  render: (args) => <CustomCamera {...args} />,
  name: 'Custom Camera',
} satisfies Story
