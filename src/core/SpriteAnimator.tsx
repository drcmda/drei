/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import { ThreeElements, useFrame, Vector3 } from '@react-three/fiber'
import * as THREE from 'three'
import { Instances, Instance } from './Instances'
import { Billboard } from './Billboard'
import { FrameData, getFirstFrame, Size, SpriteData, useSpriteLoader } from './useSpriteLoader'

// Frame-related types

type AnimationEventData = {
  currentFrameName: string
  currentFrame: number
}

type CommonProps<T, U, V> = Pick<T & U & V, keyof T & keyof U & keyof V>
type CommonMeshProps = CommonProps<
  React.ComponentProps<'mesh'>,
  React.ComponentProps<typeof Instance>,
  React.ComponentProps<typeof Instances>
>

export type SpriteAnimatorProps = {
  /** The start frame of the animation */
  startFrame?: number
  /** The end frame of the animation */
  endFrame?: number
  /** The desired frames per second of the animation. If set to 0 or negative, animation will be static */
  fps?: number
  /** The frame identifier to use, must be one of animationNames */
  frameName?: string
  /** The URL of the texture JSON (if using JSON-Array or JSON-Hash) */
  textureDataURL?: string
  /** The URL of the texture image */
  textureImageURL?: string
  /** Whether or not the animation should loop */
  loop?: boolean
  /** The number of frames of the animation (required if using plain spritesheet without JSON) */
  numberOfFrames?: number
  /** Whether or not the animation should auto-start when all assets are loaded */
  autoPlay?: boolean
  /** The animation names of the spritesheet (if the spritesheet -with JSON- contains more animation sequences) */
  animationNames?: Array<string>
  /** Event callback when the animation starts or restarts */
  onStart?: (data: AnimationEventData) => void
  /** Event callback when the animation ends */
  onEnd?: (data: AnimationEventData) => void
  /** Event callback when the animation completes a loop cycle */
  onLoopEnd?: (data: AnimationEventData) => void
  /** Event callback fired on each frame change */
  onFrame?: (data: AnimationEventData) => void
  /** @deprecated Use pause={false} instead. Control when the animation runs */
  play?: boolean
  /** Control when the animation pauses */
  pause?: boolean
  /** Whether or not the Sprite should flip sides on the x-axis */
  flipX?: boolean
  /** Sets the alpha value to be used when running an alpha test
   * @see https://threejs.org/docs/#api/en/materials/Material.alphaTest
   */
  alphaTest?: number
  /** Displays the texture on a Billboard component always facing the camera.
   * If set to false, it renders on a PlaneGeometry
   */
  asSprite?: boolean
  /** Allows for manual update of the sprite animation e.g: via ScrollControls.
   * Value should be between 0 and 1
   */
  offset?: number
  /** Allows the sprite animation to start from the end towards the start */
  playBackwards?: boolean
  /** Allows the animation to be paused after it ended so it can be restarted on demand via autoPlay */
  resetOnEnd?: boolean
  /** Array of Vector3-like positions for creating multiple instances of the sprite */
  instanceItems?: Vector3[]
  /** The maximum number of instances to render (for buffer size calculation) */
  maxItems?: number
  /** Pre-parsed sprite data, usually from useSpriteLoader ready for use */
  spriteDataset?: {
    spriteTexture: THREE.Texture
    spriteData: SpriteData | null
    aspect: Vector3
  } | null
  /** Configuration options for the canvas context when loading textures
   * @see https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/CanvasRenderingContext2D
   */
  canvasRenderingContext2DSettings?: CanvasRenderingContext2DSettings
  /** Controls whether frame positions are rounded for precise pixel alignment.
   * Enable this if you notice slight texture bleeding between frames.
   */
  roundFramePosition?: boolean
  /** Additional properties to be passed to both simple mesh and instance components.
   * @example { frustumCulled: false, renderOrder: 1 }
   * @see https://threejs.org/docs/#api/en/core/Object3D
   */
  meshProps?: CommonMeshProps
} & Omit<ThreeElements['group'], 'ref'>

type SpriteAnimatorState = {
  current?: number
  offset?: number
  imageUrl?: string
  hasEnded: boolean
  ref: React.Ref<THREE.Group>
}

type Scale = Vector3

const context = React.createContext<SpriteAnimatorState | null>(null)

export function useSpriteAnimator() {
  return React.useContext(context)
}

// Type guard for SpriteData
function isSpriteData(data: SpriteData | null) {
  return data !== null && 'meta' in data && 'frames' in data
}

const geometry = /* @__PURE__ */ new THREE.PlaneGeometry(1, 1)

