import * as THREE from 'three'
import * as React from 'react'
import { useFrame, useThree, createPortal } from '@react-three/fiber'

type RenderHudProps = {
  defaultScene: THREE.Scene
  defaultCamera: THREE.Camera
  renderPriority?: number
}

function RenderHud({ defaultScene, defaultCamera, renderPriority = 1 }: RenderHudProps) {
  const { gl, scene, camera } = useThree()
  let oldCLear
  useFrame(() => {
    oldCLear = gl.autoClear
    if (renderPriority === 1) {
      // Clear scene and render the default scene
      gl.autoClear = true
      gl.render(defaultScene, defaultCamera)
    }
    // Disable cleaning and render the portal with its own camera
    gl.autoClear = false
    gl.clearDepth()
    gl.render(scene, camera)
    // Restore default
    gl.autoClear = oldCLear
  }, renderPriority)
  // Without an element that receives pointer events state.pointer will always be 0/0
  return <group onPointerOver={() => null} />
}

export type HudProps = {
  /** Any React node */
  children: React.ReactNode
  /** Render priority, default: 1 */
  renderPriority?: number
}

export function Hud({ children, renderPriority = 1 }: HudProps) {
  const { scene: defaultScene, camera: defaultCamera } = useThree()
  const [hudScene] = React.useState(() => new THREE.Scene())
  return (
    <>
      {createPortal(
        <>
          {children}
          <RenderHud defaultScene={defaultScene} defaultCamera={defaultCamera} renderPriority={renderPriority} />
        </>,
        hudScene,
        { events: { priority: renderPriority + 1 } }
      )}
    </>
  )
}
