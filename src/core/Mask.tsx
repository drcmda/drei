import * as THREE from 'three'
import * as React from 'react'

type MaskSpread = {
  colorWrite: boolean
  depthWrite: boolean
  stencilWrite: boolean
  stencilRef: number
  stencilFunc: THREE.StencilFunc
  stencilFail: THREE.StencilOp
  stencilZFail: THREE.StencilOp
  stencilZPass: THREE.StencilOp
}

type Props = Omit<JSX.IntrinsicElements['mesh'], 'children'> & {
  /** Each mask must have an id, you can have compound masks referring to the same id */
  id: number
  /** If colors of the masks own material will leak through, default: false */
  colorWrite?: boolean
  /** If depth  of the masks own material will leak through, default: false */
  depthWrite?: boolean
  /** children must define a geometry, a render-prop function is allowed which may override the default material */
  children: ((spread: MaskSpread) => React.ReactNode) | React.ReactNode
}

export function Mask({ id = 1, children, colorWrite = false, depthWrite = false, ...props }: Props) {
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
    [colorWrite, depthWrite]
  )
  return (
    <mesh renderOrder={-id} {...props}>
      <meshBasicMaterial {...spread} />
      {typeof children === 'function' ? children(spread) : children}
    </mesh>
  )
}

export function useMask(id: number) {
  return {
    stencilWrite: true,
    stencilRef: id,
    stencilFunc: THREE.EqualStencilFunc,
    stencilFail: THREE.KeepStencilOp,
    stencilZFail: THREE.KeepStencilOp,
    stencilZPass: THREE.ReplaceStencilOp,
  }
}
