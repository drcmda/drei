import * as React from 'react'
import { Vector3 } from 'three'
import { GLTF } from 'three-stdlib'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { useAnimations, useGLTF, useMatcapTexture } from '../../src'

type UseAnimationHook = Parameters<typeof useAnimations>
type UseAnimationProps = {
  animations: UseAnimationHook[0]
  root: UseAnimationHook[1]
} & { selectedAction: string; blendDuration: number }

function UseAnimation({ animations, root, selectedAction, blendDuration }: UseAnimationProps) {
  const { actions } = useAnimations(animations, root)

  React.useEffect(() => {
    actions[selectedAction]?.reset().fadeIn(blendDuration).play() // eslint-disable-line
    return () => void actions[selectedAction]?.fadeOut(blendDuration)
  }, [actions, selectedAction, blendDuration])

  return null
}

export default {
  title: 'Abstractions/useAnimations',
  component: UseAnimation,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new Vector3(0, 0, 3)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof UseAnimation>

type Story = StoryObj<typeof UseAnimation>

useGLTF.preload('ybot.glb')

function UseAnimationsScene(props: React.ComponentProps<typeof UseAnimation>) {
  const root = React.useRef<React.ComponentRef<'group'>>(null)
  const { nodes, animations } = useGLTF('ybot.glb') as GLTF & {
    nodes: {
      YB_Body: THREE.SkinnedMesh
      YB_Joints: THREE.SkinnedMesh
      mixamorigHips: THREE.Bone
    }
    materials: {
      YB_Body: THREE.MeshStandardMaterial
      YB_Joints: THREE.MeshStandardMaterial
    }
  }
  const [matcapBody] = useMatcapTexture('293534_B2BFC5_738289_8A9AA7', 1024)
  const [matcapJoints] = useMatcapTexture('3A2412_A78B5F_705434_836C47', 1024)

  return (
    <>
      <color attach="background" args={['#303030']} />
      <group position={[0, -1, 0]}>
        <gridHelper args={[10, 20]} />
        <group ref={root} dispose={null}>
          <group rotation={[Math.PI / 2, 0, 0]} scale={[0.01, 0.01, 0.01]}>
            <primitive object={nodes.mixamorigHips} />
            <skinnedMesh geometry={nodes.YB_Body.geometry} skeleton={nodes.YB_Body.skeleton}>
              <meshMatcapMaterial matcap={matcapBody} />
            </skinnedMesh>
            <skinnedMesh geometry={nodes.YB_Joints.geometry} skeleton={nodes.YB_Joints.skeleton}>
              <meshMatcapMaterial matcap={matcapJoints} />
            </skinnedMesh>
          </group>
        </group>
      </group>

      <UseAnimation {...props} root={root} animations={animations} />
    </>
  )
}

export const UseAnimationsSt = {
  args: {
    selectedAction: 'Strut',
    blendDuration: 0.5,
  },
  argTypes: {
    selectedAction: { control: 'select', options: ['Dance', 'Idle', 'Strut'] },
    blendDuration: { controls: { type: 'range', min: 0, max: 2, step: 0.1 } },
  },
  render: (args) => <UseAnimationsScene {...args} />,
  name: 'Default',
} satisfies Story
