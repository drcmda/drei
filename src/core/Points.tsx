import * as THREE from 'three'
import * as React from 'react'
import { extend, useFrame } from '@react-three/fiber'
import mergeRefs from 'react-merge-refs'
import { Position } from '../helpers/Position'

type Api = {
  subscribe: (ref) => void
}

type PointsProps = JSX.IntrinsicElements['points'] & {
  range?: number
  limit?: number
  attributes?: JSX.IntrinsicElements['bufferAttribute'][]
}

let i, positionRef
const context = React.createContext<Api>(null!)
const parentMatrix = new THREE.Matrix4()
const position = new THREE.Vector3()
const color = new THREE.Color()

const Points = React.forwardRef(
  (
    { children, range, limit = 1000, attributes = [], ...props }: PointsProps,
    ref: React.ForwardedRef<THREE.Points>
  ) => {
    const parentRef = React.useRef<THREE.Points>(null!)
    const [refs, setRefs] = React.useState<React.MutableRefObject<Position>[]>([])
    const [[positions, colors]] = React.useState(() => [
      new Float32Array(limit * 3),
      new Float32Array([...new Array(limit * 3)].map(() => 1)),
    ])

    React.useLayoutEffect(() => {
      parentRef.current.geometry.drawRange.count = Math.min(limit, range !== undefined ? range : limit, refs.length)
    }, [refs, range])

    React.useEffect(() => {
      // We might be a frame too late? 🤷‍♂️
      parentRef.current.geometry.attributes.position.needsUpdate = true
    })

    useFrame(() => {
      parentRef.current.updateMatrix()
      parentRef.current.updateMatrixWorld()
      parentMatrix.copy(parentRef.current.matrixWorld).invert()
      for (i = 0; i < refs.length; i++) {
        positionRef = refs[i].current
        positionRef.getWorldPosition(position).applyMatrix4(parentMatrix)
        if (
          position.x !== positions[i * 3] ||
          position.y !== positions[i * 3 + 1] ||
          position.z !== positions[i * 3 + 2]
        ) {
          position.toArray(positions, i * 3)
          parentRef.current.geometry.attributes.position.needsUpdate = true
          positionRef.matrixWorldNeedsUpdate = true
        }
        if (!positionRef.color.equals(color.fromArray(colors, i * 3))) {
          positionRef.color.toArray(colors, i * 3)
          parentRef.current.geometry.attributes.color.needsUpdate = true
        }
      }
    })

    const events = React.useMemo(() => {
      const events = {}
      for (i = 0; i < refs.length; i++) Object.assign(events, (refs[i].current as any)?.__r3f.handlers)
      return Object.keys(events).reduce(
        (prev, key) => ({
          ...prev,
          [key]: (event) => {
            const object = refs[event.index]?.current
            return (object as any)?.__r3f?.handlers?.[key]({ ...event, object })
          },
        }),
        {}
      )
    }, [children, refs])

    const api: Api = React.useMemo(
      () => ({
        subscribe: (ref) => {
          setRefs((refs) => [...refs, ref])
          return () => setRefs((refs) => refs.filter((item) => item.current !== ref.current))
        },
      }),
      []
    )

    return (
      <points matrixAutoUpdate={false} ref={mergeRefs([ref, parentRef])} {...events} {...props}>
        <bufferGeometry>
          <bufferAttribute
            attachObject={['attributes', 'position']}
            count={positions.length / 3}
            array={positions}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
          <bufferAttribute
            attachObject={['attributes', 'color']}
            count={colors.length / 3}
            array={colors}
            itemSize={3}
            usage={THREE.DynamicDrawUsage}
          />
          {attributes}
        </bufferGeometry>
        <context.Provider value={api}>{children}</context.Provider>
      </points>
    )
  }
)

const Point = React.forwardRef(({ children, ...props }, ref) => {
  React.useMemo(() => extend({ Position }), [])
  const group = React.useRef()
  const { subscribe } = React.useContext(context)
  React.useLayoutEffect(() => subscribe(group), [])
  return (
    <position ref={mergeRefs([ref, group])} {...props}>
      {children}
    </position>
  )
})

export { Points, Point }
