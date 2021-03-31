import * as React from 'react'
import { useFrame } from '@react-three/fiber'
import { Vector3, Mesh, RepeatWrapping, Vector2 } from 'three'

import { Setup } from '../Setup'
import { Reflector, useTexture, TorusKnot, Box } from '../../src'

export default {
  title: 'Misc/Reflector',
  component: Reflector,
  decorators: [
    (storyFn) => (
      <Setup cameraFov={20} cameraPosition={new Vector3(-2, 2, 6)}>
        {storyFn()}
      </Setup>
    ),
  ],
}

function ReflectorScene({
  mixBlur,
  depthScale,
  distortion,
  normalScale,
}: {
  mixBlur?: number
  depthScale?: number
  distortion?: number
  normalScale?: number
}) {
  const roughness = useTexture('roughness_floor.jpeg')
  const normal = useTexture('NORM.jpg')
  const distortionMap = useTexture('dist_map.jpeg')
  const $box = React.useRef<Mesh>(null!)
  const _normalScale = React.useMemo(() => new Vector2(normalScale || 0), [normalScale])

  React.useEffect(() => {
    distortionMap.wrapS = distortionMap.wrapT = RepeatWrapping
    distortionMap.repeat.set(4, 4)
  }, [distortionMap])

  useFrame(({ clock }) => {
    $box.current.position.y += Math.sin(clock.getElapsedTime()) / 25
    $box.current.rotation.y = clock.getElapsedTime() / 2
  })

  return (
    <>
      <Reflector
        resolution={1024}
        args={[10, 10]}
        mirror={0.75}
        mixBlur={mixBlur || 0}
        mixStrength={1}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        minDepthThreshold={0.8}
        maxDepthThreshold={1.2}
        depthScale={depthScale || 0}
        depthToBlurRatioBias={0.2}
        debug={0}
        distortion={distortion || 0}
        distortionMap={distortionMap}
      >
        {(Material, props) => (
          <Material
            color="#ddd"
            metalness={0}
            roughnessMap={roughness}
            roughness={1}
            normalMap={normal}
            normalScale={_normalScale}
            {...props}
          />
        )}
      </Reflector>

      <Box args={[2, 3, 0.2]} position={[0, 1.6, -3]}>
        <meshPhysicalMaterial color="hotpink" />
      </Box>
      <TorusKnot args={[0.5, 0.2, 128, 32]} ref={$box} position={[0, 1, 0]}>
        <meshPhysicalMaterial color="hotpink" />
      </TorusKnot>
      <spotLight intensity={1} position={[10, 6, 10]} penumbra={1} angle={0.3} />
    </>
  )
}

export const ReflectorSt = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene mixBlur={8} depthScale={1} distortion={0.005} normalScale={0.5} />
  </React.Suspense>
)
ReflectorSt.storyName = 'Default'

export const ReflectorPlain = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene />
  </React.Suspense>
)
ReflectorPlain.storyName = 'Plain'

export const ReflectorBlur = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene mixBlur={10} />
  </React.Suspense>
)
ReflectorBlur.storyName = 'Blur'

export const ReflectorDepth = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene depthScale={2} />
  </React.Suspense>
)
ReflectorDepth.storyName = 'Depth'

export const ReflectorDistortion = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene distortion={0.1} />
  </React.Suspense>
)
ReflectorDistortion.storyName = 'Distortion'

export const ReflectorNormalMap = () => (
  <React.Suspense fallback={null}>
    <ReflectorScene normalScale={0.5} />
  </React.Suspense>
)
ReflectorNormalMap.storyName = 'NormalMap'
