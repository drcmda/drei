import * as React from 'react'
import { createContext, useContext, useRef, useState, useLayoutEffect } from 'react'
import { useFrame } from '@react-three/fiber'

type PerformanceMonitorHookApi = {
  onIncline: (api: PerformanceMonitorApi) => void
  onDecline: (api: PerformanceMonitorApi) => void
  onChange: (api: PerformanceMonitorApi) => void
  onFallback: (api: PerformanceMonitorApi) => void
}

export type PerformanceMonitorApi = {
  /** Current fps */
  fps: number
  /** Current performance factor, between 0 and 1 */
  factor: number
  /** Current highest fps, you can use this to determine device refresh rate */
  refreshrate: number
  /** Fps samples taken over time  */
  frames: number[]
  /** Averages of frames taken over n iterations   */
  averages: number[]
  index: number
  flipped: number
  fallback: boolean
  subscriptions: Map<Symbol, Partial<PerformanceMonitorHookApi>>
  subscribe: (ref: React.RefObject<Partial<PerformanceMonitorHookApi>>) => () => void
}

export type PerformanceMonitorProps = {
  /** How much time in milliseconds to collect an average fps, 250 */
  ms?: number
  /** How many interations of averages to collect, 10 */
  iterations?: number
  /** The percentage of iterations that are matched against the lower and upper bounds, 0.75 */
  threshold?: number
  /** A function that receive the max device refreshrate to determine lower and upper bounds which create a margin where neither incline nor decline should happen, (refreshrate) => (refreshrate > 90 ? [50, 90] : [50, 60]) */
  bounds?: (refreshrate: number) => [lower: number, upper: number]
  /** How many times it can inline or decline before onFallback is called, Infinity */
  flipflops?: number
  /** The factor increases and decreases between 0-1, this prop sets the starting value, 0.5 */
  factor?: number
  /** The step that gets added or subtracted to or from the factor on each incline/decline, 0.1 */
  step?: number
  /** When performance is higher than the upper bound (good!) */
  onIncline?: (api: PerformanceMonitorApi) => void
  /** When performance is lower than the upper bound (bad!) */
  onDecline?: (api: PerformanceMonitorApi) => void
  /** Incline and decline will change the factor, this will trigger when that happened */
  onChange?: (api: PerformanceMonitorApi) => void
  /** Called after when the number of flipflops is reached, it indicates instability, use the function to set a fixed baseline */
  onFallback?: (api: PerformanceMonitorApi) => void
  /** Children may use the usePerformanceMonitor hook */
  children?: React.ReactNode
}

const context = /* @__PURE__ */ createContext<PerformanceMonitorApi>(null!)

export function PerformanceMonitor({
  iterations = 10,
  ms = 250,
  threshold = 0.75,
  step = 0.1,
  factor: _factor = 0.5,
  flipflops = Infinity,
  bounds = (refreshrate) => (refreshrate > 100 ? [60, 100] : [40, 60]),
  onIncline,
  onDecline,
  onChange,
  onFallback,
  children,
}: PerformanceMonitorProps) {
  const decimalPlacesRatio = Math.pow(10, 0)
  const [api, _] = useState<PerformanceMonitorApi>(() => ({
    fps: 0,
    index: 0,
    factor: _factor,
    flipped: 0,
    refreshrate: 0,
    fallback: false,
    frames: [],
    averages: [],
    subscriptions: new Map(),
    subscribe: (ref) => {
      const key = Symbol()
      api.subscriptions.set(key, ref.current)
      return () => void api.subscriptions.delete(key)
    },
  }))

  let lastFactor = 0
  useFrame(() => {
    const { frames, averages } = api

    // If the fallback has been reached do not continue running samples
    if (api.fallback) return

    if (averages.length < iterations) {
      frames.push(performance.now())
      const msPassed = frames[frames.length - 1] - frames[0]
      if (msPassed >= ms) {
        api.fps = Math.round((frames.length / msPassed) * 1000 * decimalPlacesRatio) / decimalPlacesRatio
        api.refreshrate = Math.max(api.refreshrate, api.fps)
        averages[api.index++ % iterations] = api.fps
        if (averages.length === iterations) {
          const [lower, upper] = bounds(api.refreshrate)
          const upperBounds = averages.filter((value) => value >= upper)
          const lowerBounds = averages.filter((value) => value < lower)
          // Trigger incline when more than -threshold- avgs exceed the upper bound
          if (upperBounds.length > iterations * threshold) {
            api.factor = Math.min(1, api.factor + step)
            api.flipped++
            if (onIncline) onIncline(api)
            api.subscriptions.forEach((value) => value.onIncline && value.onIncline(api))
          }
          // Trigger decline when more than -threshold- avgs are below the lower bound
          if (lowerBounds.length > iterations * threshold) {
            api.factor = Math.max(0, api.factor - step)
            api.flipped++
            if (onDecline) onDecline(api)
            api.subscriptions.forEach((value) => value.onDecline && value.onDecline(api))
          }

          if (lastFactor !== api.factor) {
            lastFactor = api.factor
            if (onChange) onChange(api)
            api.subscriptions.forEach((value) => value.onChange && value.onChange(api))
          }

          if (api.flipped > flipflops && !api.fallback) {
            api.fallback = true
            if (onFallback) onFallback(api)
            api.subscriptions.forEach((value) => value.onFallback && value.onFallback(api))
          }
          api.averages = []

          // Resetting the refreshrate creates more problems than it solves atm
          // api.refreshrate = 0
        }
        api.frames = []
      }
    }
  })
  return <context.Provider value={api}>{children}</context.Provider>
}

export function usePerformanceMonitor({
  onIncline,
  onDecline,
  onChange,
  onFallback,
}: Partial<PerformanceMonitorHookApi>) {
  const api = useContext(context)
  const ref = useRef({ onIncline, onDecline, onChange, onFallback })
  useLayoutEffect(() => {
    ref.current.onIncline = onIncline
    ref.current.onDecline = onDecline
    ref.current.onChange = onChange
    ref.current.onFallback = onFallback
  }, [onIncline, onDecline, onChange, onFallback])
  useLayoutEffect(() => api.subscribe(ref), [api])
}
