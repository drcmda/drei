import * as React from 'react'
import * as THREE from 'three'
import { Color, extend, ThreeElements, useThree } from '@react-three/fiber'
import { shaderMaterial } from './shaderMaterial'
import { useTexture } from './Texture'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { version } from '../helpers/constants'

export type ImageProps = Omit<ThreeElements['mesh'], 'scale'> & {
  segments?: number
  scale?: number | [number, number]
  color?: Color
  zoom?: number
  radius?: number
  grayscale?: number
  toneMapped?: boolean
  transparent?: boolean
  opacity?: number
  side?: THREE.Side
} & ({ texture: THREE.Texture; url?: never } | { texture?: never; url: string }) // {texture: THREE.Texture} XOR {url: string}

type ImageMaterialType = ThreeElements['shaderMaterial'] & {
  scale?: number[]
  imageBounds?: number[]
  radius?: number
  resolution?: number
  color?: Color
  map: THREE.Texture
  zoom?: number
  grayscale?: number
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    imageMaterial: ImageMaterialType
  }
}

const ImageMaterialImpl = /* @__PURE__ */ shaderMaterial(
  {
    color: /* @__PURE__ */ new THREE.Color('white'),
    scale: /* @__PURE__ */ new THREE.Vector2(1, 1),
    imageBounds: /* @__PURE__ */ new THREE.Vector2(1, 1),
    resolution: 1024,
    map: null,
    zoom: 1,
    radius: 0,
    grayscale: 0,
    opacity: 1,
  },
  /* glsl */ `
  varying vec2 vUv;
  varying vec2 vPos;
  void main() {
    gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.);
    vUv = uv;
    vPos = position.xy;
  }
`,
  /* glsl */ `
  // mostly from https://gist.github.com/statico/df64c5d167362ecf7b34fca0b1459a44
  varying vec2 vUv;
  varying vec2 vPos;
  uniform vec2 scale;
  uniform vec2 imageBounds;
  uniform float resolution;
  uniform vec3 color;
  uniform sampler2D map;
  uniform float radius;
  uniform float zoom;
  uniform float grayscale;
  uniform float opacity;
  const vec3 luma = vec3(.299, 0.587, 0.114);
  vec4 toGrayscale(vec4 color, float intensity) {
    return vec4(mix(color.rgb, vec3(dot(color.rgb, luma)), intensity), color.a);
  }
  vec2 aspect(vec2 size) {
    return size / min(size.x, size.y);
  }
  
  const float PI = 3.14159265;
    
  // from https://iquilezles.org/articles/distfunctions
  float udRoundBox( vec2 p, vec2 b, float r ) {
    return length(max(abs(p)-b+r,0.0))-r;
  }

  void main() {
    vec2 s = aspect(scale);
    vec2 i = aspect(imageBounds);
    float rs = s.x / s.y;
    float ri = i.x / i.y;
    vec2 new = rs < ri ? vec2(i.x * s.y / i.y, s.y) : vec2(s.x, i.y * s.x / i.x);
    vec2 offset = (rs < ri ? vec2((new.x - s.x) / 2.0, 0.0) : vec2(0.0, (new.y - s.y) / 2.0)) / new;
    vec2 uv = vUv * s / new + offset;
    vec2 zUv = (uv - vec2(0.5, 0.5)) / zoom + vec2(0.5, 0.5);

    vec2 res = vec2(scale * resolution);
    vec2 halfRes = 0.5 * res;
    float b = udRoundBox(vUv.xy * res - halfRes, halfRes, resolution * radius);    
	  vec3 a = mix(vec3(1.0,0.0,0.0), vec3(0.0,0.0,0.0), smoothstep(0.0, 1.0, b));
    gl_FragColor = toGrayscale(texture2D(map, zUv) * vec4(color, opacity * a), grayscale);
    
    #include <tonemapping_fragment>
    #include <${version >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
  }
`
)

const ImageBase: ForwardRefComponent<Omit<ImageProps, 'url'>, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  (
    {
      children,
      color,
      segments = 1,
      scale = 1,
      zoom = 1,
      grayscale = 0,
      opacity = 1,
      radius = 0,
      texture,
      toneMapped,
      transparent,
      side,
      ...props
    },
    fref
  ) => {
    extend({ ImageMaterial: ImageMaterialImpl })
    const ref = React.useRef<THREE.Mesh>(null!)
    const size = useThree((state) => state.size)
    const planeBounds = Array.isArray(scale) ? [scale[0], scale[1]] : [scale, scale]
    const imageBounds = [texture!.image.width, texture!.image.height]
    const resolution = Math.max(size.width, size.height)
    React.useImperativeHandle(fref, () => ref.current, [])
    React.useLayoutEffect(() => {
      // Support arbitrary plane geometries (for instance with rounded corners)
      // @ts-ignore
      if (ref.current.geometry.parameters) {
        // @ts-ignore
        ref.current.material.scale.set(
          // @ts-ignore
          planeBounds[0] * ref.current.geometry.parameters.width,
          // @ts-ignore
          planeBounds[1] * ref.current.geometry.parameters.height
        )
      }
      /* eslint react-hooks/exhaustive-deps: 1 */
    }, [planeBounds[0], planeBounds[1]])
    return (
      <mesh ref={ref} scale={Array.isArray(scale) ? [...scale, 1] : scale} {...props}>
        <planeGeometry args={[1, 1, segments, segments]} />
        <imageMaterial
          color={color}
          map={texture!}
          zoom={zoom}
          grayscale={grayscale}
          opacity={opacity}
          scale={planeBounds}
          imageBounds={imageBounds}
          resolution={resolution}
          radius={radius}
          toneMapped={toneMapped}
          transparent={transparent}
          side={side}
          key={ImageMaterialImpl.key}
        />
        {children}
      </mesh>
    )
  }
)

const ImageWithUrl: ForwardRefComponent<ImageProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  ({ url, ...props }: ImageProps, ref: React.ForwardedRef<THREE.Mesh>) => {
    const texture = useTexture(url!)
    return <ImageBase {...props} texture={texture} ref={ref} />
  }
)

const ImageWithTexture: ForwardRefComponent<ImageProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  ({ url: _url, ...props }: ImageProps, ref: React.ForwardedRef<THREE.Mesh>) => {
    return <ImageBase {...props} ref={ref} />
  }
)

export const Image: ForwardRefComponent<ImageProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef<
  THREE.Mesh,
  ImageProps
>((props, ref) => {
  if (props.url) return <ImageWithUrl {...props} ref={ref} />
  else if (props.texture) return <ImageWithTexture {...props} ref={ref} />
  else throw new Error('<Image /> requires a url or texture')
})
