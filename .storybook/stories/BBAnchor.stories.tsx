import * as React from 'react'
import { ComponentProps } from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'

import { Icosahedron, Sphere, Html, BBAnchor, OrbitControls, useHelper } from '../../src'
import { BoxHelper } from 'three'

export default {
  title: 'Staging/BBAnchor',
  component: BBAnchor,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(2, 2, 2)} controls={false}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof BBAnchor>

type Story = StoryObj<typeof BBAnchor>

function BBAnchorScene({
  drawBoundingBox,
  children,
  ...props
}: ComponentProps<typeof BBAnchor> & {
  drawBoundingBox: boolean
  children?: React.ReactNode
}) {
  const ref = React.useRef<THREE.Mesh<THREE.IcosahedronGeometry>>(null!)

  useHelper(drawBoundingBox && ref, BoxHelper, 'cyan')

  return (
    <>
      <OrbitControls autoRotate />
      <Icosahedron ref={ref}>
        <meshBasicMaterial color="hotpink" wireframe />
        <BBAnchor {...props}>{children}</BBAnchor>
      </Icosahedron>
    </>
  )
}

function HtmlComp() {
  return (
    <Html
      style={{
        color: 'white',
        whiteSpace: 'nowrap',
      }}
      center
    >
      Html element
    </Html>
  )
}

export const BBAnchorWithHtml = {
  render: (args) => (
    <BBAnchorScene {...args} drawBoundingBox={true}>
      <HtmlComp />
    </BBAnchorScene>
  ),
  args: {
    anchor: [1, 1, 1],
  },
  name: 'With Html component',
} satisfies Story

function MeshComp() {
  return (
    <Sphere args={[0.25]}>
      <meshBasicMaterial color="lime" />
    </Sphere>
  )
}

export const BBAnchorWithMesh = {
  render: (args) => (
    <BBAnchorScene {...args} drawBoundingBox={true}>
      <MeshComp />
    </BBAnchorScene>
  ),
  args: {
    anchor: [1, 1, 1],
  },
  name: 'With other mesh',
} satisfies Story
