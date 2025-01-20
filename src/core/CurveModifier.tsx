import * as React from 'react'
import * as THREE from 'three'
import { createPortal, ThreeElements } from '@react-three/fiber'
import { Flow } from 'three-stdlib'
import { ForwardRefComponent } from '../helpers/ts-utils'

export interface CurveModifierProps {
  children: React.ReactElement<ThreeElements['mesh']>
  curve?: THREE.Curve<THREE.Vector3>
}

export type CurveModifierRef = Flow

export const CurveModifier: ForwardRefComponent<CurveModifierProps, CurveModifierRef> =
  /* @__PURE__ */ React.forwardRef(({ children, curve }: CurveModifierProps, ref) => {
    const [scene] = React.useState(() => new THREE.Scene())
    const [obj, set] = React.useState<THREE.Object3D>()
    const modifier = React.useRef<Flow>(null!)

    React.useLayoutEffect(() => {
      modifier.current = new Flow(
        scene.children[0] as THREE.Mesh<THREE.BufferGeometry, THREE.Material | THREE.Material[]>
      )
      set(modifier.current.object3D)
    }, [children])

    React.useEffect(() => {
      if (curve) modifier.current?.updateCurve(0, curve)
    }, [curve])

    React.useImperativeHandle(ref, () => modifier.current)

    return (
      <>
        {createPortal(children, scene)}
        {obj && <primitive object={obj} />}
      </>
    )
  })
