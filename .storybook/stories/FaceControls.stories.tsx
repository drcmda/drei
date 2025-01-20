/* eslint react-hooks/exhaustive-deps: 1 */
import * as THREE from 'three'
import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'
import * as easing from 'maath/easing'

import { Setup } from '../Setup'

import { FaceLandmarker, FaceControls, Box, WebcamVideoTexture } from '../../src'
import { ComponentProps, ComponentRef, useRef, useState } from 'react'
import { FaceLandmarkerResult } from '@mediapipe/tasks-vision'
import { useFrame, useThree } from '@react-three/fiber'

export default {
  title: 'Controls/FaceControls',
  component: FaceControls,
  decorators: [
    (Story) => (
      <Setup cameraFov={60}>
        <Story />
      </Setup>
    ),
  ],
  tags: ['!autodocs'], // FaceLandmarker cannot have multiple instances
} satisfies Meta<typeof FaceControls>

type Story = StoryObj<typeof FaceControls>

//

function FaceControlsScene(props: ComponentProps<typeof FaceControls>) {
  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <React.Suspense fallback={null}>
        <FaceLandmarker>
          <FaceControls {...props} />
        </FaceLandmarker>
      </React.Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt = {
  render: (args) => <FaceControlsScene {...args} />,
  name: 'Default',
} satisfies Story

//

function FaceControlsScene2(props: ComponentProps<typeof FaceControls>) {
  const faceLandmarkerRef = useRef<ComponentRef<typeof FaceLandmarker>>(null)
  const videoTextureRef = useRef<ComponentRef<typeof WebcamVideoTexture>>(null)

  const [faceLandmarkerResult, setFaceLandmarkerResult] = useState<FaceLandmarkerResult>()

  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <React.Suspense fallback={null}>
        <FaceLandmarker ref={faceLandmarkerRef}>
          <WebcamVideoTexture
            ref={videoTextureRef}
            onVideoFrame={(now) => {
              const faceLandmarker = faceLandmarkerRef.current
              const videoTexture = videoTextureRef.current
              if (!faceLandmarker || !videoTexture) return

              const videoFrame = videoTexture.source.data
              const result = faceLandmarker.detectForVideo(videoFrame, now)
              setFaceLandmarkerResult(result)
            }}
          />

          <FaceControls {...props} manualDetect faceLandmarkerResult={faceLandmarkerResult} />
        </FaceLandmarker>
      </React.Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt2 = {
  render: (args) => <FaceControlsScene2 {...args} />,
  name: 'manualDetect',
} satisfies Story

//

function FaceControlsScene3(props: ComponentProps<typeof FaceControls>) {
  const faceControlsRef = useRef<ComponentRef<typeof FaceControls>>(null)

  const camera = useThree((state) => state.camera)
  const [current] = useState(() => new THREE.Object3D())

  useFrame((_, delta) => {
    const target = faceControlsRef.current?.computeTarget()

    if (target) {
      //
      // A. Define your own damping
      //

      const eps = 1e-9
      easing.damp3(current.position, target.position, 0.25, delta, undefined, undefined, eps)
      easing.dampE(current.rotation, target.rotation, 0.25, delta, undefined, undefined, eps)
      camera.position.copy(current.position)
      camera.rotation.copy(current.rotation)

      //
      // B. Or maybe with no damping at all?
      //

      // camera.position.copy(target.position)
      // camera.rotation.copy(target.rotation)
    }
  })

  return (
    <>
      <color attach="background" args={['#303030']} />
      <axesHelper />

      <React.Suspense fallback={null}>
        <FaceLandmarker>
          <FaceControls ref={faceControlsRef} {...props} manualUpdate />
        </FaceLandmarker>
      </React.Suspense>

      <Box args={[0.1, 0.1, 0.1]}>
        <meshStandardMaterial />
      </Box>
    </>
  )
}

export const FaceControlsSt3 = {
  render: (args) => <FaceControlsScene3 {...args} />,
  name: 'manualUpdate',
} satisfies Story
