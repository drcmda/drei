// SpotLight Inspired by http://john-chapman-graphics.blogspot.com/2013/01/good-enough-volumetrics-for-spotlights.html

import * as React from 'react'
import {
  Mesh,
  DepthTexture,
  Vector3,
  CylinderGeometry,
  Matrix4,
  SpotLight as SpotLightImpl,
  DoubleSide,
  Texture,
  WebGLRenderTarget,
  ShaderMaterial,
  RGBAFormat,
  RepeatWrapping,
  Object3D,
} from 'three'
import { ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { FullScreenQuad } from 'three-stdlib'
import { SpotLightMaterial } from '../materials/SpotLightMaterial'

// @ts-ignore
import SpotlightShadowShader from '../helpers/glsl/DefaultSpotlightShadowShadows.glsl'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type SpotLightProps = Omit<ThreeElements['spotLight'], 'ref'> & {
  depthBuffer?: DepthTexture
  attenuation?: number
  anglePower?: number
  radiusTop?: number
  radiusBottom?: number
  opacity?: number
  color?: string | number
  volumetric?: boolean
  debug?: boolean
}

const isSpotLight = (child: Object3D | null): child is SpotLightImpl => {
  return (child as SpotLightImpl)?.isSpotLight
}

function VolumetricMesh({
  opacity = 1,
  radiusTop,
  radiusBottom,
  depthBuffer,
  color = 'white',
  distance = 5,
  angle = 0.15,
  attenuation = 5,
  anglePower = 5,
}: Omit<SpotLightProps, 'volumetric'>) {
  const mesh = React.useRef<Mesh>(null!)
  const size = useThree((state) => state.size)
  const camera = useThree((state) => state.camera)
  const dpr = useThree((state) => state.viewport.dpr)
  const [material] = React.useState(() => new SpotLightMaterial())
  const [vec] = React.useState(() => new Vector3())

  radiusTop = radiusTop === undefined ? 0.1 : radiusTop
  radiusBottom = radiusBottom === undefined ? angle * 7 : radiusBottom

  useFrame(() => {
    material.uniforms.spotPosition.value.copy(mesh.current.getWorldPosition(vec))
    mesh.current.lookAt((mesh.current.parent as any).target.getWorldPosition(vec))
  })

  const geom = React.useMemo(() => {
    const geometry = new CylinderGeometry(radiusTop, radiusBottom, distance, 128, 64, true)
    geometry.applyMatrix4(new Matrix4().makeTranslation(0, -distance / 2, 0))
    geometry.applyMatrix4(new Matrix4().makeRotationX(-Math.PI / 2))
    return geometry
  }, [distance, radiusTop, radiusBottom])

  return (
    <>
      <mesh ref={mesh} geometry={geom} raycast={() => null}>
        <primitive
          object={material}
          attach="material"
          uniforms-opacity-value={opacity}
          uniforms-lightColor-value={color}
          uniforms-attenuation-value={attenuation}
          uniforms-anglePower-value={anglePower}
          uniforms-depth-value={depthBuffer}
          uniforms-cameraNear-value={camera.near}
          uniforms-cameraFar-value={camera.far}
          uniforms-resolution-value={depthBuffer ? [size.width * dpr, size.height * dpr] : [0, 0]}
        />
      </mesh>
    </>
  )
}

function useCommon(
  spotlight: React.RefObject<SpotLightImpl>,
  mesh: React.RefObject<Mesh>,
  width: number,
  height: number,
  distance: number
) {
  const [[pos, dir]] = React.useState(() => [new Vector3(), new Vector3()])

  React.useLayoutEffect(() => {
    if (isSpotLight(spotlight.current)) {
      spotlight.current.shadow.mapSize.set(width, height)
      spotlight.current.shadow.needsUpdate = true
    } else {
      throw new Error('SpotlightShadow must be a child of a SpotLight')
    }
  }, [spotlight, width, height])

  useFrame(() => {
    if (!spotlight.current) return

    const A = spotlight.current.position
    const B = spotlight.current.target.position

    dir.copy(B).sub(A)
    var len = dir.length()
    dir.normalize().multiplyScalar(len * distance)
    pos.copy(A).add(dir)

    mesh.current.position.copy(pos)
    mesh.current.lookAt(spotlight.current.target.position)
  })
}

interface ShadowMeshProps {
  distance?: number
  alphaTest?: number
  scale?: number
  map?: Texture
  shader?: string
  width?: number
  height?: number
}

function SpotlightShadowWithShader({
  distance = 0.4,
  alphaTest = 0.5,
  map,
  shader = SpotlightShadowShader,
  width = 512,
  height = 512,
  scale = 1,
  children,
  ...rest
}: React.PropsWithChildren<ShadowMeshProps>) {
  const mesh = React.useRef<Mesh>(null!)
  const spotlight = (rest as any).spotlightRef
  const debug = (rest as any).debug

  useCommon(spotlight, mesh, width, height, distance)

  const renderTarget = React.useMemo(
    () =>
      new WebGLRenderTarget(width, height, {
        format: RGBAFormat,
        stencilBuffer: false,
        // depthTexture: null!
      }),
    [width, height]
  )

  const uniforms = React.useRef({
    uShadowMap: {
      value: map,
    },
    uTime: {
      value: 0,
    },
  })

  React.useEffect(() => void (uniforms.current.uShadowMap.value = map), [map])

  const fsQuad = React.useMemo(
    () =>
      new FullScreenQuad(
        new ShaderMaterial({
          uniforms: uniforms.current,
          vertexShader: /* glsl */ `
          varying vec2 vUv;

          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
          `,
          fragmentShader: shader,
        })
      ),
    [shader]
  )

  React.useEffect(
    () => () => {
      fsQuad.material.dispose()
      fsQuad.dispose()
    },
    [fsQuad]
  )

  React.useEffect(() => () => renderTarget.dispose(), [renderTarget])

  useFrame(({ gl }, dt) => {
    uniforms.current.uTime.value += dt

    gl.setRenderTarget(renderTarget)
    fsQuad.render(gl)
    gl.setRenderTarget(null)
  })

  return (
    <>
      <mesh ref={mesh} scale={scale} castShadow>
        <planeGeometry />
        <meshBasicMaterial
          transparent
          side={DoubleSide}
          alphaTest={alphaTest}
          alphaMap={renderTarget.texture}
          alphaMap-wrapS={RepeatWrapping}
          alphaMap-wrapT={RepeatWrapping}
          opacity={debug ? 1 : 0}
        >
          {children}
        </meshBasicMaterial>
      </mesh>
    </>
  )
}

function SpotlightShadowWithoutShader({
  distance = 0.4,
  alphaTest = 0.5,
  map,
  width = 512,
  height = 512,
  scale,
  children,
  ...rest
}: React.PropsWithChildren<ShadowMeshProps>) {
  const mesh = React.useRef<Mesh>(null!)
  const spotlight = (rest as any).spotlightRef
  const debug = (rest as any).debug

  useCommon(spotlight, mesh, width, height, distance)

  return (
    <>
      <mesh ref={mesh} scale={scale} castShadow>
        <planeGeometry />
        <meshBasicMaterial
          transparent
          side={DoubleSide}
          alphaTest={alphaTest}
          alphaMap={map}
          alphaMap-wrapS={RepeatWrapping}
          alphaMap-wrapT={RepeatWrapping}
          opacity={debug ? 1 : 0}
        >
          {children}
        </meshBasicMaterial>
      </mesh>
    </>
  )
}

export function SpotLightShadow(props: React.PropsWithChildren<ShadowMeshProps>) {
  if (props.shader) return <SpotlightShadowWithShader {...props} />
  return <SpotlightShadowWithoutShader {...props} />
}

const SpotLight: ForwardRefComponent<React.PropsWithChildren<SpotLightProps>, SpotLightImpl> = React.forwardRef(
  (
    {
      // Volumetric
      opacity = 1,
      radiusTop,
      radiusBottom,
      depthBuffer,
      color = 'white',
      distance = 5,
      angle = 0.15,
      attenuation = 5,
      anglePower = 5,
      volumetric = true,
      debug = false,
      children,
      ...props
    }: React.PropsWithChildren<SpotLightProps>,
    ref: React.ForwardedRef<SpotLightImpl>
  ) => {
    const spotlight = React.useRef<any>(null!)
    React.useImperativeHandle(ref, () => spotlight.current, [])

    return (
      <group>
        {debug && spotlight.current && <spotLightHelper args={[spotlight.current]} />}

        <spotLight ref={spotlight} angle={angle} color={color} distance={distance} castShadow {...props}>
          {volumetric && (
            <VolumetricMesh
              debug={debug}
              opacity={opacity}
              radiusTop={radiusTop}
              radiusBottom={radiusBottom}
              depthBuffer={depthBuffer}
              color={color}
              distance={distance}
              angle={angle}
              attenuation={attenuation}
              anglePower={anglePower}
            />
          )}
        </spotLight>
        {children &&
          React.cloneElement(children as any, {
            spotlightRef: spotlight,
            debug: debug,
          })}
      </group>
    )
  }
)

export { SpotLight }
