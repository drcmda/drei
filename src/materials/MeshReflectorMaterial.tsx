import { Matrix4, MeshStandardMaterial, Texture } from 'three'

type UninitializedUniform<Value> = { value: Value | null }

export class MeshReflectorMaterial extends MeshStandardMaterial {
  private _tDepth: UninitializedUniform<Texture> = { value: null }
  private _distortionMap: UninitializedUniform<Texture> = { value: null }
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
  private _distortion: { value: number } = { value: 1 }
  private _mixContrast: { value: number } = { value: 1.0 }

  constructor(parameters = {}) {
    super(parameters)
    this.setValues(parameters)
  }
  onBeforeCompile(shader) {
    if (!shader.defines?.USE_UV) {
      shader.defines.USE_UV = ''
    }
    shader.uniforms.hasBlur = this._hasBlur
    shader.uniforms.tDiffuse = this._tDiffuse
    shader.uniforms.tDepth = this._tDepth
    shader.uniforms.distortionMap = this._distortionMap
    shader.uniforms.tDiffuseBlur = this._tDiffuseBlur
    shader.uniforms.textureMatrix = this._textureMatrix
    shader.uniforms.mirror = this._mirror
    shader.uniforms.mixBlur = this._mixBlur
    shader.uniforms.mixStrength = this._blurStrength
    shader.uniforms.minDepthThreshold = this._minDepthThreshold
    shader.uniforms.maxDepthThreshold = this._maxDepthThreshold
    shader.uniforms.depthScale = this._depthScale
    shader.uniforms.depthToBlurRatioBias = this._depthToBlurRatioBias
    shader.uniforms.distortion = this._distortion
    shader.uniforms.mixContrast = this._mixContrast
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
        uniform sampler2D tDiffuse;
        uniform sampler2D tDiffuseBlur;
        uniform sampler2D tDepth;
        uniform sampler2D distortionMap;
        uniform float distortion;
        uniform float cameraNear;
			  uniform float cameraFar;
        uniform bool hasBlur;
        uniform float mixBlur;
        uniform float mirror;
        uniform float mixStrength;
        uniform float minDepthThreshold;
        uniform float maxDepthThreshold;
        uniform float mixContrast;
        uniform float depthScale;
        uniform float depthToBlurRatioBias;
        varying vec4 my_vUv;
        ${shader.fragmentShader}`
    shader.fragmentShader = shader.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      `#include <emissivemap_fragment>

      float distortionFactor = 0.0;
      #ifdef USE_DISTORTION
        distortionFactor = texture2D(distortionMap, vUv).r * distortion;
      #endif

      vec4 new_vUv = my_vUv;
      new_vUv.x += distortionFactor;
      new_vUv.y += distortionFactor;

      vec4 base = texture2DProj(tDiffuse, new_vUv);
      vec4 blur = texture2DProj(tDiffuseBlur, new_vUv);

      vec4 merge = base;

      #ifdef USE_NORMALMAP
        vec2 normal_uv = vec2(0.0);
        vec4 normalColor = texture2D(normalMap, vUv * normalScale);
        vec3 my_normal = normalize( vec3( normalColor.r * 2.0 - 1.0, normalColor.b,  normalColor.g * 2.0 - 1.0 ) );
        vec3 coord = new_vUv.xyz / new_vUv.w;
        normal_uv = coord.xy + coord.z * my_normal.xz * 0.05;
        vec4 base_normal = texture2D(tDiffuse, normal_uv);
        vec4 blur_normal = texture2D(tDiffuseBlur, normal_uv);
        merge = base_normal;
        blur = blur_normal;
      #endif

      float depthFactor = 0.0001;
      float blurFactor = 0.0;

      #ifdef USE_DEPTH
        vec4 depth = texture2DProj(tDepth, new_vUv);
        depthFactor = smoothstep(minDepthThreshold, maxDepthThreshold, 1.0-(depth.r * depth.a));
        depthFactor *= depthScale;
        depthFactor = max(0.0001, min(1.0, depthFactor));

        #ifdef USE_BLUR
          blur = blur * min(1.0, depthFactor + depthToBlurRatioBias);
          merge = merge * min(1.0, depthFactor + 0.5);
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

      vec4 newMerge = vec4(0.0, 0.0, 0.0, 1.0);
      newMerge.r = (merge.r - 0.5) * mixContrast + 0.5;
      newMerge.g = (merge.g - 0.5) * mixContrast + 0.5;
      newMerge.b = (merge.b - 0.5) * mixContrast + 0.5;

      diffuseColor.rgb = diffuseColor.rgb * ((1.0 - min(1.0, mirror)) + newMerge.rgb * mixStrength);
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
  get distortionMap(): Texture | null {
    return this._distortionMap.value
  }
  set distortionMap(v: Texture | null) {
    this._distortionMap.value = v
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
  get depthToBlurRatioBias(): number {
    return this._depthToBlurRatioBias.value
  }
  set depthToBlurRatioBias(v: number) {
    this._depthToBlurRatioBias.value = v
  }
  get distortion(): number {
    return this._distortion.value
  }
  set distortion(v: number) {
    this._distortion.value = v
  }
  get mixContrast(): number {
    return this._mixContrast.value
  }
  set mixContrast(v: number) {
    this._mixContrast.value = v
  }
}
