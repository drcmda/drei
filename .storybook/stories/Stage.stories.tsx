import * as React from 'react'
import { withKnobs, select, number, boolean, object } from '@storybook/addon-knobs'
import { Vector3 } from 'three'

import { Setup } from '../Setup'

import { Stage, Sphere } from '../../src'

import { presetsObj, PresetsType } from '../../src/helpers/environment-assets'

export default {
  title: 'Staging/Stage',
  component: Stage,
  decorators: [withKnobs, (storyFn) => <Setup cameraPosition={new Vector3(0, 0, 3)}>{storyFn()}</Setup>],
}

enum presets {
  rembrant = 'rembrandt',
  portrait = 'portrait',
  upfront = 'upfront',
  soft = 'soft',
}

function StageStory() {
  const envPresets = Object.keys(presetsObj)
  const envPreset = select('Environment', envPresets, envPresets[0])
  const intensity = number('Intensity', 1)
  const presetKnob = select('Preset', presets, presets[0])

  return (
    <React.Suspense fallback={null}>
      <Stage
        contactShadow={object('ContactShadow', {
          blur: 2,
          opacity: 0.5,
          position: [0, 0, 0],
        })}
        shadows={boolean('Shadow', true)}
        intensity={intensity}
        environment={envPreset as PresetsType}
        preset={presetKnob}
      >
        <Sphere args={[1, 24, 24]}>
          <meshPhongMaterial color="royalblue" attach="material" />
        </Sphere>
      </Stage>
    </React.Suspense>
  )
}

export const StageSt = () => <StageStory />
StageSt.story = {
  name: 'Default',
}
