import * as React from 'react'
import * as THREE from 'three'
import { Canvas } from 'react-three-fiber'

import { OrbitControls } from '../src'

export function Setup({
  children,
  cameraFov = 75,
  cameraPosition = new THREE.Vector3(-5, 5, 5),
  controls = true,
  ...restProps
}) {
  return (
    <Canvas
      colorManagement
      shadowMap
      camera={{ position: cameraPosition, fov: cameraFov }}
      pixelRatio={window.devicePixelRatio}
      {...restProps}
    >
      {children}
      <ambientLight intensity={0.8} />
      <pointLight intensity={1} position={[0, 6, 0]} />
      {controls && <OrbitControls />}
    </Canvas>
  )
}
