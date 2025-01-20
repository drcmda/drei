import * as React from 'react'
import { useThree, createPortal, useFrame, extend, Euler, applyProps, ThreeElement } from '@react-three/fiber'
import { WebGLCubeRenderTarget, Texture, Scene, CubeCamera, HalfFloatType, CubeTexture } from 'three'
import { GroundProjectedEnv as GroundProjectedEnvImpl } from 'three-stdlib'
import { PresetsType } from '../helpers/environment-assets'
import { EnvironmentLoaderProps, useEnvironment } from './useEnvironment'

export type EnvironmentProps = {
  children?: React.ReactNode
  frames?: number
  near?: number
  far?: number
  resolution?: number
  background?: boolean | 'only'

  /** deprecated, use backgroundBlurriness */
  blur?: number
  backgroundBlurriness?: number
  backgroundIntensity?: number
  backgroundRotation?: Euler
  environmentIntensity?: number
  environmentRotation?: Euler

  map?: Texture
  preset?: PresetsType
  scene?: Scene | React.RefObject<Scene>
  ground?:
    | boolean
    | {
        radius?: number
        height?: number
        scale?: number
      }
} & EnvironmentLoaderProps

const isRef = (obj: any): obj is React.RefObject<Scene> => obj.current && obj.current.isScene
const resolveScene = (scene: Scene | React.RefObject<Scene>) => (isRef(scene) ? scene.current : scene)

function setEnvProps(
  background: boolean | 'only',
  scene: Scene | React.RefObject<Scene> | undefined,
  defaultScene: Scene,
  texture: Texture,
  sceneProps: Partial<EnvironmentProps> = {}
) {
  // defaults
  sceneProps = {
    backgroundBlurriness: 0,
    backgroundIntensity: 1,
    backgroundRotation: [0, 0, 0],
    environmentIntensity: 1,
    environmentRotation: [0, 0, 0],
    ...sceneProps,
  }

  const target = resolveScene(scene || defaultScene)
  const oldbg = target.background
  const oldenv = target.environment
  const oldSceneProps = {
    // @ts-ignore
    backgroundBlurriness: target.backgroundBlurriness,
    // @ts-ignore
    backgroundIntensity: target.backgroundIntensity,
    // @ts-ignore
    backgroundRotation: target.backgroundRotation?.clone?.() ?? [0, 0, 0],
    // @ts-ignore
    environmentIntensity: target.environmentIntensity,
    // @ts-ignore
    environmentRotation: target.environmentRotation?.clone?.() ?? [0, 0, 0],
  }
  if (background !== 'only') target.environment = texture
  if (background) target.background = texture
  applyProps(target as any, sceneProps)

  return () => {
    if (background !== 'only') target.environment = oldenv
    if (background) target.background = oldbg
    applyProps(target as any, oldSceneProps)
  }
}

export function EnvironmentMap({ scene, background = false, map, ...config }: EnvironmentProps) {
  const defaultScene = useThree((state) => state.scene)
  React.useLayoutEffect(() => {
    if (map) return setEnvProps(background, scene, defaultScene, map, config)
  })
  return null
}

export function EnvironmentCube({
  background = false,
  scene,
  blur,
  backgroundBlurriness,
  backgroundIntensity,
  backgroundRotation,
  environmentIntensity,
  environmentRotation,
  ...rest
}: EnvironmentProps) {
  const texture = useEnvironment(rest)
  const defaultScene = useThree((state) => state.scene)

  React.useLayoutEffect(() => {
    return setEnvProps(background, scene, defaultScene, texture, {
      backgroundBlurriness: blur ?? backgroundBlurriness,
      backgroundIntensity,
      backgroundRotation,
      environmentIntensity,
      environmentRotation,
    })
  })

  React.useEffect(() => {
    return () => {
      texture.dispose()
    }
  }, [texture])

  return null
}

export function EnvironmentPortal({
  children,
  near = 0.1,
  far = 1000,
  resolution = 256,
  frames = 1,
  map,
  background = false,
  blur,
  backgroundBlurriness,
  backgroundIntensity,
  backgroundRotation,
  environmentIntensity,
  environmentRotation,
  scene,
  files,
  path,
  preset = undefined,
  extensions,
}: EnvironmentProps) {
  const gl = useThree((state) => state.gl)
  const defaultScene = useThree((state) => state.scene)
  const camera = React.useRef<CubeCamera>(null!)
  const [virtualScene] = React.useState(() => new Scene())
  const fbo = React.useMemo(() => {
    const fbo = new WebGLCubeRenderTarget(resolution)
    fbo.texture.type = HalfFloatType
    return fbo
  }, [resolution])

  React.useEffect(() => {
    return () => {
      fbo.dispose()
    }
  }, [fbo])

  React.useLayoutEffect(() => {
    if (frames === 1) {
      const autoClear = gl.autoClear
      gl.autoClear = true
      camera.current.update(gl, virtualScene)
      gl.autoClear = autoClear
    }
    return setEnvProps(background, scene, defaultScene, fbo.texture, {
      backgroundBlurriness: blur ?? backgroundBlurriness,
      backgroundIntensity,
      backgroundRotation,
      environmentIntensity,
      environmentRotation,
    })
  }, [children, virtualScene, fbo.texture, scene, defaultScene, background, frames, gl])

  let count = 1
  useFrame(() => {
    if (frames === Infinity || count < frames) {
      const autoClear = gl.autoClear
      gl.autoClear = true
      camera.current.update(gl, virtualScene)
      gl.autoClear = autoClear
      count++
    }
  })

  return (
    <>
      {createPortal(
        <>
          {children}
          {/* @ts-ignore */}
          <cubeCamera ref={camera} args={[near, far, fbo]} />
          {files || preset ? (
            <EnvironmentCube background files={files} preset={preset} path={path} extensions={extensions} />
          ) : map ? (
            <EnvironmentMap background map={map} extensions={extensions} />
          ) : null}
        </>,
        virtualScene
      )}
    </>
  )
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    groundProjectedEnvImpl: ThreeElement<typeof GroundProjectedEnvImpl>
  }
}

function EnvironmentGround(props: EnvironmentProps) {
  const textureDefault = useEnvironment(props)
  const texture = props.map || textureDefault

  React.useMemo(() => extend({ GroundProjectedEnvImpl }), [])

  React.useEffect(() => {
    return () => {
      textureDefault.dispose()
    }
  }, [textureDefault])

  const args = React.useMemo<[CubeTexture | Texture]>(() => [texture], [texture])
  const height = (props.ground as any)?.height
  const radius = (props.ground as any)?.radius
  const scale = (props.ground as any)?.scale ?? 1000

  return (
    <>
      <EnvironmentMap {...props} map={texture} />
      <groundProjectedEnvImpl args={args} scale={scale} height={height} radius={radius} />
    </>
  )
}

export function Environment(props: EnvironmentProps) {
  return props.ground ? (
    <EnvironmentGround {...props} />
  ) : props.map ? (
    <EnvironmentMap {...props} />
  ) : props.children ? (
    <EnvironmentPortal {...props} />
  ) : (
    <EnvironmentCube {...props} />
  )
}
