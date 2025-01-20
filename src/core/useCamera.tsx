import * as React from 'react'
import { Raycaster, Camera, Intersection } from 'three'
import { useThree, applyProps } from '@react-three/fiber'

export function useCamera(camera: Camera | React.RefObject<Camera>, props?: Partial<Raycaster>) {
  const pointer = useThree((state) => state.pointer)
  const [raycast] = React.useState(() => {
    const raycaster = new Raycaster()
    if (props) applyProps(raycaster, props)
    return function (_: Raycaster, intersects: Intersection[]): void {
      raycaster.setFromCamera(pointer, camera instanceof Camera ? camera : camera.current)
      const rc = this.constructor.prototype.raycast.bind(this)
      if (rc) rc(raycaster, intersects)
    }
  })
  return raycast
}
