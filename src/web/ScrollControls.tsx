import * as THREE from 'three'
import * as React from 'react'
import * as ReactDOM from 'react-dom/client'
import { context as fiberContext, RootState, useFrame, useThree } from '@react-three/fiber'
import { DomEvent } from '@react-three/fiber/dist/declarations/src/core/events'
import { easing } from 'maath'
import { ForwardRefComponent } from '../helpers/ts-utils'

export type ScrollControlsProps = {
  /** Precision, default 0.00001 */
  eps?: number
  /** Horizontal scroll, default false (vertical) */
  horizontal?: boolean
  /** Infinite scroll, default false (experimental!) */
  infinite?: boolean
  /** Defines the lenght of the scroll area, each page is height:100%, default 1 */
  pages?: number
  /** A factor that increases scroll bar travel,default: 1 */
  distance?: number
  /** Friction in seconds, default: 0.25 (1/4 second) */
  damping?: number
  /** maxSpeed optionally allows you to clamp the maximum speed. If damping is 0.2s and looks OK
   *  going between, say, page 1 and 2, but not for pages far apart as it'll move very rapid,
   *  then a maxSpeed of e.g. 3 which will clamp the speed to 3 units per second, it may now
   *  take much longer than damping to reach the target if it is far away. Default: Infinity */
  maxSpeed?: number
  /** If true attaches the scroll container before the canvas */
  prepend?: boolean
  enabled?: boolean
  style?: React.CSSProperties
  children: React.ReactNode
}

export type ScrollControlsState = {
  el: HTMLDivElement
  eps: number
  fill: HTMLDivElement
  fixed: HTMLDivElement
  horizontal: boolean | undefined
  damping: number
  offset: number
  delta: number
  pages: number
  range(from: number, distance: number, margin?: number): number
  curve(from: number, distance: number, margin?: number): number
  visible(from: number, distance: number, margin?: number): boolean
}

const context = /* @__PURE__ */ React.createContext<ScrollControlsState>(null!)

export function useScroll() {
  return React.useContext(context)
}

export function ScrollControls({
  eps = 0.00001,
  enabled = true,
  infinite,
  horizontal,
  pages = 1,
  distance = 1,
  damping = 0.25,
  maxSpeed = Infinity,
  prepend = false,
  style = {},
  children,
}: ScrollControlsProps) {
  const { get, setEvents, gl, size, invalidate, events } = useThree()
  const [el] = React.useState(() => document.createElement('div'))
  const [fill] = React.useState(() => document.createElement('div'))
  const [fixed] = React.useState(() => document.createElement('div'))
  const target = gl.domElement.parentNode! as HTMLElement
  const scroll = React.useRef(0)

  const state = React.useMemo(() => {
    const state = {
      el,
      eps,
      fill,
      fixed,
      horizontal,
      damping,
      offset: 0,
      delta: 0,
      scroll,
      pages,
      // 0-1 for a range between from -> from + distance
      range(from: number, distance: number, margin: number = 0) {
        const start = from - margin
        const end = start + distance + margin * 2
        return this.offset < start ? 0 : this.offset > end ? 1 : (this.offset - start) / (end - start)
      },
      // 0-1-0 for a range between from -> from + distance
      curve(from: number, distance: number, margin: number = 0) {
        return Math.sin(this.range(from, distance, margin) * Math.PI)
      },
      // true/false for a range between from -> from + distance
      visible(from: number, distance: number, margin: number = 0) {
        const start = from - margin
        const end = start + distance + margin * 2
        return this.offset >= start && this.offset <= end
      },
    }
    return state
  }, [eps, damping, horizontal, pages])

  React.useEffect(() => {
    el.style.position = 'absolute'
    el.style.width = '100%'
    el.style.height = '100%'
    el.style[horizontal ? 'overflowX' : 'overflowY'] = 'auto'
    el.style[horizontal ? 'overflowY' : 'overflowX'] = 'hidden'
    el.style.top = '0px'
    el.style.left = '0px'

    for (const key in style) {
      el.style[key] = style[key]
    }

    fixed.style.position = 'sticky'
    fixed.style.top = '0px'
    fixed.style.left = '0px'
    fixed.style.width = '100%'
    fixed.style.height = '100%'
    fixed.style.overflow = 'hidden'
    el.appendChild(fixed)

    fill.style.height = horizontal ? '100%' : `${pages * distance * 100}%`
    fill.style.width = horizontal ? `${pages * distance * 100}%` : '100%'
    fill.style.pointerEvents = 'none'
    el.appendChild(fill)

    if (prepend) target.prepend(el)
    else target.appendChild(el)

    // Init scroll one pixel in to allow upward/leftward scroll
    el[horizontal ? 'scrollLeft' : 'scrollTop'] = 1

    const oldTarget = (events.connected || gl.domElement) as HTMLElement
    requestAnimationFrame(() => events.connect?.(el))
    const oldCompute = get().events.compute
    setEvents({
      compute(event: DomEvent, state: RootState) {
        // we are using boundingClientRect because we could not rely on target.offsetTop as canvas could be positioned anywhere in dom
        const { left, top } = target.getBoundingClientRect()
        const offsetX = event.clientX - left
        const offsetY = event.clientY - top
        state.pointer.set((offsetX / state.size.width) * 2 - 1, -(offsetY / state.size.height) * 2 + 1)
        state.raycaster.setFromCamera(state.pointer, state.camera)
      },
    })

    return () => {
      target.removeChild(el)
      setEvents({ compute: oldCompute })
      events.connect?.(oldTarget)
    }
  }, [pages, distance, horizontal, el, fill, fixed, target])

  React.useEffect(() => {
    if (events.connected === el) {
      const containerLength = size[horizontal ? 'width' : 'height']
      const scrollLength = el[horizontal ? 'scrollWidth' : 'scrollHeight']
      const scrollThreshold = scrollLength - containerLength

      let current = 0
      let disableScroll = true
      let firstRun = true

      const onScroll = () => {
        // Prevent first scroll because it is indirectly caused by the one pixel offset
        if (!enabled || firstRun) return
        invalidate()
        current = el[horizontal ? 'scrollLeft' : 'scrollTop']
        scroll.current = current / scrollThreshold

        if (infinite) {
          if (!disableScroll) {
            if (current >= scrollThreshold) {
              const damp = 1 - state.offset
              el[horizontal ? 'scrollLeft' : 'scrollTop'] = 1
              scroll.current = state.offset = -damp
              disableScroll = true
            } else if (current <= 0) {
              const damp = 1 + state.offset
              el[horizontal ? 'scrollLeft' : 'scrollTop'] = scrollLength
              scroll.current = state.offset = damp
              disableScroll = true
            }
          }
          if (disableScroll) setTimeout(() => (disableScroll = false), 40)
        }
      }
      el.addEventListener('scroll', onScroll, { passive: true })
      requestAnimationFrame(() => (firstRun = false))

      const onWheel = (e) => (el.scrollLeft += e.deltaY / 2)
      if (horizontal) el.addEventListener('wheel', onWheel, { passive: true })

      return () => {
        el.removeEventListener('scroll', onScroll)
        if (horizontal) el.removeEventListener('wheel', onWheel)
      }
    }
  }, [el, events, size, infinite, state, invalidate, horizontal, enabled])

  let last = 0
  useFrame((_, delta) => {
    last = state.offset
    easing.damp(state, 'offset', scroll.current, damping, delta, maxSpeed, undefined, eps)
    easing.damp(state, 'delta', Math.abs(last - state.offset), damping, delta, maxSpeed, undefined, eps)
    if (state.delta > eps) invalidate()
  })
  return <context.Provider value={state}>{children}</context.Provider>
}

