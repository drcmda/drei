import { Matrix4, MeshStandardMaterial, Texture } from 'three'

type UninitializedUniform<Value> = { value: Value | null }

export class MeshReflectorMaterial extends MeshStandardMaterial {
  private _debug: { value: number } = { value: 0 }
  private _tDepth: UninitializedUniform<Texture> = { value: null }
  private _tDiffuse: UninitializedUniform<Texture> = { value: null }
  private _tDiffuseBlur: UninitializedUniform<Texture> = { value: null }
  private _textureMatrix: UninitializedUniform<Matrix4> = { value: null }
  private _hasBlur: { value: boolean } = { value: false }
  private _mirror: { value: number } = { value: 0.0 }
  private _mixBlur: { value: number } = { value: 0.0 }
  private _blurStrength: { value: number } = { value: 0.5 }
  private _minDepthThreshold: { value: number } = { value: 0.9 }
  private _maxDepthThreshold: { value: number } = { value: 1 }
  private _depthScale: { value: number } = { value: 0 }
  private _depthToBlurRatioBias: { value: number } = { value: 0.25 }

  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
  }
  onBeforeCompile(shader) {
    shader.uniforms.debug = this._debug
    shader.uniforms.hasBlur = this._hasBlur
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDepth = this._tDepth
    shader.uniforms.tDiffuseBlur = this._tDiffuseBlur
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.uniforms.mixBlur = this._mixBlur
    shader.uniforms.mixStrength = this._blurStrength
    shader.uniforms.minDepthThreshold = this._minDepthThreshold
    shader.uniforms.maxDepthThreshold = this._maxDepthThreshold
    shader.uniforms.depthScale = this._depthScale
    shader.uniforms.depthToBlurRatioBias = this._depthToBlurRatioBias
    shader.vertexShader = `
        uniform mat4 textureMatrix;
        varying vec4 my_vUv;     
      ${shader.vertexShader}`
    shader.vertexShader = shader.vertexShader.replace(
      '#include <project_vertex>',
      `#include <project_vertex>
        my_vUv = textureMatrix * vec4( position, 1.0 );
        gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );`
    )
    shader.fragmentShader = `
        uniform int debug;
        uniform sampler2D tDiffuse;
        uniform sampler2D tDiffuseBlur;
        uniform sampler2D tDepth;
        uniform float cameraNear;
			  uniform float cameraFar;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec4 my_vUv;        
        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>
      
      vec4 base = texture2DProj(tDiffuse, my_vUv);
      vec4 blur = texture2DProj(tDiffuseBlur, my_vUv);
      
      vec4 merge = base;
      float depthFactor = 0.0001;
      float blurFactor = 0.0;

      #ifdef USE_DEPTH
        vec4 depth = texture2DProj(tDepth, my_vUv);
        depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
        depthFactor *= depthScale;
        depthFactor = max(0.0001, min(1.0, depthFactor));

        #ifdef USE_BLUR
          blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);
          merge = merge * min(1.0, depthFactor + 0.5);;
        #else
          merge = merge * depthFactor;
        #endif
  
      #endif

      float reflectorRoughnessFactor = roughness;
      #ifdef USE_ROUGHNESSMAP
        vec4 reflectorTexelRoughness = texture2D( roughnessMap, vUv );
        reflectorRoughnessFactor *= reflectorTexelRoughness.g;
      #endif
      
      #ifdef USE_BLUR
        blurFactor = min(1.0, mixBlur * reflectorRoughnessFactor);
        merge = mix(merge, blur, blurFactor);
      #endif

      diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + merge.rgb * mixStrength);           
      diffuseColor = sRGBToLinear(diffuseColor);
      
      if (debug == 1) {
        diffuseColor = sRGBToLinear(vec4(vec3(depthFactor), 1.0));
      }
      if (debug == 2) {
        diffuseColor = sRGBToLinear(vec4(vec3(blurFactor), 1.0));
      }
      if (debug == 3) {
        diffuseColor = sRGBToLinear(texture2DProj(tDiffuse, my_vUv));
      }
      if (debug == 4) {
        diffuseColor = sRGBToLinear(texture2DProj(tDiffuseBlur, my_vUv));
      }
      `
    )
  }
  get tDiffuse(): Texture | null {
    return this._tDiffuse.value
  }
  set tDiffuse(v: Texture | null) {
    this._tDiffuse.value = v
  }
  get tDepth(): Texture | null {
    return this._tDepth.value
  }
  set tDepth(v: Texture | null) {
    this._tDepth.value = v
  }
  get tDiffuseBlur(): Texture | null {
    return this._tDiffuseBlur.value
  }
  set tDiffuseBlur(v: Texture | null) {
    this._tDiffuseBlur.value = v
  }
  get textureMatrix(): Matrix4 | null {
    return this._textureMatrix.value
  }
  set textureMatrix(v: Matrix4 | null) {
    this._textureMatrix.value = v
  }
  get hasBlur(): boolean {
    return this._hasBlur.value
  }
  set hasBlur(v: boolean) {
    this._hasBlur.value = v
  }
  get mirror(): number {
    return this._mirror.value
  }
  set mirror(v: number) {
    this._mirror.value = v
  }
  get mixBlur(): number {
    return this._mixBlur.value
  }
  set mixBlur(v: number) {
    this._mixBlur.value = v
  }
  get mixStrength(): number {
    return this._blurStrength.value
  }
  set mixStrength(v: number) {
    this._blurStrength.value = v
  }
  get minDepthThreshold(): number {
    return this._minDepthThreshold.value
  }
  set minDepthThreshold(v: number) {
    this._minDepthThreshold.value = v
  }
  get maxDepthThreshold(): number {
    return this._maxDepthThreshold.value
  }
  set maxDepthThreshold(v: number) {
    this._maxDepthThreshold.value = v
  }
  get depthScale(): number {
    return this._depthScale.value
  }
  set depthScale(v: number) {
    this._depthScale.value = v
  }
  get debug(): number {
    return this._debug.value
  }
  set debug(v: number) {
    this._debug.value = v
  }
  get depthToBlurRatioBias(): number {
    return this._depthToBlurRatioBias.value
  }
  set depthToBlurRatioBias(v: number) {
    this._depthToBlurRatioBias.value = v
  }
}

export type MeshReflectorMaterialImpl = {
  mixBlur: number
  mixStrength: number
  mirror: number
  textureMatrix: Matrix4
  tDiffuse: Texture
  tDiffuseBlur: Texture
  hasBlur: boolean
  minDepthThreshold: number
  maxDepthThreshold: number
  depthScale: number
  depthToBlurRatioBias: number
} & JSX.IntrinsicElements['meshStandardMaterial']
