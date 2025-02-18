import * as React from 'react'
import {
  REVISION,
  DynamicDrawUsage,
  Color,
  Group,
  Texture,
  Vector3,
  InstancedMesh,
  Material,
  MeshLambertMaterial,
  Matrix4,
  Quaternion,
  BufferAttribute,
} from 'three'
import { extend, applyProps, useFrame, ReactThreeFiber, ThreeElement, ThreeElements } from '@react-three/fiber'
import { useTexture } from './Texture'
import { setUpdateRange } from '../helpers/deprecated'

declare module '@react-three/fiber' {
  interface ThreeElements {
    cloudMaterial: ThreeElement<typeof MeshLambertMaterial>
  }
}

const CLOUD_URL = 'https://rawcdn.githack.com/pmndrs/drei-assets/9225a9f1fbd449d9411125c2f419b843d0308c9f/cloud.png'

type CloudState = {
  uuid: string
  index: number
  segments: number
  dist: number
  matrix: Matrix4
  bounds: Vector3
  position: Vector3
  volume: number
  length: number
  ref: React.RefObject<Group>
  speed: number
  growth: number
  opacity: number
  fade: number
  density: number
  rotation: number
  rotationFactor: number
  color: Color
}

export type CloudsProps = Omit<ThreeElements['group'], 'ref'> & {
  /** Optional cloud texture, points to a default hosted on rawcdn.githack */
  texture?: string
  /** Maximum number of segments, default: 200 (make this tight to save memory!) */
  limit?: number
  /** How many segments it renders, default: undefined (all) */
  range?: number
  /** Which material it will override, default: MeshLambertMaterial */
  material?: typeof Material
  /** Frustum culling, default: true */
  frustumCulled?: boolean
}

export type CloudProps = Omit<ThreeElements['group'], 'ref'> & {
  /** A seeded random will show the same cloud consistently, default: Math.random() */
  seed?: number
  /** How many segments or particles the cloud will have, default: 20 */
  segments?: number
  /** The box3 bounds of the cloud, default: [5, 1, 1] */
  bounds?: ReactThreeFiber.Vector3
  /** How to arrange segment volume inside the bounds, default: inside (cloud are smaller at the edges) */
  concentrate?: 'random' | 'inside' | 'outside'
  /** The general scale of the segments */
  scale?: ReactThreeFiber.Vector3
  /** The volume/thickness of the segments, default: 6 */
  volume?: number
  /** The smallest volume when distributing clouds, default: 0.25 */
  smallestVolume?: number
  /** An optional function that allows you to distribute points and volumes (overriding all settings), default: null
   *  Both point and volume are factors, point x/y/z can be between -1 and 1, volume between 0 and 1 */
  distribute?: (cloud: CloudState, index: number) => { point: Vector3; volume?: number }
  /** Growth factor for animated clouds (speed > 0), default: 4 */
  growth?: number
  /** Animation factor, default: 0 */
  speed?: number
  /** Camera distance until the segments will fade, default: 10 */
  fade?: number
  /** Opacity, default: 1 */
  opacity?: number
  /** Color, default: white */
  color?: ReactThreeFiber.Color
}

const parentMatrix = /* @__PURE__ */ new Matrix4()
const translation = /* @__PURE__ */ new Vector3()
const rotation = /* @__PURE__ */ new Quaternion()
const cpos = /* @__PURE__ */ new Vector3()
const cquat = /* @__PURE__ */ new Quaternion()
const scale = /* @__PURE__ */ new Vector3()

