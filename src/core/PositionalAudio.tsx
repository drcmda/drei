import * as React from 'react'
import { AudioLoader, AudioListener, PositionalAudio as PositionalAudioImpl } from 'three'
import { useThree, useLoader, ThreeElements } from '@react-three/fiber'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type PositionalAudioProps = Omit<ThreeElements['positionalAudio'], 'ref' | 'args'> & {
  url: string
  distance?: number
  loop?: boolean
}

export const PositionalAudio: ForwardRefComponent<PositionalAudioProps, PositionalAudioImpl> =
  /* @__PURE__ */ React.forwardRef(({ url, distance = 1, loop = true, autoplay, ...props }, ref) => {
    const sound = React.useRef<PositionalAudioImpl>(null!)
    React.useImperativeHandle(ref, () => sound.current, [])
    const camera = useThree(({ camera }) => camera)
    const [listener] = React.useState(() => new AudioListener())
    const buffer = useLoader(AudioLoader, url)

    React.useEffect(() => {
      const _sound = sound.current
      if (_sound) {
        _sound.setBuffer(buffer)
        _sound.setRefDistance(distance)
        _sound.setLoop(loop)
        if (autoplay && !_sound.isPlaying) _sound.play()
      }
    }, [buffer, camera, distance, loop])

    React.useEffect(() => {
      const _sound = sound.current
      camera.add(listener)
      return () => {
        camera.remove(listener)
        if (_sound) {
          if (_sound.isPlaying) _sound.stop()
          if (_sound.source && (_sound.source as any)._connected) _sound.disconnect()
        }
      }
    }, [])
    return <positionalAudio ref={sound} args={[listener]} {...props} />
  })
