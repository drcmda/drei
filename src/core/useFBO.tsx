import { useEffect, useMemo } from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

type FBOSettings<T extends boolean = false> = { multisample?: T; samples?: number } & THREE.WebGLRenderTargetOptions

// 👇 uncomment when TS version supports function overloads

// export function useFBO(settings?: FBOSettings)
export function useFBO<T extends boolean = false>(
  width?: number | FBOSettings<T>,
  height?: number,
  settings?: FBOSettings<T>
): THREE.WebGLRenderTarget {
  const gl = useThree(({ gl }) => gl)
  const size = useThree(({ size }) => size)

  const dpr = useMemo(() => gl.getPixelRatio(), [gl])
  const _width = typeof width === 'number' ? width : size.width * dpr
  const _height = typeof height === 'number' ? height : size.height * dpr
  const _settings = (typeof width === 'number' ? settings : (width as FBOSettings)) || {}

  const target = useMemo(() => {
    const { multisample, samples, ...targetSettings } = _settings
    const target = new THREE.WebGLRenderTarget(_width, _height, targetSettings)
    if (multisample && gl.capabilities.isWebGL2 && samples) target.samples = samples
    return target
  }, [])

  useEffect(() => {
    target.setSize(_width, _height)
  }, [target, _width, _height])

  useEffect(() => {
    return () => target.dispose()
  }, [])

  return target
}