const context = /* @__PURE__ */ React.createContext<React.RefObject<CloudState[]>>(null!)
export const Clouds = /* @__PURE__ */ React.forwardRef<Group, CloudsProps>(
  (
    { children, material = MeshLambertMaterial, texture = CLOUD_URL, range, limit = 200, frustumCulled, ...props },
    fref
  ) => {
    const CloudMaterial = React.useMemo(() => {
      return class extends (material as typeof Material) {
        constructor() {
          super()
          const opaque_fragment = parseInt(REVISION.replace(/\D+/g, '')) >= 154 ? 'opaque_fragment' : 'output_fragment'
          this.onBeforeCompile = (shader) => {
            shader.vertexShader =
              `attribute float cloudOpacity;
               varying float vOpacity;
              ` +
              shader.vertexShader.replace(
                '#include <fog_vertex>',
                `#include <fog_vertex>
                 vOpacity = cloudOpacity;
                `
              )
            shader.fragmentShader =
              `varying float vOpacity;
              ` +
              shader.fragmentShader.replace(
                `#include <${opaque_fragment}>`,
                `#include <${opaque_fragment}>
                 gl_FragColor = vec4(outgoingLight, diffuseColor.a * vOpacity);
                `
              )
          }
        }
      }
    }, [material])

    extend({ CloudMaterial })

    const instance = React.useRef<InstancedMesh>(null!)
    const clouds = React.useRef<CloudState[]>([])
    const opacities = React.useMemo(() => new Float32Array(Array.from({ length: limit }, () => 1)), [limit])
    const colors = React.useMemo(() => new Float32Array(Array.from({ length: limit }, () => [1, 1, 1]).flat()), [limit])
    const cloudTexture = useTexture(texture) as Texture

    let t = 0
    let index = 0
    let config: CloudState
    const qat = new Quaternion()
    const dir = new Vector3(0, 0, 1)
    const pos = new Vector3()

    useFrame((state, delta) => {
      t = state.clock.elapsedTime
      parentMatrix.copy(instance.current.matrixWorld).invert()
      state.camera.matrixWorld.decompose(cpos, cquat, scale)

      for (index = 0; index < clouds.current.length; index++) {
        config = clouds.current[index]
        config.ref.current.matrixWorld.decompose(translation, rotation, scale)
        translation.add(pos.copy(config.position).applyQuaternion(rotation).multiply(scale))
        rotation.copy(cquat).multiply(qat.setFromAxisAngle(dir, (config.rotation += delta * config.rotationFactor)))
        scale.multiplyScalar(config.volume + ((1 + Math.sin(t * config.density * config.speed)) / 2) * config.growth)
        config.matrix.compose(translation, rotation, scale).premultiply(parentMatrix)
        config.dist = translation.distanceTo(cpos)
      }

      // Depth-sort. Instances have no specific draw order, w/o sorting z would be random
      clouds.current.sort((a, b) => b.dist - a.dist)
      for (index = 0; index < clouds.current.length; index++) {
        config = clouds.current[index]
        opacities[index] = config.opacity * (config.dist < config.fade - 1 ? config.dist / config.fade : 1)
        instance.current.setMatrixAt(index, config.matrix)
        instance.current.setColorAt(index, config.color)
      }

      // Update instance
      instance.current.geometry.attributes.cloudOpacity.needsUpdate = true
      instance.current.instanceMatrix.needsUpdate = true
      if (instance.current.instanceColor) instance.current.instanceColor.needsUpdate = true
    })

    React.useLayoutEffect(() => {
      const count = Math.min(limit, range !== undefined ? range : limit, clouds.current.length)
      instance.current.count = count
      setUpdateRange(instance.current.instanceMatrix, { start: 0, count: count * 16 })
      if (instance.current.instanceColor) {
        setUpdateRange(instance.current.instanceColor, { start: 0, count: count * 3 })
      }
      setUpdateRange(instance.current.geometry.attributes.cloudOpacity as BufferAttribute, { start: 0, count: count })
    })

    let imageBounds = [cloudTexture!.image.width ?? 1, cloudTexture!.image.height ?? 1]
    const max = Math.max(imageBounds[0], imageBounds[1])
    imageBounds = [imageBounds[0] / max, imageBounds[1] / max]

    return (
      <group ref={fref} {...props}>
        <context.Provider value={clouds}>
          {children}
          <instancedMesh
            matrixAutoUpdate={false}
            ref={instance}
            args={[null as any, null as any, limit]}
            frustumCulled={frustumCulled}
          >
            <instancedBufferAttribute usage={DynamicDrawUsage} attach="instanceColor" args={[colors, 3]} />
            <planeGeometry args={[...imageBounds] as any}>
              <instancedBufferAttribute
                usage={DynamicDrawUsage}
                attach="attributes-cloudOpacity"
                args={[opacities, 1]}
              />
            </planeGeometry>
            <cloudMaterial key={material.name} map={cloudTexture} transparent depthWrite={false} />
          </instancedMesh>
        </context.Provider>
      </group>
    )
  }
)

