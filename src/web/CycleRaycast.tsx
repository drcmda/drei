import * as React from 'react'
import * as THREE from 'three'
import { useThree } from '@react-three/fiber'

export type CycleRaycastProps = {
  onChanged?: (hits: THREE.Intersection[], cycle: number) => null
  preventDefault?: boolean
  scroll?: boolean
  keyCode?: number
  portal?: React.RefObject<HTMLElement>
}

export function CycleRaycast({
  onChanged,
  portal,
  preventDefault = true,
  scroll = true,
  keyCode = 9,
}: CycleRaycastProps) {
  const cycle = React.useRef(0)
  const setEvents = useThree((state) => state.setEvents)
  const get = useThree((state) => state.get)
  const gl = useThree((state) => state.gl)

  React.useEffect(() => {
    let hits: THREE.Intersection[] = []
    let lastEvent: PointerEvent = undefined!
    const prev = get().events.filter
    const target = portal?.current ?? gl.domElement.parentNode

    // Render custom status
    const renderStatus = () => target && onChanged && onChanged(hits, Math.round(cycle.current) % hits.length)

    // Overwrite the raycasters custom filter (this only exists in r3f)
    setEvents({
      filter: (intersections, state) => {
        // Reset cycle when the intersections change
        let clone = [...intersections]
        if (
          clone.length !== hits.length ||
          !hits.every((hit) => clone.map((e) => e.object.uuid).includes(hit.object.uuid))
        ) {
          cycle.current = 0
          hits = clone
          renderStatus()
        }
        // Run custom filter if there is one
        if (prev) clone = prev(clone, state)
        // Cycle through the actual raycast intersects
        for (let i = 0; i < Math.round(cycle.current) % clone.length; i++) {
          const first = clone.shift() as THREE.Intersection
          clone = [...clone, first]
        }
        return clone
      },
    })

    // Cycle, refresh events and render status
    const refresh = (fn) => {
      cycle.current = fn(cycle.current)
      // Cancel hovered elements and fake a pointer-move
      get().events.handlers?.onPointerCancel(undefined as any)
      get().events.handlers?.onPointerMove(lastEvent)
      renderStatus()
    }

    // Key events
    const tabEvent = (event: KeyboardEvent) => {
      if ((event.keyCode || event.which) === keyCode) {
        if (preventDefault) event.preventDefault()
        if (hits.length > 1) refresh((current) => current + 1)
      }
    }

    // Wheel events
    const wheelEvent = (event: WheelEvent) => {
      if (preventDefault) event.preventDefault()
      let delta = 0
      if (!event) event = window.event as WheelEvent
      if ((event as any).wheelDelta) delta = (event as any).wheelDelta / 120
      else if (event.detail) delta = -event.detail / 3
      if (hits.length > 1) refresh((current) => Math.abs(current - delta))
    }

    // Catch last move event and position custom status
    const moveEvent = (event: PointerEvent) => (lastEvent = event)

    document.addEventListener('pointermove', moveEvent, { passive: true })
    if (scroll) document.addEventListener('wheel', wheelEvent)
    if (keyCode !== undefined) document.addEventListener('keydown', tabEvent)

    return () => {
      // Clean up
      setEvents({ filter: prev })
      if (keyCode !== undefined) document.removeEventListener('keydown', tabEvent)
      if (scroll) document.removeEventListener('wheel', wheelEvent)
      document.removeEventListener('pointermove', moveEvent)
    }
  }, [gl, get, setEvents, preventDefault, scroll, keyCode])
  return null
}
