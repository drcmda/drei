import * as React from 'react'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { MeshBVHHelper } from 'three-mesh-bvh'

import { useHelper, Bvh, TorusKnot, OrbitControls } from '../../src'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Mesh, Raycaster, Vector3 } from 'three'

export default {
  title: 'Performance/Bvh',
  component: Bvh,
  decorators: [
    (Story) => (
      <Setup controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Bvh>

type Story = StoryObj<typeof Bvh>

function TorusBVH({ z = 0, ...props }: { z: number } & React.ComponentProps<typeof Bvh>) {
  const mesh = React.useRef<React.ComponentRef<typeof TorusKnot>>(null!)

  useHelper(mesh, MeshBVHHelper)

  const [hovered, setHover] = React.useState(false)
  return (
    <Bvh {...props}>
      <TorusKnot
        ref={mesh}
        position-z={z}
        args={[1, 0.4, 250, 50]}
        onPointerOver={() => setHover(true)}
        onPointerOut={() => setHover(false)}
      >
        <meshBasicMaterial color={hovered ? 0xffff00 : 0xff0000} />
      </TorusKnot>
    </Bvh>
  )
}

const pointDist = 5
const raycaster = new Raycaster()
const origVec = new Vector3()
const dirVec = new Vector3()

const AddRaycaster = ({ grp }) => {
  // Objects
  const objRef = React.useRef<Group>(null)
  const origMesh = React.useRef<Mesh>(null)
  const hitMesh = React.useRef<Mesh>(null)
  const cylinderMesh = React.useRef<Mesh>(null)

  // set transforms
  React.useEffect(() => {
    if (!objRef.current || !origMesh.current || !hitMesh.current || !cylinderMesh.current) {
      return
    }
    hitMesh.current.scale.multiplyScalar(0.5)
    origMesh.current.position.set(pointDist, 0, 0)
    objRef.current.rotation.x = Math.random() * 10
    objRef.current.rotation.y = Math.random() * 10
  }, [])

  const xDir = Math.random() - 0.5
  const yDir = Math.random() - 0.5

  useFrame((_, delta) => {
    const obj = objRef.current
    if (!obj || !origMesh.current || !hitMesh.current || !cylinderMesh.current) {
      return
    }
    obj.rotation.x += xDir * delta
    obj.rotation.y += yDir * delta

    origMesh.current.updateMatrixWorld()
    origVec.setFromMatrixPosition(origMesh.current.matrixWorld)
    dirVec.copy(origVec).multiplyScalar(-1).normalize()

    raycaster.set(origVec, dirVec)
    const ray: any = raycaster
    ray.firstHitOnly = true
    const res = raycaster.intersectObject(grp.current, true)
    const length = res.length ? res[0].distance : pointDist

    hitMesh.current.position.set(pointDist - length, 0, 0)
    cylinderMesh.current.position.set(pointDist - length / 2, 0, 0)
    cylinderMesh.current.scale.set(1, length, 1)
    cylinderMesh.current.rotation.z = Math.PI / 2
  })

  return (
    <group ref={objRef}>
      <mesh ref={origMesh}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh ref={hitMesh}>
        <sphereGeometry args={[0.1, 20, 20]} />
        <meshBasicMaterial color={0xffffff} />
      </mesh>
      <mesh ref={cylinderMesh}>
        <cylinderGeometry args={[0.01, 0.01]} />
        <meshBasicMaterial color={0xffffff} transparent opacity={0.25} />
      </mesh>
    </group>
  )
}

const DebugRayCast = ({ grp }) => {
  return (
    <>
      {new Array(40).fill({}).map((_, id) => {
        return <AddRaycaster key={id} grp={grp} />
      })}
    </>
  )
}

function Scene(props: React.ComponentProps<typeof Bvh>) {
  const grp = React.useRef<React.ComponentRef<'group'>>(null)

  const { raycaster } = useThree()
  raycaster.firstHitOnly = true

  return (
    <>
      <group ref={grp}>
        <TorusBVH {...props} z={-2} />
        <TorusBVH {...props} z={0} />
        <TorusBVH {...props} z={2} />
      </group>
      <DebugRayCast grp={grp} />
      <OrbitControls enablePan={false} zoomSpeed={0.5} />
    </>
  )
}

export const DefaultStory = {
  args: {
    enabled: true,
  },
  render: (args) => <Scene {...args} />,
  name: 'Default',
} satisfies Story
