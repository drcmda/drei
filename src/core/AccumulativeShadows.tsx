import * as THREE from 'three'
import * as React from 'react'
import { extend, ReactThreeFiber, ThreeElements, useFrame, useThree } from '@react-three/fiber'
import { shaderMaterial } from './shaderMaterial'
import { DiscardMaterial } from '../materials/DiscardMaterial'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { version } from '../helpers/constants'

function isLight(object: any): object is THREE.Light {
  return object.isLight
}

function isGeometry(object: any): object is THREE.Mesh {
  return !!object.geometry
}

export type AccumulativeShadowsProps = Omit<ThreeElements['group'], 'ref'> & {
  /** How many frames it can render, more yields cleaner results but takes more time, 40 */
  frames?: number
  /** If frames === Infinity blend controls the refresh ratio, 100 */
  blend?: number
  /** Can limit the amount of frames rendered if frames === Infinity, usually to get some performance back once a movable scene has settled, Infinity */
  limit?: number
  /** Scale of the plane,  */
  scale?: number
  /** Temporal accumulates shadows over time which is more performant but has a visual regression over instant results, false  */
  temporal?: boolean
  /** Opacity of the plane, 1 */
  opacity?: number
  /** Discards alpha pixels, 0.65 */
  alphaTest?: number
  /** Shadow color, black */
  color?: string
  /** Colorblend, how much colors turn to black, 0 is black, 2 */
  colorBlend?: number
  /** Buffer resolution, 1024 */
  resolution?: number
  /** Texture tonemapping */
  toneMapped?: boolean
}

interface AccumulativeContext {
  lights: Map<any, any>
  temporal: boolean
  frames: number
  blend: number
  count: number
  /** Returns the plane geometry onto which the shadow is cast */
  getMesh: () => THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialProps & THREE.ShaderMaterial>
  /** Resets the buffers, starting from scratch */
  reset: () => void
  /** Updates the lightmap for a number of frames accumulartively */
  update: (frames?: number) => void
}

interface AccumulativeLightContext {
  /** Jiggles the lights */
  update: () => void
}

type SoftShadowMaterialProps = {
  map: THREE.Texture
  color?: ReactThreeFiber.Color
  alphaTest?: number
  blend?: number
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    softShadowMaterial: ThreeElements['shaderMaterial'] & SoftShadowMaterialProps
  }
}

export const accumulativeContext = /* @__PURE__ */ React.createContext<AccumulativeContext>(
  null as unknown as AccumulativeContext
)

const SoftShadowMaterial = /* @__PURE__ */ shaderMaterial(
  {
    color: /* @__PURE__ */ new THREE.Color(),
    blend: 2.0,
    alphaTest: 0.75,
    opacity: 0,
    map: null,
  },
  `varying vec2 vUv;
   void main() {
     gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
     vUv = uv;
   }`,
  `varying vec2 vUv;
   uniform sampler2D map;
   uniform vec3 color;
   uniform float opacity;
   uniform float alphaTest;
   uniform float blend;
   void main() {
     vec4 sampledDiffuseColor = texture2D(map, vUv);
     gl_FragColor = vec4(color * sampledDiffuseColor.r * blend, max(0.0, (1.0 - (sampledDiffuseColor.r + sampledDiffuseColor.g + sampledDiffuseColor.b) / alphaTest)) * opacity);
     #include <tonemapping_fragment>
     #include <${version >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
   }`
)

