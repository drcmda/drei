import * as React from 'react'
import * as THREE from 'three'
import { useLoader } from '@react-three/fiber'
import { RGBELoader } from 'three-stdlib'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import {
  MeshRefractionMaterial,
  useGLTF,
  Caustics,
  CubeCamera,
  Environment,
  OrbitControls,
  RandomizedLight,
  AccumulativeShadows,
  MeshTransmissionMaterial,
} from '../../src'

export default {
  title: 'Shaders/MeshRefractionMaterial',
  component: MeshRefractionMaterial,
  decorators: [
    (Story) => (
      <Setup cameraFov={45} cameraPosition={new THREE.Vector3(-5, 0.5, 5)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof MeshRefractionMaterial>

type Story = StoryObj<typeof MeshRefractionMaterial>

function Diamond({
  rotation,
  position,
  ...meshRefractionMaterialProps
}: {
  rotation: React.ComponentProps<'mesh'>['rotation']
  position: React.ComponentProps<'mesh'>['position']
} & React.ComponentProps<typeof MeshRefractionMaterial>) {
  const ref = React.useRef<React.ComponentRef<'mesh'>>(null)
  const { nodes } = useGLTF('/dflat.glb') as any
  // Use a custom envmap/scene-backdrop for the diamond material
  // This way we can have a clear BG while cube-cam can still film other objects
  const texture = useLoader(
    RGBELoader,
    'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr'
  )
  return (
    <CubeCamera resolution={256} frames={1} envMap={texture}>
      {(texture) => (
        <Caustics
          // @ts-ignore
          backfaces
          color="white"
          position={[0, -0.5, 0]}
          lightSource={[5, 5, -10]}
          worldRadius={0.1}
          ior={1.8}
          backfaceIor={1.1}
          intensity={0.1}
        >
          <mesh castShadow ref={ref} geometry={nodes.Diamond_1_0.geometry} rotation={rotation} position={position}>
            <MeshRefractionMaterial {...meshRefractionMaterialProps} envMap={texture} />
          </mesh>
        </Caustics>
      )}
    </CubeCamera>
  )
}

function RefractionScene(props: React.ComponentProps<typeof MeshRefractionMaterial>) {
  return (
    <>
      <color attach="background" args={['#f0f0f0']} />
      <ambientLight intensity={0.5} />
      <spotLight position={[5, 5, -10]} angle={0.15} penumbra={1} />
      <pointLight position={[-10, -10, -10]} />

      <Diamond rotation={[0, 0, 0.715]} position={[0, -0.175 + 0.5, 0]} {...props} />

      {/* @ts-ignore */}
      <Caustics
        color="#FF8F20"
        position={[0, -0.5, 0]}
        lightSource={[5, 5, -10]}
        worldRadius={0.003}
        ior={1.16}
        intensity={0.004}
      >
        <mesh castShadow receiveShadow position={[-2, 0.5, -1]} scale={0.5}>
          <sphereGeometry args={[1, 64, 64]} />
          {/* @ts-ignore */}
          <MeshTransmissionMaterial resolution={1024} distortion={0.25} color="#FF8F20" thickness={1} anisotropy={1} />
        </mesh>
      </Caustics>
      <mesh castShadow receiveShadow position={[1.75, 0.25, 1]} scale={0.75}>
        <sphereGeometry args={[1, 64, 64]} />
        <meshStandardMaterial color="hotpink" />
      </mesh>
      <AccumulativeShadows
        temporal
        frames={100}
        color="orange"
        colorBlend={2}
        toneMapped={true}
        alphaTest={0.8}
        opacity={1}
        scale={12}
        position={[0, -0.5, 0]}
      >
        <RandomizedLight amount={8} radius={10} ambient={0.5} intensity={1} position={[5, 5, -10]} bias={0.001} />
      </AccumulativeShadows>
      <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/aerodynamics_workshop_1k.hdr" />
      <OrbitControls makeDefault autoRotate autoRotateSpeed={0.1} minPolarAngle={0} maxPolarAngle={Math.PI / 2} />
    </>
  )
}

export const RefractionSt = {
  args: {
    bounces: 3,
    aberrationStrength: 0.01,
    ior: 2.75,
    fresnel: 1,
    fastChroma: true,
    toneMapped: false,
  },
  render: (args) => <RefractionScene {...args} />,
  name: 'Default',
} satisfies Story
