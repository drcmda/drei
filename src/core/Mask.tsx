import * as THREE from 'three'
import * as React from 'react'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { ThreeElements } from '@react-three/fiber'

export type MaskProps = Omit<ThreeElements['mesh'], 'ref' | 'id'> & {
  /** Each mask must have an id, you can have compound masks referring to the same id */
  id: number
  /** If colors of the masks own material will leak through, default: false */
  colorWrite?: boolean
  /** If depth  of the masks own material will leak through, default: false */
  depthWrite?: boolean
}

export const Mask: ForwardRefComponent<MaskProps, THREE.Mesh> = /* @__PURE__ */ React.forwardRef(
  ({ id = 1, colorWrite = false, depthWrite = false, ...props }: MaskProps, fref: React.ForwardedRef<THREE.Mesh>) => {
    const ref = React.useRef<THREE.Mesh>(null!)
    const spread = React.useMemo(
      () => ({
        colorWrite,
        depthWrite,
        stencilWrite: true,
        stencilRef: id,
        stencilFunc: THREE.AlwaysStencilFunc,
        stencilFail: THREE.ReplaceStencilOp,
        stencilZFail: THREE.ReplaceStencilOp,
        stencilZPass: THREE.ReplaceStencilOp,
      }),
      [id, colorWrite, depthWrite]
    )
    React.useLayoutEffect(() => {
      Object.assign(ref.current.material, spread)
    })
    React.useImperativeHandle(fref, () => ref.current, [])
    return <mesh ref={ref} renderOrder={-id} {...props} />
  }
)

export function useMask(id: number, inverse: boolean = false) {
  return {
    stencilWrite: true,
    stencilRef: id,
    stencilFunc: inverse ? THREE.NotEqualStencilFunc : THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.KeepStencilOp,
  }
}