export const AccumulativeShadows: ForwardRefComponent<AccumulativeShadowsProps, AccumulativeContext> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        children,
        temporal,
        frames = 40,
        limit = Infinity,
        blend = 20,
        scale = 10,
        opacity = 1,
        alphaTest = 0.75,
        color = 'black',
        colorBlend = 2,
        resolution = 1024,
        toneMapped = true,
        ...props
      },
      forwardRef
    ) => {
      extend({ SoftShadowMaterial })

      const gl = useThree((state) => state.gl)
      const scene = useThree((state) => state.scene)
      const camera = useThree((state) => state.camera)
      const invalidate = useThree((state) => state.invalidate)
      const gPlane = React.useRef<THREE.Mesh<THREE.PlaneGeometry, SoftShadowMaterialProps & THREE.ShaderMaterial>>(
        null!
      )
      const gLights = React.useRef<THREE.Group>(null!)

      const [plm] = React.useState(() => new ProgressiveLightMap(gl, scene, resolution))
      React.useLayoutEffect(() => {
        plm.configure(gPlane.current)
      }, [])

      const api = React.useMemo<AccumulativeContext>(
        () => ({
          lights: new Map(),
          temporal: !!temporal,
          frames: Math.max(2, frames),
          blend: Math.max(2, frames === Infinity ? blend : frames),
          count: 0,
          getMesh: () => gPlane.current,
          reset: () => {
            // Clear buffers, reset opacities, set frame count to 0
            plm.clear()
            const material = gPlane.current.material
            material.opacity = 0
            material.alphaTest = 0
            api.count = 0
          },
          update: (frames = 1) => {
            // Adapt the opacity-blend ratio to the number of frames
            const material = gPlane.current.material
            if (!api.temporal) {
              material.opacity = opacity
              material.alphaTest = alphaTest
            } else {
              material.opacity = Math.min(opacity, material.opacity + opacity / api.blend)
              material.alphaTest = Math.min(alphaTest, material.alphaTest + alphaTest / api.blend)
            }

            // Switch accumulative lights on
            gLights.current.visible = true
            // Collect scene lights and meshes
            plm.prepare()

            // Update the lightmap and the accumulative lights
            for (let i = 0; i < frames; i++) {
              api.lights.forEach((light) => light.update())
              plm.update(camera, api.blend)
            }
            // Switch lights off
            gLights.current.visible = false
            // Restore lights and meshes
            plm.finish()
          },
        }),
        [plm, camera, scene, temporal, frames, blend, opacity, alphaTest]
      )

      React.useLayoutEffect(() => {
        // Reset internals, buffers, ...
        api.reset()
        // Update lightmap
        if (!api.temporal && api.frames !== Infinity) api.update(api.blend)
      })

      // Expose api, allow children to set itself as the main light source
      React.useImperativeHandle(forwardRef, () => api, [api])

      useFrame(() => {
        if ((api.temporal || api.frames === Infinity) && api.count < api.frames && api.count < limit) {
          invalidate()
          api.update()
          api.count++
        }
      })

      return (
        <group {...props}>
          <group traverse={() => null} ref={gLights}>
            <accumulativeContext.Provider value={api}>{children}</accumulativeContext.Provider>
          </group>
          <mesh receiveShadow ref={gPlane} scale={scale} rotation={[-Math.PI / 2, 0, 0]}>
            <planeGeometry />
            <softShadowMaterial
              transparent
              depthWrite={false}
              toneMapped={toneMapped}
              color={color}
              blend={colorBlend}
              map={plm.progressiveLightMap2.texture}
            />
          </mesh>
        </group>
      )
    }
  )

export type RandomizedLightProps = Omit<ThreeElements['group'], 'ref'> & {
  /** How many frames it will jiggle the lights, 1.
   *  Frames is context aware, if a provider like AccumulativeShadows exists, frames will be taken from there!  */
  frames?: number
  /** Light position, [0, 0, 0] */
  position?: [x: number, y: number, z: number]
  /** Radius of the jiggle, higher values make softer light, 5 */
  radius?: number
  /** Amount of lights, 8 */
  amount?: number
  /** Light intensity, 1 */
  intensity?: number
  /** Ambient occlusion, lower values mean less AO, hight more, you can mix AO and directional light, 0.5 */
  ambient?: number
  /** If the lights cast shadows, this is true by default */
  castShadow?: boolean
  /** Default shadow bias, 0 */
  bias?: number
  /** Default map size, 512 */
  mapSize?: number
  /** Default size of the shadow camera, 10 */
  size?: number
  /** Default shadow camera near, 0.5 */
  near?: number
  /** Default shadow camera far, 500 */
  far?: number
}

