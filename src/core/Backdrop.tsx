import { ThreeElements } from '@react-three/fiber'
import * as React from 'react'
import { PlaneGeometry, BufferAttribute } from 'three'

const easeInExpo = (x: number) => (x === 0 ? 0 : Math.pow(2, 10 * x - 10))

export type BackdropProps = ThreeElements['group'] & {
  floor?: number
  segments?: number
  receiveShadow?: boolean
  children?: React.ReactNode
}

export function Backdrop({ children, floor = 0.25, segments = 20, receiveShadow, ...props }) {
  const ref = React.useRef<PlaneGeometry>(null!)
  React.useLayoutEffect(() => {
    let i = 0
    const offset = segments / segments / 2
    const position = ref.current.attributes.position as BufferAttribute
    for (let x = 0; x < segments + 1; x++) {
      for (let y = 0; y < segments + 1; y++) {
        position.setXYZ(
          i++,
          x / segments - offset + (x === 0 ? -floor : 0),
          y / segments - offset,
          easeInExpo(x / segments)
        )
      }
    }
    position.needsUpdate = true
    ref.current.computeVertexNormals()
  }, [segments, floor])
  return (
    <group {...props}>
      <mesh receiveShadow={receiveShadow} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry ref={ref} args={[1, 1, segments, segments]} />
        {children}
      </mesh>
    </group>
  )
}
