import * as React from 'react'
import { useMemo, useCallback } from 'react'
import { ThreeEvent, useFrame } from '@react-three/fiber'
import { Texture } from 'three'

type Point = {
  x: number
  y: number
  age: number
  force: number
}

type TrailConfig = {
  /** texture size (default: 256x256) */
  size?: number
  /** Max age (ms) of trail points (default: 750) */
  maxAge?: number
  /** Trail radius (default: 0.3) */
  radius?: number
  /** Canvas trail opacity (default: 0.2) */
  intensity?: number
  /** Add points in between slow pointer events (default: 0) */
  interpolate?: number
  /** Moving average of pointer force (default: 0) */
  smoothing?: number
  /** Minimum pointer force (default: 0.3) */
  minForce?: number
  /** Blend mode (default: 'screen') */
  blend?: CanvasRenderingContext2D['globalCompositeOperation']
  /** Easing (default: easeCircOut) */
  ease?: (t: number) => number
}

// smooth new sample (measurement) based on previous sample (current)
function smoothAverage(current: number, measurement: number, smoothing: number = 0.9) {
  return measurement * smoothing + current * (1.0 - smoothing)
}

// default ease
const easeCircleOut = (x: number) => Math.sqrt(1 - Math.pow(x - 1, 2))

class TrailTextureImpl {
  trail: Point[]
  canvas!: HTMLCanvasElement
  ctx!: CanvasRenderingContext2D
  texture!: Texture
  force: number
  size: number
  maxAge: number
  radius: number
  intensity: number
  ease: (t: number) => number
  minForce: number
  interpolate: number
  smoothing: number
  blend: CanvasRenderingContext2D['globalCompositeOperation']

  constructor({
    size = 256,
    maxAge = 750,
    radius = 0.3,
    intensity = 0.2,
    interpolate = 0,
    smoothing = 0,
    minForce = 0.3,
    blend = 'screen', // source-over is canvas default. Others are slower
    ease = easeCircleOut,
  }: TrailConfig = {}) {
    this.size = size
    this.maxAge = maxAge
    this.radius = radius
    this.intensity = intensity
    this.ease = ease
    this.interpolate = interpolate
    this.smoothing = smoothing
    this.minForce = minForce
    this.blend = blend as GlobalCompositeOperation

    this.trail = []
    this.force = 0
    this.initTexture()
  }

  initTexture() {
    this.canvas = document.createElement('canvas')
    this.canvas.width = this.canvas.height = this.size
    const ctx = this.canvas.getContext('2d')

    if (ctx === null) {
      throw new Error('2D not available')
    }

    this.ctx = ctx
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    this.texture = new Texture(this.canvas)

    this.canvas.id = 'touchTexture'
    this.canvas.style.width = this.canvas.style.height = `${this.canvas.width}px`
  }

  update(delta) {
    this.clear()

    // age points
    this.trail.forEach((point, i) => {
      point.age += delta * 1000
      // remove old
      if (point.age > this.maxAge) {
        this.trail.splice(i, 1)
      }
    })

    // reset force when empty (when smoothing)
    if (!this.trail.length) this.force = 0

    this.trail.forEach((point) => {
      this.drawTouch(point)
    })

    this.texture.needsUpdate = true
  }

  clear() {
    this.ctx.globalCompositeOperation = 'source-over'
    this.ctx.fillStyle = 'black'
    this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)
  }

  addTouch(point) {
    const last = this.trail[this.trail.length - 1]

    if (last) {
      const dx = last.x - point.x
      const dy = last.y - point.y
      const dd = dx * dx + dy * dy

      const force = Math.max(this.minForce, Math.min(dd * 10000, 1))

      this.force = smoothAverage(force, this.force, this.smoothing)

      if (!!this.interpolate) {
        const lines = Math.ceil(dd / Math.pow((this.radius * 0.5) / this.interpolate, 2))

        if (lines > 1) {
          for (let i = 1; i < lines; i++) {
            this.trail.push({
              x: last.x - (dx / lines) * i,
              y: last.y - (dy / lines) * i,
              age: 0,
              force,
            })
          }
        }
      }
    }
    this.trail.push({ x: point.x, y: point.y, age: 0, force: this.force })
  }

  drawTouch(point) {
    const pos = {
      x: point.x * this.size,
      y: (1 - point.y) * this.size,
    }

    let intensity = 1
    if (point.age < this.maxAge * 0.3) {
      intensity = this.ease(point.age / (this.maxAge * 0.3))
    } else {
      intensity = this.ease(1 - (point.age - this.maxAge * 0.3) / (this.maxAge * 0.7))
    }

    intensity *= point.force

    // apply blending
    this.ctx.globalCompositeOperation = this.blend

    const radius = this.size * this.radius * intensity
    const grd = this.ctx.createRadialGradient(
      pos.x,
      pos.y,
      Math.max(0, radius * 0.25),
      pos.x,
      pos.y,
      Math.max(0, radius)
    )
    grd.addColorStop(0, `rgba(255, 255, 255, ${this.intensity})`)
    grd.addColorStop(1, `rgba(0, 0, 0, 0.0)`)

    this.ctx.beginPath()
    this.ctx.fillStyle = grd
    this.ctx.arc(pos.x, pos.y, Math.max(0, radius), 0, Math.PI * 2)
    this.ctx.fill()
  }
}

export function useTrailTexture(config: Partial<TrailConfig> = {}): [Texture, (ThreeEvent) => void] {
  const { size, maxAge, radius, intensity, interpolate, smoothing, minForce, blend, ease } = config
  const trail = useMemo(
    () => new TrailTextureImpl(config),
    [size, maxAge, radius, intensity, interpolate, smoothing, minForce, blend, ease]
  )
  useFrame((_, delta) => void trail.update(delta))
  const onMove = useCallback((e: ThreeEvent<PointerEvent>) => trail.addTouch(e.uv), [trail])
  return [trail.texture, onMove]
}

//

export type TrailTextureProps = {
  children?: (texture: ReturnType<typeof useTrailTexture>) => React.ReactNode
} & TrailConfig

export const TrailTexture = ({ children, ...config }: TrailTextureProps) => {
  const ret = useTrailTexture(config)

  return <>{children?.(ret)}</>
}