export const RandomizedLight: ForwardRefComponent<RandomizedLightProps, AccumulativeLightContext> =
  /* @__PURE__ */ React.forwardRef(
    (
      {
        castShadow = true,
        bias = 0.001,
        mapSize = 512,
        size = 5,
        near = 0.5,
        far = 500,
        frames = 1,
        position = [0, 0, 0],
        radius = 1,
        amount = 8,
        intensity = version >= 155 ? Math.PI : 1,
        ambient = 0.5,
        ...props
      },
      forwardRef
    ) => {
      const gLights = React.useRef<THREE.Group>(null!)
      const length = new THREE.Vector3(...position).length()
      const parent = React.useContext(accumulativeContext)

      const update = React.useCallback(() => {
        let light: THREE.Object3D | undefined
        if (gLights.current) {
          for (let l = 0; l < gLights.current.children.length; l++) {
            light = gLights.current.children[l]
            if (Math.random() > ambient) {
              light.position.set(
                position[0] + THREE.MathUtils.randFloatSpread(radius),
                position[1] + THREE.MathUtils.randFloatSpread(radius),
                position[2] + THREE.MathUtils.randFloatSpread(radius)
              )
            } else {
              let lambda = Math.acos(2 * Math.random() - 1) - Math.PI / 2.0
              let phi = 2 * Math.PI * Math.random()
              light.position.set(
                Math.cos(lambda) * Math.cos(phi) * length,
                Math.abs(Math.cos(lambda) * Math.sin(phi) * length),
                Math.sin(lambda) * length
              )
            }
          }
        }
      }, [radius, ambient, length, ...position])

      const api: AccumulativeLightContext = React.useMemo(() => ({ update }), [update])
      React.useImperativeHandle(forwardRef, () => api, [api])
      React.useLayoutEffect(() => {
        const group = gLights.current
        if (parent) parent.lights?.set(group.uuid, api)
        return () => void parent?.lights?.delete(group.uuid)
      }, [parent, api])

      return (
        <group ref={gLights} {...props}>
          {Array.from({ length: amount }, (_, index) => (
            <directionalLight
              key={index}
              castShadow={castShadow}
              shadow-bias={bias}
              shadow-mapSize={[mapSize, mapSize]}
              intensity={intensity / amount}
            >
              <orthographicCamera attach="shadow-camera" args={[-size, size, size, -size, near, far]} />
            </directionalLight>
          ))}
        </group>
      )
    }
  )

// Based on "Progressive Light Map Accumulator", by [zalo](https://github.com/zalo/)
class ProgressiveLightMap {
  renderer: THREE.WebGLRenderer
  res: number
  scene: THREE.Scene
  object: THREE.Mesh | null
  buffer1Active: boolean
  progressiveLightMap1: THREE.WebGLRenderTarget
  progressiveLightMap2: THREE.WebGLRenderTarget
  discardMat: THREE.ShaderMaterial
  targetMat: THREE.MeshLambertMaterial
  previousShadowMap: { value: THREE.Texture }
  averagingWindow: { value: number }
  clearColor: THREE.Color
  clearAlpha: number
  lights: { object: THREE.Light; intensity: number }[]
  meshes: { object: THREE.Mesh; material: THREE.Material | THREE.Material[] }[]

