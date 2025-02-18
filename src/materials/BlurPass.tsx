import {
  Mesh,
  BufferGeometry,
  BufferAttribute,
  LinearFilter,
  Scene,
  WebGLRenderTarget,
  WebGLRenderer,
  Camera,
  Vector2,
  HalfFloatType,
} from 'three'

import { ConvolutionMaterial } from './ConvolutionMaterial'

export interface BlurPassProps {
  gl: WebGLRenderer
  resolution: number
  width?: number
  height?: number
  minDepthThreshold?: number
  maxDepthThreshold?: number
  depthScale?: number
  depthToBlurRatioBias?: number
}

export class BlurPass {
  readonly renderTargetA: WebGLRenderTarget
  readonly renderTargetB: WebGLRenderTarget
  readonly convolutionMaterial: ConvolutionMaterial
  readonly scene: Scene
  readonly camera: Camera
  readonly screen: Mesh
  renderToScreen: boolean = false

  constructor({
    gl,
    resolution,
    width = 500,
    height = 500,
    minDepthThreshold = 0,
    maxDepthThreshold = 1,
    depthScale = 0,
    depthToBlurRatioBias = 0.25,
  }: BlurPassProps) {
    this.renderTargetA = new WebGLRenderTarget(resolution, resolution, {
      minFilter: LinearFilter,
      magFilter: LinearFilter,
      stencilBuffer: false,
      depthBuffer: false,
      type: HalfFloatType,
    })
    this.renderTargetB = this.renderTargetA.clone()
    this.convolutionMaterial = new ConvolutionMaterial()
    this.convolutionMaterial.setTexelSize(1.0 / width, 1.0 / height)
    this.convolutionMaterial.setResolution(new Vector2(width, height))
    this.scene = new Scene()
    this.camera = new Camera()
    this.convolutionMaterial.uniforms.minDepthThreshold.value = minDepthThreshold
    this.convolutionMaterial.uniforms.maxDepthThreshold.value = maxDepthThreshold
    this.convolutionMaterial.uniforms.depthScale.value = depthScale
    this.convolutionMaterial.uniforms.depthToBlurRatioBias.value = depthToBlurRatioBias
    this.convolutionMaterial.defines.USE_DEPTH = depthScale > 0
    const vertices = new Float32Array([-1, -1, 0, 3, -1, 0, -1, 3, 0])
    const uvs = new Float32Array([0, 0, 2, 0, 0, 2])
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(vertices, 3))
    geometry.setAttribute('uv', new BufferAttribute(uvs, 2))
    this.screen = new Mesh(geometry, this.convolutionMaterial)
    this.screen.frustumCulled = false
    this.scene.add(this.screen)
  }

  render(renderer, inputBuffer, outputBuffer) {
    const scene = this.scene
    const camera = this.camera
    const renderTargetA = this.renderTargetA
    const renderTargetB = this.renderTargetB
    let material = this.convolutionMaterial
    let uniforms = material.uniforms
    uniforms.depthBuffer.value = inputBuffer.depthTexture
    const kernel = material.kernel
    let lastRT = inputBuffer
    let destRT
    let i, l
    // Apply the multi-pass blur.
    for (i = 0, l = kernel.length - 1; i < l; ++i) {
      // Alternate between targets.
      destRT = (i & 1) === 0 ? renderTargetA : renderTargetB
      uniforms.kernel.value = kernel[i]
      uniforms.inputBuffer.value = lastRT.texture
      renderer.setRenderTarget(destRT)
      renderer.render(scene, camera)
      lastRT = destRT
    }
    uniforms.kernel.value = kernel[i]
    uniforms.inputBuffer.value = lastRT.texture
    renderer.setRenderTarget(this.renderToScreen ? null : outputBuffer)
    renderer.render(scene, camera)
  }
}
