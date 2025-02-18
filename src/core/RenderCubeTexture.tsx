import * as THREE from 'three'
import * as React from 'react'
import { ComputeFunction, ReactThreeFiber, ThreeElements, createPortal, useFrame, useThree } from '@react-three/fiber'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type RenderCubeTextureProps = Omit<ThreeElements['texture'], 'ref' | 'args' | 'rotation'> & {
  /** Optional stencil buffer, defaults to false */
  stencilBuffer?: boolean
  /** Optional depth buffer, defaults to true */
  depthBuffer?: boolean
  /** Optional generate mipmaps, defaults to false */
  generateMipmaps?: boolean
  /** Optional render priority, defaults to 0 */
  renderPriority?: number
  /** Optional event priority, defaults to 0 */
  eventPriority?: number
  /** Optional frame count, defaults to Infinity. If you set it to 1, it would only render a single frame, etc */
  frames?: number
  /** Optional event compute, defaults to undefined */
  compute?: ComputeFunction
  /** Flip cubemap, see https://github.com/mrdoob/three.js/blob/master/src/renderers/WebGLCubeRenderTarget.js */
  flip?: boolean
  /** Cubemap resolution (for each of the 6 takes), null === full screen resolution, default: 896 */
  resolution?: number
  /** Children will be rendered into a portal */
  children: React.ReactNode
  near?: number
  far?: number
  position?: ReactThreeFiber.Vector3
  rotation?: ReactThreeFiber.Euler
  scale?: ReactThreeFiber.Vector3
  quaternion?: ReactThreeFiber.Quaternion
  matrix?: ReactThreeFiber.Matrix4
  matrixAutoUpdate?: boolean
}

export type RenderCubeTextureApi = {
  scene: THREE.Scene
  fbo: THREE.WebGLCubeRenderTarget
  camera: THREE.CubeCamera
}

export const RenderCubeTexture: ForwardRefComponent<RenderCubeTextureProps, RenderCubeTextureApi> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        children,
        compute,
        renderPriority = -1,
        eventPriority = 0,
        frames = Infinity,
        stencilBuffer = false,
        depthBuffer = true,
        generateMipmaps = false,
        resolution = 896,
        near = 0.1,
        far = 1000,
        flip = false,
        position,
        rotation,
        scale,
        quaternion,
        matrix,
        matrixAutoUpdate,
        ...props
      },
      forwardRef
    ) => {
      const { size, viewport } = useThree()

      const camera = React.useRef<THREE.CubeCamera>(null!)
      const fbo = React.useMemo(() => {
        const fbo = new THREE.WebGLCubeRenderTarget(
          Math.max((resolution || size.width) * viewport.dpr, (resolution || size.height) * viewport.dpr),
          {
            stencilBuffer,
            depthBuffer,
            generateMipmaps,
          }
        )
        fbo.texture.isRenderTargetTexture = !flip
        fbo.texture.flipY = true
        fbo.texture.type = THREE.HalfFloatType
        return fbo
      }, [resolution, flip])

      React.useEffect(() => {
        return () => fbo.dispose()
      }, [fbo])

      const [vScene] = React.useState(() => new THREE.Scene())

      React.useImperativeHandle(forwardRef, () => ({ scene: vScene, fbo, camera: camera.current }), [fbo])

      return (
        <>
          {createPortal(
            <Container renderPriority={renderPriority} frames={frames} camera={camera}>
              {children}
              {/* Without an element that receives pointer events state.pointer will always be 0/0 */}
              <group onPointerOver={() => null} />
            </Container>,
            vScene,
            { events: { compute, priority: eventPriority } }
          )}
          <primitive object={fbo.texture} {...props} />
          <cubeCamera
            ref={camera}
            args={[near, far, fbo]}
            position={position}
            rotation={rotation}
            scale={scale}
            quaternion={quaternion}
            matrix={matrix}
            matrixAutoUpdate={matrixAutoUpdate}
          />
        </>
      )
    }
  )

// The container component has to be separate, it can not be inlined because "useFrame(state" when run inside createPortal will return
// the portals own state which includes user-land overrides (custom cameras etc), but if it is executed in <RenderTexture>'s render function
// it would return the default state.
function Container({
  frames,
  renderPriority,
  children,
  camera,
}: {
  frames: number
  renderPriority: number
  children: React.ReactNode
  camera: React.RefObject<THREE.CubeCamera>
}) {
  let count = 0
  useFrame((state) => {
    if (frames === Infinity || count < frames) {
      camera.current.update(state.gl, state.scene)
      count++
    }
  }, renderPriority)
  return <>{children}</>
}
