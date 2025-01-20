import * as THREE from 'three'
import * as React from 'react'
import { PerspectiveCamera as PerspectiveCameraImpl } from 'three'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { useFBO } from './Fbo'
import { ForwardRefComponent } from '../helpers/ts-utils'

const isFunction = (node: any): node is Function => typeof node === 'function'

export type PerspectiveCameraProps = Omit<ThreeElements['perspectiveCamera'], 'ref' | 'children'> & {
  /** Registers the camera as the system default, fiber will start rendering with it */
  makeDefault?: boolean
  /** Making it manual will stop responsiveness and you have to calculate aspect ratio yourself. */
  manual?: boolean
  /** The contents will either follow the camera, or be hidden when filming if you pass a function */
  children?: React.ReactNode | ((texture: THREE.Texture) => React.ReactNode)
  /** Number of frames to render, Infinity */
  frames?: number
  /** Resolution of the FBO, 256 */
  resolution?: number
  /** Optional environment map for functional use */
  envMap?: THREE.Texture
}

export const PerspectiveCamera: ForwardRefComponent<PerspectiveCameraProps, PerspectiveCameraImpl> =
  /* @__PURE__ */ React.forwardRef(
    ({ envMap, resolution = 256, frames = Infinity, makeDefault, children, ...props }, ref) => {
      const set = useThree(({ set }) => set)
      const camera = useThree(({ camera }) => camera)
      const size = useThree(({ size }) => size)
      const cameraRef = React.useRef<PerspectiveCameraImpl>(null!)
      React.useImperativeHandle(ref, () => cameraRef.current, [])
      const groupRef = React.useRef<THREE.Group>(null!)
      const fbo = useFBO(resolution)

      React.useLayoutEffect(() => {
        if (!props.manual) {
          cameraRef.current.aspect = size.width / size.height
        }
      }, [size, props])

      React.useLayoutEffect(() => {
        cameraRef.current.updateProjectionMatrix()
      })

      let count = 0
      let oldEnvMap: THREE.Color | THREE.Texture | null = null
      const functional = isFunction(children)
      useFrame((state) => {
        if (functional && (frames === Infinity || count < frames)) {
          groupRef.current.visible = false
          state.gl.setRenderTarget(fbo)
          oldEnvMap = state.scene.background
          if (envMap) state.scene.background = envMap
          state.gl.render(state.scene, cameraRef.current)
          state.scene.background = oldEnvMap
          state.gl.setRenderTarget(null)
          groupRef.current.visible = true
          count++
        }
      })

      React.useLayoutEffect(() => {
        if (makeDefault) {
          const oldCam = camera
          set(() => ({ camera: cameraRef.current! }))
          return () => set(() => ({ camera: oldCam }))
        }
        // The camera should not be part of the dependency list because this components camera is a stable reference
        // that must exchange the default, and clean up after itself on unmount.
      }, [cameraRef, makeDefault, set])

      return (
        <>
          <perspectiveCamera ref={cameraRef} {...props}>
            {!functional && children}
          </perspectiveCamera>
          <group ref={groupRef}>{functional && children(fbo.texture)}</group>
        </>
      )
    }
  )
