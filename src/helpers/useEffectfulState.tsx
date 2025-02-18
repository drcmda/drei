import * as React from 'react'

type RefType<T> = React.RefObject<T> | ((state: T) => void)

function call<T>(ref: RefType<T> | undefined, value: T | null) {
  if (typeof ref === 'function') ref(value as T)
  else if (ref != null) ref.current = value as T
}

export function useEffectfulState<T>(fn: () => T, deps: React.DependencyList = [], cb?: RefType<T>) {
  const [state, set] = React.useState<T>()
  React.useLayoutEffect(() => {
    const value = fn()
    set(value)
    call(cb, value)
    return () => call(cb, null)
  }, deps)
  return state
}
