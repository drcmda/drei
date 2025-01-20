import * as React from 'react'
import { IUniform, MeshPhysicalMaterial, MeshPhysicalMaterialParameters } from 'three'
import { ThreeElements, useFrame } from '@react-three/fiber'
// @ts-ignore
import distort from '../helpers/glsl/distort.vert.glsl'
import { ForwardRefComponent } from '../helpers/ts-utils'

interface Uniform<T> {
  value: T
}

class DistortMaterialImpl extends MeshPhysicalMaterial {
  _time: Uniform<number>
  _distort: Uniform<number>
  _radius: Uniform<number>

  constructor(parameters: MeshPhysicalMaterialParameters = {}) {
    super(parameters)
    this.setValues(parameters)
    this._time = { value: 0 }
    this._distort = { value: 0.4 }
    this._radius = { value: 1 }
  }

  // FIXME Use `THREE.WebGLProgramParametersWithUniforms` type when able to target @types/three@0.160.0
  onBeforeCompile(shader: { vertexShader: string; uniforms: { [uniform: string]: IUniform } }) {
    shader.uniforms.time = this._time
    shader.uniforms.radius = this._radius
    shader.uniforms.distort = this._distort

    shader.vertexShader = `
      uniform float time;
      uniform float radius;
      uniform float distort;
      ${distort}
      ${shader.vertexShader}
    `
    shader.vertexShader = shader.vertexShader.replace(
      '#include <begin_vertex>',
      `
        float updateTime = time / 50.0;
        float noise = snoise(vec3(position / 2.0 + updateTime * 5.0));
        vec3 transformed = vec3(position * (noise * pow(distort, 2.0) + radius));
        `
    )
  }

  get time() {
    return this._time.value
  }

  set time(v) {
    this._time.value = v
  }

  get distort() {
    return this._distort.value
  }

  set distort(v) {
    this._distort.value = v
  }

  get radius() {
    return this._radius.value
  }

  set radius(v) {
    this._radius.value = v
  }
}

declare module '@react-three/fiber' {
  interface ThreeElements {
    distortMaterialImpl: ThreeElements['meshPhysicalMaterial'] & {
      time?: number
      distort?: number
      radius?: number
    }
  }
}

export type MeshDistortMaterialProps = Omit<ThreeElements['distortMaterialImpl'], 'ref'> & {
  speed?: number
  factor?: number
}

export const MeshDistortMaterial: ForwardRefComponent<MeshDistortMaterialProps, DistortMaterialImpl> =
  /* @__PURE__ */ React.forwardRef(({ speed = 1, ...props }, ref) => {
    const [material] = React.useState(() => new DistortMaterialImpl())
    useFrame((state) => material && (material.time = state.clock.getElapsedTime() * speed))
    return <primitive object={material} ref={ref} attach="material" {...props} />
  })
