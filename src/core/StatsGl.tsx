import { ForwardRefComponent } from '../helpers/ts-utils'
import { addAfterEffect, useThree } from '@react-three/fiber'
import * as React from 'react'

import Stats from 'stats-gl'

type StatsOptions = ConstructorParameters<typeof Stats>[0]

export type StatsGlProps = Partial<StatsOptions> & {
  id?: string
  clearStatsGlStyle?: boolean
  showPanel?: number
  className?: string
  parent?: React.RefObject<HTMLElement>
  ref?: React.RefObject<HTMLElement>
}

export const StatsGl: ForwardRefComponent<StatsGlProps, HTMLDivElement> = /* @__PURE__ */ React.forwardRef(
  function StatsGl({ className, parent, id, clearStatsGlStyle, ...props }, fref) {
    const gl = useThree((state) => state.gl)

    const stats = React.useMemo(() => {
      const stats = new Stats({
        ...props,
      })
      stats.init(gl)
      return stats
    }, [gl])

    React.useImperativeHandle(fref, () => stats.domElement, [stats])

    React.useEffect(() => {
      if (stats) {
        const node = (parent && parent.current) || document.body
        node?.appendChild(stats.domElement)
        stats.domElement.querySelectorAll('canvas').forEach((canvas) => {
          canvas.style.removeProperty('position')
        })
        if (id) stats.domElement.id = id
        if (clearStatsGlStyle) stats.domElement.removeAttribute('style')
        stats.domElement.removeAttribute('style')
        const classNames = (className ?? '').split(' ').filter((cls) => cls)
        if (classNames.length) stats.domElement.classList.add(...classNames)
        const end = addAfterEffect(() => stats.update())
        return () => {
          if (classNames.length) stats.domElement.classList.remove(...classNames)
          node?.removeChild(stats.domElement)
          end()
        }
      }
    }, [parent, stats, className, id, clearStatsGlStyle])

    return null
  }
)