export const SpriteAnimator = /* @__PURE__ */ React.forwardRef<THREE.Group, SpriteAnimatorProps>(
  (
    {
      startFrame = 0,
      endFrame,
      fps = 30,
      frameName = '',
      textureDataURL,
      textureImageURL,
      loop = false,
      numberOfFrames = 1,
      autoPlay = true,
      animationNames,
      onStart,
      onEnd,
      onLoopEnd,
      onFrame,
      play,
      pause = false,
      flipX = false,
      alphaTest = 0.0,
      children,
      asSprite = false,
      offset,
      playBackwards = false,
      resetOnEnd = false,
      maxItems = 1,
      instanceItems = [[0, 0, 0]],
      spriteDataset,
      canvasRenderingContext2DSettings,
      roundFramePosition = false,
      meshProps = {},
      ...props
    },
    fref
  ) => {
    const ref = React.useRef(new THREE.Group())
    const spriteData = React.useRef<SpriteData | null>(null)
    const matRef = React.useRef<THREE.MeshBasicMaterial | null>(null)
    const spriteRef = React.useRef<THREE.Mesh | THREE.InstancedMesh>(null)
    const timerOffset = React.useRef(window.performance.now())
    const currentFrame = React.useRef(startFrame)
    const currentFrameName = React.useRef(frameName)
    const fpsInterval = fps > 0 ? 1000 / fps : 0
    const [spriteTexture, setSpriteTexture] = React.useState(new THREE.Texture())
    const totalFrames = React.useRef(0)
    const [aspect, setAspect] = React.useState(new THREE.Vector3(1, 1, 1))
    const flipOffset = flipX ? -1 : 1
    const pauseRef = React.useRef(pause)
    const pos = React.useRef(offset)
    const softEnd = React.useRef(false)
    const { spriteObj, loadJsonAndTexture } = useSpriteLoader(
      null,
      null,
      animationNames,
      numberOfFrames,
      undefined,
      canvasRenderingContext2DSettings
    )
    const frameNameRef = React.useRef(frameName)

    // lite version for pre-loaded assets
    const parseSpriteDataLite = React.useCallback(
      (textureData: THREE.Texture, data: SpriteData | null) => {
        if (data === null) {
          if (numberOfFrames) {
            //get size from texture

            totalFrames.current = numberOfFrames

            if (playBackwards) {
              currentFrame.current = numberOfFrames - 1
            }

            spriteData.current = data
          }
        } else {
          spriteData.current = data
          if (spriteData.current && Array.isArray(spriteData.current.frames)) {
            totalFrames.current = spriteData.current.frames.length
          } else if (spriteData.current && typeof spriteData.current === 'object' && frameNameRef.current) {
            totalFrames.current = spriteData.current.frames[frameNameRef.current].length
          } else {
            totalFrames.current = 0
          }

          if (playBackwards) {
            currentFrame.current = totalFrames.current - 1
          }

          const { w, h } = getFirstFrame(spriteData.current?.frames ?? [], frameNameRef.current).sourceSize
          const aspect = calculateAspectRatio(w, h)

          setAspect(aspect)
          if (matRef.current) {
            matRef.current.map = textureData
          }
        }

        setSpriteTexture(textureData)
      },
      [numberOfFrames, playBackwards]
    )

    // modify the sprite material after json is parsed and state updated
    const modifySpritePosition = React.useCallback((): void => {
      if (!spriteData.current) return
      const {
        meta: { size: metaInfo },
        frames,
      } = spriteData.current

      const { w: frameW, h: frameH } = Array.isArray(frames)
        ? frames[0].sourceSize
        : frameName
          ? frames[frameName]
            ? frames[frameName][0].sourceSize
            : { w: 0, h: 0 }
          : { w: 0, h: 0 }

      if (matRef.current && matRef.current.map) {
        matRef.current.map.wrapS = matRef.current.map.wrapT = THREE.RepeatWrapping
        matRef.current.map.center.set(0, 0)
        matRef.current.map.repeat.set((1 * flipOffset) / (metaInfo.w / frameW), 1 / (metaInfo.h / frameH))
      }
      //const framesH = (metaInfo.w - 1) / frameW
      const framesV = (metaInfo.h - 1) / frameH
      const frameOffsetY = 1 / framesV
      if (matRef.current && matRef.current.map) {
        matRef.current.map.offset.x = 0.0 //-matRef.current.map.repeat.x
        matRef.current.map.offset.y = 1 - frameOffsetY
      }

      if (onStart) {
        onStart({
          currentFrameName: frameName ?? '',
          currentFrame: currentFrame.current,
        })
      }
    }, [flipOffset, frameName, onStart])

    const state = React.useMemo<SpriteAnimatorState>(
      () => ({
        current: pos.current,
        offset: pos.current,
        imageUrl: textureImageURL,
        hasEnded: false,
        ref: fref,
      }),
      [textureImageURL, fref]
    )

    React.useImperativeHandle(fref, () => ref.current, [])

    React.useLayoutEffect(() => {
      pos.current = offset
    }, [offset])

    const calculateAspectRatio = (width: number, height: number) => {
      const ret = new THREE.Vector3()
      const aspectRatio = height / width
      ret.set(1, aspectRatio, 1)
      spriteRef.current?.scale.copy(ret)
      return ret
    }

    // initial loads
    React.useEffect(() => {
      if (spriteDataset) {
        parseSpriteDataLite(spriteDataset?.spriteTexture?.clone(), spriteDataset.spriteData)
      } else {
        if (textureImageURL && textureDataURL) {
          loadJsonAndTexture(textureImageURL, textureDataURL)
        }
      }
    }, [loadJsonAndTexture, spriteDataset, textureDataURL, textureImageURL, parseSpriteDataLite])

    React.useEffect(() => {
      if (spriteObj) {
        parseSpriteDataLite(spriteObj?.spriteTexture?.clone(), spriteObj?.spriteData)
      }
    }, [spriteObj, parseSpriteDataLite])

    // support backwards play
    React.useEffect(() => {
      state.hasEnded = false
      if (spriteData.current && playBackwards === true) {
        currentFrame.current = ((spriteData.current.frames.length as number) ?? 0) - 1
      } else {
        currentFrame.current = 0
      }
    }, [playBackwards, state])

    React.useLayoutEffect(() => {
      modifySpritePosition()
    }, [spriteTexture, flipX, modifySpritePosition])

    React.useEffect(() => {
      if (autoPlay) {
        pauseRef.current = false
      }
    }, [autoPlay])

    React.useLayoutEffect(() => {
      if (currentFrameName.current !== frameName && frameName) {
        currentFrame.current = 0
        currentFrameName.current = frameName
        state.hasEnded = false
        if (fpsInterval <= 0) {
          currentFrame.current = endFrame || startFrame || 0
        }
        // modifySpritePosition()
        if (spriteData.current) {
          const { w, h } = getFirstFrame(spriteData.current.frames, frameName).sourceSize
          const _aspect = calculateAspectRatio(w, h)
          setAspect(_aspect)
        }
      }
    }, [frameName, fpsInterval, state, endFrame, startFrame])

    // run the animation on each frame
    const runAnimation = (): void => {
      if (!isSpriteData(spriteData.current)) return

      const {
        meta: { size: metaInfo },
        frames,
      } = spriteData.current
      const { w: frameW, h: frameH } = getFirstFrame(frames, frameName).sourceSize
      const spriteFrames = Array.isArray(frames) ? frames : frameName ? frames[frameName] : []
      const _endFrame = endFrame || spriteFrames.length - 1

      var _offset = offset === undefined ? state.current : offset

      if (fpsInterval <= 0) {
        currentFrame.current = endFrame || startFrame || 0
        calculateFinalPosition(frameW, frameH, metaInfo, spriteFrames)
        return
      }

      const now = window.performance.now()
      const diff = now - timerOffset.current
      if (diff <= fpsInterval) return

      // conditionals to support backwards play
      var endCondition = playBackwards ? currentFrame.current < 0 : currentFrame.current > _endFrame
      var onStartCondition = playBackwards ? currentFrame.current === _endFrame : currentFrame.current === 0
      var manualProgressEndCondition = playBackwards ? currentFrame.current < 0 : currentFrame.current >= _endFrame

      if (endCondition) {
        currentFrame.current = loop ? (startFrame ?? 0) : 0

        if (playBackwards) {
          currentFrame.current = _endFrame
        }

        if (loop) {
          onLoopEnd?.({
            currentFrameName: frameName ?? '',
            currentFrame: currentFrame.current,
          })
        } else {
          onEnd?.({
            currentFrameName: frameName ?? '',
            currentFrame: currentFrame.current,
          })

          state.hasEnded = !resetOnEnd
          if (resetOnEnd) {
            pauseRef.current = true
            //calculateFinalPosition(frameW, frameH, metaInfo, spriteFrames)
          }
        }

        if (!loop) return
      } else if (onStartCondition) {
        onStart?.({
          currentFrameName: frameName ?? '',
          currentFrame: currentFrame.current,
        })
      }

      // for manual update
      if (_offset !== undefined && manualProgressEndCondition) {
        if (softEnd.current === false) {
          onEnd?.({
            currentFrameName: frameName ?? '',
            currentFrame: currentFrame.current,
          })
          softEnd.current = true
        }
      } else {
        // same for start?
        softEnd.current = false
      }

      // clock to limit fps
      if (diff <= fpsInterval) return
      timerOffset.current = now - (diff % fpsInterval)

      calculateFinalPosition(frameW, frameH, metaInfo, spriteFrames)
    }

    const calculateFinalPosition = (frameW: number, frameH: number, metaInfo: Size, spriteFrames: FrameData[]) => {
      // get the manual update offset to find the next frame
      var _offset = offset === undefined ? state.current : offset
      const targetFrame = currentFrame.current
      let finalValX = 0
      let finalValY = 0
      calculateAspectRatio(frameW, frameH)

      const framesH = roundFramePosition ? Math.round((metaInfo.w - 1) / frameW) : (metaInfo.w - 1) / frameW
      const framesV = roundFramePosition ? Math.round((metaInfo.h - 1) / frameH) : (metaInfo.h - 1) / frameH

      if (!spriteFrames[targetFrame]) {
        return
      }

      const {
        frame: { x: frameX, y: frameY },
        sourceSize: { w: originalSizeX, h: originalSizeY },
      } = spriteFrames[targetFrame]

      const frameOffsetX = 1 / framesH
      const frameOffsetY = 1 / framesV
      if (matRef.current && matRef.current.map) {
        finalValX =
          flipOffset > 0
            ? frameOffsetX * (frameX / originalSizeX)
            : frameOffsetX * (frameX / originalSizeX) - matRef.current.map.repeat.x
        finalValY = Math.abs(1 - frameOffsetY) - frameOffsetY * (frameY / originalSizeY)

        matRef.current.map.offset.x = finalValX
        matRef.current.map.offset.y = finalValY
      }

      // if manual update is active
      if (_offset !== undefined && _offset !== null) {
        // Calculate the frame index, based on offset given from the provider
        let frameIndex = Math.floor(_offset * spriteFrames.length)

        // Ensure the frame index is within the valid range
        frameIndex = Math.max(0, Math.min(frameIndex, spriteFrames.length - 1))

        if (isNaN(frameIndex)) {
          frameIndex = 0 //fallback
        }
        currentFrame.current = frameIndex
      } else {
        // auto update
        if (playBackwards) {
          currentFrame.current -= 1
        } else {
          currentFrame.current += 1
        }
      }
    }

    // *** Warning! It runs on every frame! ***
    useFrame((_state, _delta) => {
      if (!spriteData.current?.frames || !matRef.current?.map) {
        return
      }

      if (pauseRef.current) {
        return
      }

      if (!state.hasEnded && (autoPlay || play)) {
        runAnimation()
        onFrame?.({
          currentFrameName: currentFrameName.current,
          currentFrame: currentFrame.current,
        })
      }
    })

    function multiplyScale(initialScale = new THREE.Vector3(1, 1, 1), newScale: Scale = 1) {
      if (typeof newScale === 'number') return initialScale.multiplyScalar(newScale)
      if (Array.isArray(newScale)) return initialScale.multiply(new THREE.Vector3(...newScale))
      if (newScale instanceof THREE.Vector3) return initialScale.multiply(newScale)
    }

    return (
      <group {...props} ref={ref} scale={multiplyScale(aspect, props.scale as Scale | undefined)}>
        <context.Provider value={state}>
          {asSprite && (
            <Billboard>
              <mesh ref={spriteRef} scale={1.0} geometry={geometry} {...meshProps}>
                <meshBasicMaterial
                  premultipliedAlpha={false}
                  toneMapped={false}
                  side={THREE.DoubleSide}
                  ref={matRef}
                  map={spriteTexture}
                  transparent={true}
                  alphaTest={alphaTest ?? 0.0}
                />
              </mesh>
            </Billboard>
          )}
          {!asSprite && (
            <Instances geometry={geometry} limit={maxItems ?? 1} {...meshProps}>
              <meshBasicMaterial
                premultipliedAlpha={false}
                toneMapped={false}
                side={THREE.DoubleSide}
                ref={matRef}
                map={spriteTexture}
                transparent={true}
                alphaTest={alphaTest ?? 0.0}
              />
              {(instanceItems ?? [0]).map((item, index) => (
                <Instance
                  key={index}
                  ref={instanceItems?.length === 1 ? spriteRef : null}
                  position={item}
                  scale={1.0}
                  {...meshProps}
                />
              ))}
            </Instances>
          )}
          {children}
        </context.Provider>
      </group>
    )
  }
)
