import * as React from 'react'
import { addEffect, addAfterEffect } from '@react-three/fiber'
// @ts-ignore
import StatsImpl from 'stats.js'
import { useEffectfulState } from '../helpers/useEffectfulState'

export type StatsProps = {
  showPanel?: number
  className?: string
  parent?: React.RefObject<HTMLElement>
}

export function Stats({ showPanel = 0, className, parent }: StatsProps): null {
  const stats = useEffectfulState(() => new StatsImpl(), [])
  React.useEffect(() => {
    if (stats) {
      const node = (parent && parent.current) || document.body
      stats.showPanel(showPanel)
      node?.appendChild(stats.dom)
      const classNames = (className ?? '').split(' ').filter((cls) => cls)
      if (classNames.length) stats.dom.classList.add(...classNames)
      const begin = addEffect(() => stats.begin())
      const end = addAfterEffect(() => stats.end())
      return () => {
        if (classNames.length) stats.dom.classList.remove(...classNames)
        node?.removeChild(stats.dom)
        begin()
        end()
      }
    }
  }, [parent, stats, className, showPanel])
  return null
}
