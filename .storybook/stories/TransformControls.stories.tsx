import * as React from 'react'
import { withKnobs, optionsKnob, boolean } from '@storybook/addon-knobs'
import { Object3D } from 'three'
import { TransformControls as TransformControlsImpl, OrbitControls as OrbitControlsImpl } from 'three-stdlib'

import { Setup } from '../Setup'

import { Box, OrbitControls, Select, TransformControls } from '../../src'

export function TransformControlsStory() {
  return (
    <Setup>
      <TransformControls>
        <Box>
          <meshBasicMaterial wireframe />
        </Box>
      </TransformControls>
    </Setup>
  )
}

TransformControlsStory.storyName = 'Default'

export default {
  title: 'Controls/TransformControls',
  component: TransformControls,
}

const modesObj = {
  scale: 'scale',
  rotate: 'rotate',
  translate: 'translate',
  all: 'all',
}

export function TransformControlsAllModesStory() {
  return (
    <Setup>
      <TransformControls mode="all">
        <Box>
          <meshBasicMaterial wireframe />
        </Box>
      </TransformControls>
    </Setup>
  )
}

TransformControlsAllModesStory.storyName = 'All modes active'

export function TransformControlsSelectObjectStory() {
  const [selected, setSelected] = React.useState<Object3D[]>([])
  const active = selected[0]

  return (
    <Setup controls={false}>
      <OrbitControls makeDefault />
      {active && (
        <TransformControls
          object={active}
          mode={optionsKnob('mode', modesObj, 'translate', {
            display: 'radio',
          })}
        />
      )}
      <Select box onChange={setSelected}>
        <group>
          <Box position={[-1, 0, 0]}>
            <meshBasicMaterial wireframe color="orange" />
          </Box>
        </group>
        <group>
          <Box position={[0, 0, 0]}>
            <meshBasicMaterial wireframe color="green" />
          </Box>
        </group>
      </Select>
    </Setup>
  )
}

TransformControlsSelectObjectStory.storyName = 'With <Select />'

function TransformControlsLockScene({ mode, showX, showY, showZ }) {
  const orbitControls = React.useRef<OrbitControlsImpl>(null!)
  const transformControls = React.useRef<TransformControlsImpl>(null!)

  React.useEffect(() => {
    if (transformControls.current) {
      const { current: controls } = transformControls
      const callback = (event) => (orbitControls.current.enabled = !event.value)
      controls.addEventListener('dragging-changed', callback)
      return () => controls.removeEventListener('dragging-changed', callback)
    }
  })

  return (
    <>
      <TransformControls ref={transformControls} mode={mode} showX={showX} showY={showY} showZ={showZ}>
        <Box>
          <meshBasicMaterial wireframe />
        </Box>
      </TransformControls>
      <OrbitControls ref={orbitControls} />
    </>
  )
}

export const TransformControlsLockSt = () => {
  return (
    <TransformControlsLockScene
      mode={optionsKnob('mode', modesObj, 'translate', {
        display: 'radio',
      })}
      showX={boolean('showX', true)}
      showY={boolean('showY', true)}
      showZ={boolean('showZ', true)}
    />
  )
}

TransformControlsLockSt.storyName = 'Lock orbit controls while transforming'
TransformControlsLockSt.decorators = [withKnobs, (storyFn) => <Setup controls={false}>{storyFn()}</Setup>]
