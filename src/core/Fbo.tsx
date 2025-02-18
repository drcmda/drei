import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

type FBOSettings = {
  /** Defines the count of MSAA samples. Can only be used with WebGL 2. Default: 0 */
  samples?: number
  /** If set, the scene depth will be rendered into buffer.depthTexture. Default: false */
  depth?: boolean

  // WebGLRenderTargetOptions => RenderTargetOptions
  wrapS?: THREE.Wrapping | undefined
  wrapT?: THREE.Wrapping | undefined
  magFilter?: THREE.MagnificationTextureFilter | undefined
  minFilter?: THREE.MinificationTextureFilter | undefined
  format?: number | undefined // RGBAFormat;
  type?: THREE.TextureDataType | undefined // UnsignedByteType;
  anisotropy?: number | undefined // 1;
  depthBuffer?: boolean | undefined // true;
  stencilBuffer?: boolean | undefined // false;
  generateMipmaps?: boolean | undefined // true;
  depthTexture?: THREE.DepthTexture | undefined
  colorSpace?: THREE.ColorSpace | undefined
}

// 👇 uncomment when TS version supports function overloads
// export function useFBO(settings?: FBOSettings)
export function useFBO(
  /** Width in pixels, or settings (will render fullscreen by default) */
  width?: number | FBOSettings,
  /** Height in pixels */
  height?: number,
  /**Settings */
  settings?: FBOSettings
): THREE.WebGLRenderTarget {
  const size = useThree((state) => state.size)
  const viewport = useThree((state) => state.viewport)
  const _width = typeof width === 'number' ? width : size.width * viewport.dpr
  const _height = typeof height === 'number' ? height : size.height * viewport.dpr
  const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {}
  const { samples = 0, depth, ...targetSettings } = _settings

  const target = React.useMemo(() => {
    const target = new THREE.WebGLRenderTarget(_width, _height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      type: THREE.HalfFloatType,
      ...targetSettings,
    })

    if (depth) {
      target.depthTexture = new THREE.DepthTexture(_width, _height, THREE.FloatType)
    }

    target.samples = samples
    return target
  }, [])

  React.useLayoutEffect(() => {
    target.setSize(_width, _height)
    if (samples) target.samples = samples
  }, [samples, target, _width, _height])

  React.useEffect(() => {
    return () => target.dispose()
  }, [])

  return target
}

export const Fbo = ({
  children,
  width,
  height,
  ...settings
}: {
  children?: (target: ReturnType<typeof useFBO>) => React.ReactNode
  width: Parameters<typeof useFBO>[0]
  height: Parameters<typeof useFBO>[1]
} & FBOSettings) => {
  const target = useFBO(width, height, settings)

  return <>{children?.(target)}</>
}
