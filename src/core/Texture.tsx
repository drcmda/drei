/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import { Texture as _Texture, TextureLoader } from 'three'
import { useLoader, useThree } from '@react-three/fiber'
import { useEffect, useLayoutEffect, useMemo } from 'react'

export const IsObject = (url: unknown): url is Record<string, string> =>
  url === Object(url) && !Array.isArray(url) && typeof url !== 'function'

type TextureArray<T> = T extends string[] ? _Texture[] : never
type TextureRecord<T> = T extends Record<string, string> ? { [key in keyof T]: _Texture } : never
type SingleTexture<T> = T extends string ? _Texture : never

export type MappedTextureType<T extends string[] | string | Record<string, string>> =
  | TextureArray<T>
  | TextureRecord<T>
  | SingleTexture<T>

export function useTexture<Url extends string[] | string | Record<string, string>>(
  input: Url,
  onLoad?: (texture: MappedTextureType<Url>) => void
): MappedTextureType<Url> {
  const gl = useThree((state) => state.gl)
  const textures = useLoader(TextureLoader, IsObject(input) ? Object.values(input) : input)

  // https://github.com/mrdoob/three.js/issues/22696
  // Upload the texture to the GPU immediately instead of waiting for the first render
  // NOTE: only available for WebGLRenderer
  useEffect(() => {
    if ('initTexture' in gl) {
      if (Array.isArray(textures)) {
        for (const texture of textures) {
          gl.initTexture(texture)
        }
      } else {
        gl.initTexture(textures)
      }
    }
  }, [gl, textures])

  const mappedTextures = useMemo(() => {
    if (IsObject(input)) {
      const keyed = {} as MappedTextureType<Url>
      let i = 0
      for (const key in input) keyed[key] = textures[i++]
      return keyed
    } else {
      return textures as MappedTextureType<Url>
    }
  }, [input, textures])

  useLayoutEffect(() => {
    onLoad?.(mappedTextures)
  }, [mappedTextures, onLoad])

  return mappedTextures
}

useTexture.preload = (url: string | string[]) => useLoader.preload(TextureLoader, url)
useTexture.clear = (input: string | string[]) => useLoader.clear(TextureLoader, input)

//

export const Texture = ({
  children,
  input,
  onLoad,
}: {
  children?: (texture: ReturnType<typeof useTexture>) => React.ReactNode
  input: Parameters<typeof useTexture>[0]
  onLoad?: Parameters<typeof useTexture>[1]
}) => {
  const ret = useTexture(input, onLoad)

  return <>{children?.(ret)}</>
}
