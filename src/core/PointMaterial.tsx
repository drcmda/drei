import * as THREE from 'three'
import * as React from 'react'
import { ForwardRefComponent } from '../helpers/ts-utils'
import { version } from '../helpers/constants'
import { ThreeElements } from '@react-three/fiber'

const opaque_fragment = version >= 154 ? 'opaque_fragment' : 'output_fragment'

export class PointMaterialImpl extends THREE.PointsMaterial {
  constructor(props) {
    super(props)
    this.onBeforeCompile = (shader, renderer) => {
      const { isWebGL2 } = renderer.capabilities
      shader.fragmentShader = shader.fragmentShader.replace(
        `#include <${opaque_fragment}>`,
        `
        ${
          !isWebGL2
            ? `#extension GL_OES_standard_derivatives : enable\n#include <${opaque_fragment}>`
            : `#include <${opaque_fragment}>`
        }
      vec2 cxy = 2.0 * gl_PointCoord - 1.0;
      float r = dot(cxy, cxy);
      float delta = fwidth(r);     
      float mask = 1.0 - smoothstep(1.0 - delta, 1.0 + delta, r);
      gl_FragColor = vec4(gl_FragColor.rgb, mask * gl_FragColor.a );
      #include <tonemapping_fragment>
      #include <${version >= 154 ? 'colorspace_fragment' : 'encodings_fragment'}>
      `
      )
    }
  }
}

export type PointMaterialProps = Omit<ThreeElements['pointsMaterial'], 'ref'>

export const PointMaterial: ForwardRefComponent<PointMaterialProps, PointMaterialImpl> =
  /* @__PURE__ */ React.forwardRef<PointMaterialImpl, PointMaterialProps>((props, ref) => {
    const [material] = React.useState(() => new PointMaterialImpl(null))
    return <primitive {...props} object={material} ref={ref} attach="material" />
  })
