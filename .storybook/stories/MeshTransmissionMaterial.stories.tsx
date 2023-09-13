import * as React from 'react'
import * as THREE from 'three'
import { Setup } from '../Setup'
import {
  useGLTF,
  MeshTransmissionMaterial,
  AccumulativeShadows,
  RandomizedLight,
  Environment,
  OrbitControls,
  Center,
} from '../../src'

export default {
  title: 'Shaders/MeshTransmissionMaterial',
  component: MeshTransmissionMaterial,
  decorators: [
    (storyFn) => (
      <Setup cameraFov={25} cameraPosition={new THREE.Vector3(15, 0, 15)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

// https://sketchfab.com/3d-models/gelatinous-cube-e08385238f4d4b59b012233a9fbdca21
export function GelatinousCube() {
  const { nodes, materials } = useGLTF('/gelatinous_cube.glb') as any
  return (
    <group dispose={null}>
      <mesh geometry={nodes.cube1.geometry} position={[-0.56, 0.38, -0.11]}>
        <MeshTransmissionMaterial
          background={new THREE.Color('#839681')}
          backside={false}
          samples={10}
          resolution={2048}
          transmission={1}
          roughness={0}
          thickness={3.5}
          ior={1.5}
          chromaticAberration={0.06}
          anisotropy={0.1}
          distortion={0.0}
          distortionScale={0.3}
          temporalDistortion={0.5}
          clearcoat={1}
          attenuationDistance={0.5}
          attenuationColor="#ffffff"
          color="#c9ffa1"
        />
      </mesh>
      <mesh
        castShadow
        renderOrder={-100}
        geometry={nodes.cube2.geometry}
        material={materials.cube_mat}
        material-side={THREE.FrontSide}
        position={[-0.56, 0.38, -0.11]}
      />
      <mesh geometry={nodes.bubbles.geometry} material={materials.cube_bubbles_mat} position={[-0.56, 0.38, -0.11]} />
      <group position={[-0.56, 0.38, -0.41]}>
        <mesh geometry={nodes.arrows.geometry} material={materials.weapons_mat} />
        <mesh geometry={nodes.skeleton_1.geometry} material={materials.skele_mat} />
        <mesh geometry={nodes.skeleton_2.geometry} material={materials.weapons_mat} material-side={THREE.FrontSide} />
      </group>
    </group>
  )
}

export const TransmissionSt = () => (
  <React.Suspense fallback={null}>
    <ambientLight />
    <group position={[0, -2.5, 0]}>
      <Center top>
        <GelatinousCube />
      </Center>
      <AccumulativeShadows
        temporal
        frames={100}
        alphaTest={0.9}
        color="#3ead5d"
        colorBlend={1}
        opacity={0.8}
        scale={20}
      >
        <RandomizedLight radius={10} ambient={0.5} intensity={1} position={[2.5, 8, -2.5]} bias={0.001} />
      </AccumulativeShadows>
    </group>
    <OrbitControls minPolarAngle={0} maxPolarAngle={Math.PI / 2} autoRotate autoRotateSpeed={0.05} makeDefault />
    <Environment files="https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/dancing_hall_1k.hdr" background blur={1} />
  </React.Suspense>
)
TransmissionSt.storyName = 'Default'
