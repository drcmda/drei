import * as React from 'react'
import { getGPUTier, GetGPUTier } from 'detect-gpu'
import { suspend } from 'suspend-react'

export const useDetectGPU = (props?: GetGPUTier) => suspend(() => getGPUTier(props), ['useDetectGPU'])

export type DetectGPUProps = {
  children?: (result: ReturnType<typeof useDetectGPU>) => React.ReactNode
} & Parameters<typeof useDetectGPU>[0]

export function DetectGPU({ children, ...options }: DetectGPUProps) {
  const result = useDetectGPU(options)

  return <>{children?.(result)}</>
}
