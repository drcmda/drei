import * as React from 'react'
import * as THREE from 'three'
import { Meta, StoryObj } from '@storybook/react'

import { Setup } from '../Setup'
import { useTurntable } from '../useTurntable'

import { Tube } from '../../src'

export default {
  title: 'Shapes/Tube',
  component: Tube,
  decorators: [
    (Story) => (
      <Setup cameraPosition={new THREE.Vector3(-30, 30, 30)}>
        <Story />
      </Setup>
    ),
  ],
} satisfies Meta<typeof Tube>

type Story = StoryObj<typeof Tube>

function TubeScene(props: React.ComponentProps<typeof Tube>) {
  // curve example from https://threejs.org/docs/#api/en/geometries/TubeGeometry
  const path = React.useMemo(() => {
    class CustomSinCurve extends THREE.Curve<THREE.Vector3> {
      private scale: number

      constructor(scale = 1) {
        super()

        this.scale = scale
      }

      getPoint(t: number) {
        const tx = t * 3 - 1.5
        const ty = Math.sin(2 * Math.PI * t)
        const tz = 0

        return new THREE.Vector3(tx, ty, tz).multiplyScalar(this.scale)
      }
    }

    return new CustomSinCurve(10)
  }, [])

  const ref = useTurntable<React.ComponentRef<typeof Tube>>()

  return (
    <Tube ref={ref} args={[path]} {...props}>
      <meshPhongMaterial color="#f3f3f3" wireframe />
    </Tube>
  )
}

export const TubeSt = {
  render: (args) => <TubeScene {...args} />,
  name: 'Default',
} satisfies Story