  constructor(renderer: THREE.WebGLRenderer, scene: THREE.Scene, res: number = 1024) {
    this.renderer = renderer
    this.res = res
    this.scene = scene
    this.buffer1Active = false
    this.lights = []
    this.meshes = []
    this.object = null
    this.clearColor = new THREE.Color()
    this.clearAlpha = 0

    // Create the Progressive LightMap Texture
    const textureParams = {
      type: THREE.HalfFloatType,
      magFilter: THREE.NearestFilter,
      minFilter: THREE.NearestFilter,
    }
    this.progressiveLightMap1 = new THREE.WebGLRenderTarget(this.res, this.res, textureParams)
    this.progressiveLightMap2 = new THREE.WebGLRenderTarget(this.res, this.res, textureParams)

    // Inject some spicy new logic into a standard phong material
    this.discardMat = new DiscardMaterial()
    this.targetMat = new THREE.MeshLambertMaterial({ fog: false })
    this.previousShadowMap = { value: this.progressiveLightMap1.texture }
    this.averagingWindow = { value: 100 }
    this.targetMat.onBeforeCompile = (shader) => {
      // Vertex Shader: Set Vertex Positions to the Unwrapped UV Positions
      shader.vertexShader =
        'varying vec2 vUv;\n' +
        shader.vertexShader.slice(0, -1) +
        'vUv = uv; gl_Position = vec4((uv - 0.5) * 2.0, 1.0, 1.0); }'

      // Fragment Shader: Set Pixels to average in the Previous frame's Shadows
      const bodyStart = shader.fragmentShader.indexOf('void main() {')
      shader.fragmentShader =
        'varying vec2 vUv;\n' +
        shader.fragmentShader.slice(0, bodyStart) +
        'uniform sampler2D previousShadowMap;\n	uniform float averagingWindow;\n' +
        shader.fragmentShader.slice(bodyStart - 1, -1) +
        `\nvec3 texelOld = texture2D(previousShadowMap, vUv).rgb;
        gl_FragColor.rgb = mix(texelOld, gl_FragColor.rgb, 1.0/ averagingWindow);
      }`

      // Set the Previous Frame's Texture Buffer and Averaging Window
      shader.uniforms.previousShadowMap = this.previousShadowMap
      shader.uniforms.averagingWindow = this.averagingWindow
    }
  }

  clear() {
    this.renderer.getClearColor(this.clearColor)
    this.clearAlpha = this.renderer.getClearAlpha()
    this.renderer.setClearColor('black', 1)
    this.renderer.setRenderTarget(this.progressiveLightMap1)
    this.renderer.clear()
    this.renderer.setRenderTarget(this.progressiveLightMap2)
    this.renderer.clear()
    this.renderer.setRenderTarget(null)
    this.renderer.setClearColor(this.clearColor, this.clearAlpha)

    this.lights = []
    this.meshes = []
    this.scene.traverse((object) => {
      if (isGeometry(object)) {
        this.meshes.push({ object, material: object.material })
      } else if (isLight(object)) {
        this.lights.push({ object, intensity: object.intensity })
      }
    })
  }

  prepare() {
    this.lights.forEach((light) => (light.object.intensity = 0))
    this.meshes.forEach((mesh) => (mesh.object.material = this.discardMat))
  }

  finish() {
    this.lights.forEach((light) => (light.object.intensity = light.intensity))
    this.meshes.forEach((mesh) => (mesh.object.material = mesh.material))
  }

  configure(object) {
    this.object = object
  }

  update(camera, blendWindow = 100) {
    if (!this.object) return
    // Set each object's material to the UV Unwrapped Surface Mapping Version
    this.averagingWindow.value = blendWindow
    this.object.material = this.targetMat
    // Ping-pong two surface buffers for reading/writing
    const activeMap = this.buffer1Active ? this.progressiveLightMap1 : this.progressiveLightMap2
    const inactiveMap = this.buffer1Active ? this.progressiveLightMap2 : this.progressiveLightMap1
    // Render the object's surface maps
    const oldBg = this.scene.background
    this.scene.background = null
    this.renderer.setRenderTarget(activeMap)
    this.previousShadowMap.value = inactiveMap.texture
    this.buffer1Active = !this.buffer1Active
    this.renderer.render(this.scene, camera)
    this.renderer.setRenderTarget(null)
    this.scene.background = oldBg
  }
}
