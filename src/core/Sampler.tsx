import * as React from 'react'

import { MeshSurfaceSampler } from 'three-stdlib'

import { Color, Group, InstancedBufferAttribute, InstancedMesh, Mesh, Object3D, Vector3 } from 'three'
import { ThreeElements } from '@react-three/fiber'

type SamplePayload = {
  /**
   * The position of the sample.
   */
  position: Vector3
  /**
   * The normal of the mesh at the sampled position.
   */
  normal: Vector3
  /**
   * The vertex color of the mesh at the sampled position.
   */
  color: Color
}

export type TransformFn = (payload: TransformPayload, i: number) => void

type TransformPayload = SamplePayload & {
  /**
   * The dummy object used to transform each instance.
   * This object's matrix will be updated after transforming & it will be used
   * to set the instance's matrix.
   */
  dummy: Object3D
  /**
   * The mesh that's initially passed to the sampler.
   * Use this if you need to apply transforms from your mesh to your instances
   * or if you need to grab attributes from the geometry.
   */
  sampledMesh: Mesh
}

export type SamplerProps = Omit<ThreeElements['group'], 'ref'> & {
  /**
   * The mesh that will be used to sample.
   * Does not need to be in the scene graph.
   */
  mesh?: React.RefObject<Mesh>
  /**
   * The InstancedMesh that will be controlled by the component.
   * This InstancedMesh's count value will determine how many samples are taken.
   *
   * @see Props.transform to see how to apply transformations to your instances based on the samples.
   *
   */
  instances?: React.RefObject<InstancedMesh>
  /**
   * The NAME of the weight attribute to use when sampling.
   *
   * @see https://threejs.org/docs/#examples/en/math/MeshSurfaceSampler.setWeightAttribute
   */
  weight?: string
  /**
   * Transformation to be applied to each instance.
   * Receives a dummy object3D with all the sampled data ( @see TransformPayload ).
   * It should mutate `transformPayload.dummy`.
   *
   * @see ( @todo add link to example )
   *
   * There is no need to update the dummy's matrix
   */
  transform?: TransformFn

  count?: number
}

export interface useSurfaceSamplerProps {
  transform?: TransformFn
  weight?: string
  count?: number
}

export function useSurfaceSampler(
  mesh: React.RefObject<Mesh>,
  count: number = 16,
  transform?: TransformFn,
  weight?: string,
  instanceMesh?: React.RefObject<InstancedMesh> | null
) {
  const [buffer, setBuffer] = React.useState<InstancedBufferAttribute>(() => {
    const arr = Array.from({ length: count }, () => [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1]).flat()
    return new InstancedBufferAttribute(Float32Array.from(arr), 16)
  })

  React.useLayoutEffect(() => {
    if (typeof mesh.current === 'undefined') return

    const sampler = new MeshSurfaceSampler(mesh.current)

    if (weight) {
      sampler.setWeightAttribute(weight)
    }

    sampler.build()

    const position = new Vector3()
    const normal = new Vector3()
    const color = new Color()
    const dummy = new Object3D()

    mesh.current.updateMatrixWorld(true)

    for (let i = 0; i < count; i++) {
      sampler.sample(position, normal, color)

      if (typeof transform === 'function') {
        transform(
          {
            dummy,
            sampledMesh: mesh.current,
            position,
            normal,
            color,
          },
          i
        )
      } else {
        dummy.position.copy(position)
      }

      dummy.updateMatrix()

      if (instanceMesh?.current) {
        instanceMesh.current.setMatrixAt(i, dummy.matrix)
      }

      dummy.matrix.toArray(buffer.array, i * 16)
    }

    if (instanceMesh?.current) {
      instanceMesh.current.instanceMatrix.needsUpdate = true
    }

    buffer.needsUpdate = true

    setBuffer(new InstancedBufferAttribute(buffer.array, buffer.itemSize).copy(buffer))
  }, [mesh, instanceMesh, weight, count, transform])

  return buffer
}

export function Sampler({ children, weight, transform, instances, mesh, count = 16, ...props }: SamplerProps) {
  const group = React.useRef<Group>(null!)
  const instancedRef = React.useRef<InstancedMesh>(null!)
  const meshToSampleRef = React.useRef<Mesh>(null!)

  React.useLayoutEffect(() => {
    instancedRef.current =
      instances?.current ?? (group.current!.children.find((c) => c.hasOwnProperty('instanceMatrix')) as InstancedMesh)

    meshToSampleRef.current = mesh?.current ?? (group.current!.children.find((c) => c.type === 'Mesh') as Mesh)
  }, [children, mesh?.current, instances?.current])

  useSurfaceSampler(meshToSampleRef, count, transform, weight, instancedRef)

  return (
    <group ref={group} {...props}>
      {children}
    </group>
  )
}
