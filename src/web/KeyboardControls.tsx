import * as React from 'react'
import { create, StoreApi, UseBoundStore } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

// These are removed in Zustand v4
type State = object // unknown
type StateSelector<T extends State, U> = (state: T) => U
type EqualityChecker<T> = (state: T, newState: T) => boolean
type StateListener<T> = (state: T, previousState: T) => void

// Zustand v3 marked deprecations in 3.x, but there's no visible upgrade path
type StoreApiWithSubscribeWithSelector<T extends State> = Omit<StoreApi<T>, 'subscribe'> & {
  subscribe: {
    (listener: StateListener<T>): () => void
    <StateSlice>(
      selector: StateSelector<T, StateSlice>,
      listener: StateListener<StateSlice>,
      options?: {
        equalityFn?: EqualityChecker<StateSlice>
        fireImmediately?: boolean
      }
    ): () => void
  }
}

type KeyboardControlsState<T extends string = string> = { [K in T]: boolean }

export type KeyboardControlsEntry<T extends string = string> = {
  /** Name of the action */
  name: T
  /** The keys that define it, you can use either event.key, or event.code */
  keys: string[]
  /** If the event receives the keyup event, true by default */
  up?: boolean
}

export type KeyboardControlsProps = {
  /** A map of named keys */
  map: KeyboardControlsEntry[]
  /** All children will be able to useKeyboardControls */
  children: React.ReactNode
  /** Optional onchange event */
  onChange?: (name: string, pressed: boolean, state: KeyboardControlsState) => void
  /** Optional event source */
  domElement?: HTMLElement
}

type KeyboardControlsApi<T extends string = string> = [
  StoreApiWithSubscribeWithSelector<KeyboardControlsState<T>>['subscribe'],
  StoreApiWithSubscribeWithSelector<KeyboardControlsState<T>>['getState'],
  UseBoundStore<StoreApi<KeyboardControlsState<T>>>,
]

const context = /* @__PURE__ */ React.createContext<KeyboardControlsApi>(null!)

export function KeyboardControls({ map, children, onChange, domElement }: KeyboardControlsProps) {
  const key = map.map((item) => item.name + item.keys).join('-')
  const useControls = React.useMemo(() => {
    return create(
      subscribeWithSelector(() =>
        map.reduce((prev, cur) => ({ ...prev, [cur.name]: false }), {} as KeyboardControlsState)
      )
    )
  }, [key])
  const api: KeyboardControlsApi = React.useMemo(
    () => [useControls.subscribe, useControls.getState, useControls],
    [key]
  )
  const set = useControls.setState

  React.useEffect(() => {
    const config = map.map(({ name, keys, up }) => ({
      keys,
      up,
      fn: (value) => {
        // Set zustand state
        set({ [name]: value })
        // Inform callback
        if (onChange) onChange(name, value, api[1]())
      },
    }))
    const keyMap = config.reduce((out, { keys, fn, up = true }) => {
      keys.forEach((key) => (out[key] = { fn, pressed: false, up }))
      return out
    }, {})

    const downHandler = ({ key, code }: KeyboardEvent) => {
      const obj = keyMap[key] || keyMap[code]
      if (!obj) return
      const { fn, pressed, up } = obj
      obj.pressed = true
      if (up || !pressed) fn(true)
    }

    const upHandler = ({ key, code }: KeyboardEvent) => {
      const obj = keyMap[key] || keyMap[code]
      if (!obj) return
      const { fn, up } = obj
      obj.pressed = false
      if (up) fn(false)
    }

    const source = domElement || window
    source.addEventListener('keydown', downHandler as EventListenerOrEventListenerObject, { passive: true })
    source.addEventListener('keyup', upHandler as EventListenerOrEventListenerObject, { passive: true })

    return () => {
      source.removeEventListener('keydown', downHandler as EventListenerOrEventListenerObject)
      source.removeEventListener('keyup', upHandler as EventListenerOrEventListenerObject)
    }
  }, [domElement, key])

  return <context.Provider value={api} children={children} />
}

type Selector<T extends string = string> = (state: KeyboardControlsState<T>) => boolean

export function useKeyboardControls<T extends string = string>(): [
  StoreApiWithSubscribeWithSelector<KeyboardControlsState<T>>['subscribe'],
  StoreApiWithSubscribeWithSelector<KeyboardControlsState<T>>['getState'],
]
export function useKeyboardControls<T extends string = string>(sel: Selector<T>): ReturnType<Selector<T>>
export function useKeyboardControls<T extends string = string>(
  sel?: Selector<T>
):
  | ReturnType<Selector<T>>
  | [
      StoreApiWithSubscribeWithSelector<KeyboardControlsState<T>>['subscribe'],
      StoreApiWithSubscribeWithSelector<KeyboardControlsState<T>>['getState'],
    ] {
  const [sub, get, store] = React.useContext<KeyboardControlsApi<T>>(context)
  if (sel) return store(sel)
  else return [sub, get]
}