const ScrollCanvas = /* @__PURE__ */ React.forwardRef(
  ({ children }: ScrollProps, ref: React.ForwardedRef<THREE.Group>) => {
    const group = React.useRef<THREE.Group>(null!)
    React.useImperativeHandle(ref, () => group.current, [])
    const state = useScroll()
    const { width, height } = useThree((state) => state.viewport)
    useFrame(() => {
      group.current.position.x = state.horizontal ? -width * (state.pages - 1) * state.offset : 0
      group.current.position.y = state.horizontal ? 0 : height * (state.pages - 1) * state.offset
    })
    return <group ref={group}>{children}</group>
  }
)

const ScrollHtml: ForwardRefComponent<{ children?: React.ReactNode; style?: React.CSSProperties }, HTMLDivElement> =
  React.forwardRef(
    ({ children, style, ...props }: { children?: React.ReactNode; style?: React.CSSProperties }, ref) => {
      const state = useScroll()
      const group = React.useRef<HTMLDivElement>(null!)
      React.useImperativeHandle(ref, () => group.current, [])
      const { width, height } = useThree((state) => state.size)
      const fiberState = React.useContext(fiberContext)
      const root = React.useMemo(() => ReactDOM.createRoot(state.fixed), [state.fixed])
      useFrame(() => {
        if (state.delta > state.eps) {
          group.current.style.transform = `translate3d(${
            state.horizontal ? -width * (state.pages - 1) * state.offset : 0
          }px,${state.horizontal ? 0 : height * (state.pages - 1) * -state.offset}px,0)`
        }
      })
      root.render(
        <div
          ref={group}
          style={{ ...style, position: 'absolute', top: 0, left: 0, willChange: 'transform' }}
          {...props}
        >
          <context.Provider value={state}>
            <fiberContext.Provider value={fiberState}>{children}</fiberContext.Provider>
          </context.Provider>
        </div>
      )
      return null
    }
  )

interface ScrollPropsWithFalseHtml {
  children?: React.ReactNode
  html?: false
  style?: never
}

interface ScrollPropsWithTrueHtml {
  children?: React.ReactNode
  html: true
  style?: React.CSSProperties
}

export type ScrollProps = ScrollPropsWithFalseHtml | ScrollPropsWithTrueHtml

export const Scroll: ForwardRefComponent<ScrollProps, THREE.Group & HTMLDivElement> = /* @__PURE__ */ React.forwardRef(
  ({ html, ...props }: ScrollProps, ref) => {
    const El = html ? ScrollHtml : ScrollCanvas
    return <El ref={ref} {...(props as ScrollProps)} />
  }
)
