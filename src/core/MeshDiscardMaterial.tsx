import * as React from 'react'
import { ShaderMaterial } from 'three'
import { extend, ThreeElements } from '@react-three/fiber'
import { DiscardMaterial as DiscardMaterialImpl } from '../materials/DiscardMaterial'
import { ForwardRefComponent } from '../helpers/ts-utils'

declare module '@react-three/fiber' {
  interface ThreeElements {
    discardMaterialImpl: ThreeElements['shaderMaterial']
  }
}

export type MeshDiscardMaterialProps = Omit<ThreeElements['shaderMaterial'], 'ref'>

export const MeshDiscardMaterial: ForwardRefComponent<MeshDiscardMaterialProps, ShaderMaterial> =
  /* @__PURE__ */ React.forwardRef((props, fref) => {
    extend({ DiscardMaterialImpl })
    return <discardMaterialImpl ref={fref} {...props} />
  })
