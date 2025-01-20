import * as React from 'react'
import * as THREE from 'three'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Icosahedron, Html, OrthographicCamera } from '../../src'
import { HtmlProps, CalculatePosition } from '../../src/web/Html'
import { useFrame, useThree } from '@react-three/fiber'
import { Meta, StoryObj } from '@storybook/react'

export default {
  title: 'Misc/Html',
  component: Html,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(-20, 20, -20)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Html>

type Story = StoryObj<typeof Html>

function HTMLScene({
  color = 'hotpink',
  children,
  ...htmlProps
}: {
  color?: React.ComponentProps<'meshBasicMaterial'>['color']
  children?: React.ReactNode
} & HtmlProps) {
  const ref = useTurntable<React.ComponentRef<'group'>>()

  return (
    <group ref={ref}>
      <Icosahedron args={[2, 2]} position={[3, 6, 4]}>
        <meshBasicMaterial color={color} wireframe />
        <Html {...htmlProps}>First</Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[10, 0, 10]}>
        <meshBasicMaterial color={color} wireframe />
        <Html {...htmlProps}>Second</Html>
      </Icosahedron>

      <Icosahedron args={[2, 2]} position={[-20, 0, -20]}>
        <meshBasicMaterial color={color} wireframe />
        <Html {...htmlProps}>Third</Html>
      </Icosahedron>

      {children}
    </group>
  )
}

export const HTMLSt = {
  args: {
    distanceFactor: 30,
    className: 'html-story-block',
  },
  render: (args) => <HTMLScene {...args} />,
  name: 'Transform mode',
} satisfies Story

//

function HTMLTransformScene(props: HtmlProps) {
  return (
    <HTMLScene color="palegreen" transform className="html-story-block margin300" distanceFactor={30}>
      <Html {...props}>Transform mode</Html>
    </HTMLScene>
  )
}

export const HTMLTransformSt = {
  args: {
    sprite: true,
    transform: true,
    distanceFactor: 20,
    position: [5, 15, 0],
    style: {
      background: 'palegreen',
      fontSize: '50px',
      padding: '10px 18px',
      border: '2px solid black',
    },
  },
  render: (args) => <HTMLTransformScene {...args} />,
  name: 'Transform mode',
} satisfies Story

//

function HTMLOrthographicScene(props: HtmlProps) {
  const camera = useThree((state) => state.camera)
  const [zoomIn, setZoomIn] = React.useState(true)

  const initialCamera = {
    position: new THREE.Vector3(0, 0, -10),
  }

  useFrame(() => {
    zoomIn ? (camera.zoom += 0.01) : (camera.zoom -= 0.01)
    camera.updateProjectionMatrix()

    if (camera.zoom > 3) {
      setZoomIn(false)
    } else if (camera.zoom < 1) {
      setZoomIn(true)
    }
  })

  return (
    <>
      <OrthographicCamera makeDefault={true} applyMatrix4={undefined} {...initialCamera} />

      <Icosahedron args={[200, 5]} position={[0, 0, 0]}>
        <meshBasicMaterial color="hotpink" wireframe />
        {
          // for smoother text use css will-change: transform
          <Html {...props}>Orthographic</Html>
        }
      </Icosahedron>
      <ambientLight intensity={0.8} />
      <pointLight intensity={1} position={[0, 6, 0]} />
    </>
  )
}

export const HTMLOrthoSt = {
  args: {
    distanceFactor: 1,
    className: 'html-story-label',
  },
  render: (args) => <HTMLOrthographicScene {...args} />,
  name: 'Orthographic',
} satisfies Story

//

const v1 = new THREE.Vector3()
const overrideCalculatePosition: CalculatePosition = (el, camera, size) => {
  const objectPos = v1.setFromMatrixPosition(el.matrixWorld)
  objectPos.project(camera)
  const widthHalf = size.width / 2
  const heightHalf = size.height / 2
  return [
    Math.min(size.width - 100, Math.max(0, objectPos.x * widthHalf + widthHalf)),
    Math.min(size.height - 20, Math.max(0, -(objectPos.y * heightHalf) + heightHalf)),
  ]
}

export const HTMLCalculatePositionSt = {
  args: {
    className: 'html-story-label',
    calculatePosition: overrideCalculatePosition,
  },
  render: (args) => <HTMLScene {...args} />,
  name: 'Custom Calculate Position',
} satisfies Story

//

function HTMLOccluderScene(props: HtmlProps) {
  const turntableRef = useTurntable<React.ComponentRef<'group'>>()
  const occluderRef = React.useRef<React.ComponentRef<typeof Icosahedron>>(null)

  return (
    <>
      <group ref={turntableRef}>
        <Icosahedron name="pink" args={[5, 5]} position={[0, 0, 0]}>
          <meshBasicMaterial color="hotpink" />
          <Html {...props} position={[0, 0, -6]} className="html-story-label" occlude="blending">
            Blending
          </Html>
        </Icosahedron>
        <Icosahedron name="yellow" args={[5, 5]} position={[16, 0, 0]}>
          <meshBasicMaterial color="yellow" />
          <Html
            {...props}
            transform
            position={[0, 0, -6]}
            className="html-story-label html-story-label-B"
            occlude="blending"
          >
            Blending w/ transform
          </Html>
        </Icosahedron>
        <Icosahedron ref={occluderRef} name="orange" args={[5, 5]} position={[0, 0, 16]}>
          <meshBasicMaterial color="orange" />
          <Html {...props} position={[0, 0, -6]} className="html-story-label" occlude={[occluderRef]}>
            Raycast occlusion
          </Html>
        </Icosahedron>
      </group>
      <ambientLight intensity={0.8} />
      <pointLight intensity={1} position={[0, 6, 0]} />
    </>
  )
}

export const HTMLOccluderSt = {
  args: {},
  render: (args) => <HTMLOccluderScene {...args} />,
  name: 'Occlusion',
} satisfies Story