export const CloudInstance = /* @__PURE__ */ React.forwardRef<Group, CloudProps>(
  (
    {
      opacity = 1,
      speed = 0,
      bounds = [5, 1, 1],
      segments = 20,
      color = '#ffffff',
      fade = 10,
      volume = 6,
      smallestVolume = 0.25,
      distribute = null,
      growth = 4,
      concentrate = 'inside',
      seed = Math.random(),
      ...props
    },
    fref
  ) => {
    function random() {
      const x = Math.sin(seed++) * 10000
      return x - Math.floor(x)
    }

    const parent = React.useContext(context)
    const ref = React.useRef<Group>(null!)
    const uuid = React.useId()
    const clouds: CloudState[] = React.useMemo(() => {
      return [...new Array(segments)].map(
        (_, index) =>
          ({
            segments,
            bounds: new Vector3(1, 1, 1),
            position: new Vector3(),
            uuid,
            index,
            ref,
            dist: 0,
            matrix: new Matrix4(),
            color: new Color(),
            rotation: index * (Math.PI / segments),
          }) as CloudState
      )
    }, [segments, uuid])

    React.useLayoutEffect(() => {
      clouds.forEach((cloud, index) => {
        applyProps(cloud as any, {
          volume,
          color,
          speed,
          growth,
          opacity,
          fade,
          bounds,
          density: Math.max(0.5, random()),
          rotationFactor: Math.max(0.2, 0.5 * random()) * speed,
        })
        // Only distribute randomly if there are multiple segments

        const distributed = distribute?.(cloud, index)

        if (distributed || segments > 1) {
          cloud.position.copy(cloud.bounds).multiply(
            distributed?.point ??
              ({
                x: random() * 2 - 1,
                y: random() * 2 - 1,
                z: random() * 2 - 1,
              } as Vector3)
          )
        }
        const xDiff = Math.abs(cloud.position.x)
        const yDiff = Math.abs(cloud.position.y)
        const zDiff = Math.abs(cloud.position.z)
        const max = Math.max(xDiff, yDiff, zDiff)
        cloud.length = 1
        if (xDiff === max) cloud.length -= xDiff / cloud.bounds.x
        if (yDiff === max) cloud.length -= yDiff / cloud.bounds.y
        if (zDiff === max) cloud.length -= zDiff / cloud.bounds.z
        cloud.volume =
          (distributed?.volume !== undefined
            ? distributed.volume
            : Math.max(
                Math.max(0, smallestVolume),
                concentrate === 'random' ? random() : concentrate === 'inside' ? cloud.length : 1 - cloud.length
              )) * volume
      })
    }, [concentrate, bounds, fade, color, opacity, growth, volume, seed, segments, speed])

    React.useLayoutEffect(() => {
      const temp = clouds
      parent.current = [...parent.current, ...temp]
      return () => {
        parent.current = parent.current.filter((item) => item.uuid !== uuid)
      }
    }, [clouds])

    React.useImperativeHandle(fref, () => ref.current, [])
    return <group ref={ref} {...props} />
  }
)

export const Cloud = /* @__PURE__ */ React.forwardRef<Group, CloudProps>((props, fref) => {
  const parent = React.useContext(context)
  if (parent) return <CloudInstance ref={fref} {...props} />
  return (
    <Clouds>
      <CloudInstance ref={fref} {...props} />
    </Clouds>
  )
})
