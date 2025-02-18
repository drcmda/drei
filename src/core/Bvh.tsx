import { ThreeElements, useThree } from '@react-three/fiber'
import * as React from 'react'
import { Mesh, Group } from 'three'
import { acceleratedRaycast, computeBoundsTree, disposeBoundsTree, SAH, SplitStrategy } from 'three-mesh-bvh'
import { ForwardRefComponent } from '../helpers/ts-utils'

export interface BVHOptions {
  /** Split strategy, default: SAH (slowest to construct, fastest runtime, least memory) */
  strategy?: SplitStrategy
  /** Print out warnings encountered during tree construction, default: false */
  verbose?: boolean
  /** If true then the bounding box for the geometry is set once the BVH has been constructed, default: true */
  setBoundingBox?: boolean
  /** The maximum depth to allow the tree to build to, default: 40 */
  maxDepth?: number
  /** The number of triangles to aim for in a leaf node, default: 10 */
  maxLeafTris?: number

  /** If false then an index buffer is created if it does not exist and is rearranged */
  /** to hold the bvh structure. If false then a separate buffer is created to store the */
  /** structure and the index buffer (or lack thereof) is retained. This can be used */
  /** when the existing index layout is important or groups are being used so a */
  /** single BVH hierarchy can be created to improve performance. */
  /** default: false */
  /** Note: This setting is experimental */
  indirect?: boolean
}

export type BvhProps = BVHOptions &
  ThreeElements['group'] & {
    /**Enabled, default: true */
    enabled?: boolean
    /** Use .raycastFirst to retrieve hits which is generally faster, default: false */
    firstHitOnly?: boolean
  }

const isMesh = (child: any): child is Mesh => child.isMesh

/**
 * @deprecated Use the Bvh component instead
 */
export function useBVH(mesh: React.RefObject<Mesh | undefined>, options?: BVHOptions) {
  options = {
    strategy: SAH,
    verbose: false,
    setBoundingBox: true,
    maxDepth: 40,
    maxLeafTris: 10,
    indirect: false,
    ...options,
  }
  React.useEffect(() => {
    if (mesh.current) {
      mesh.current.raycast = acceleratedRaycast
      const geometry: any = mesh.current.geometry
      geometry.computeBoundsTree = computeBoundsTree
      geometry.disposeBoundsTree = disposeBoundsTree
      geometry.computeBoundsTree(options)

      return () => {
        if (geometry.boundsTree) {
          geometry.disposeBoundsTree()
        }
      }
    }
  }, [mesh, JSON.stringify(options)])
}

export const Bvh: ForwardRefComponent<BvhProps, Group> = /* @__PURE__ */ React.forwardRef(
  (
    {
      enabled = true,
      firstHitOnly = false,
      children,
      strategy = SAH,
      verbose = false,
      setBoundingBox = true,
      maxDepth = 40,
      maxLeafTris = 10,
      indirect = false,
      ...props
    }: BvhProps,
    fref
  ) => {
    const ref = React.useRef<Group>(null!)

    const raycaster = useThree((state) => state.raycaster)
    React.useImperativeHandle(fref, () => ref.current, [])

    React.useEffect(() => {
      if (enabled) {
        const options = { strategy, verbose, setBoundingBox, maxDepth, maxLeafTris, indirect }
        const group = ref.current
        // This can only safely work if the component is used once, but there is no alternative.
        // Hijacking the raycast method to do it for individual meshes is not an option as it would
        // cost too much memory ...
        raycaster.firstHitOnly = firstHitOnly
        group.traverse((child) => {
          // Only include meshes that do not yet have a boundsTree and whose raycast is standard issue
          if (isMesh(child) && !child.geometry.boundsTree && child.raycast === Mesh.prototype.raycast) {
            child.raycast = acceleratedRaycast
            child.geometry.computeBoundsTree = computeBoundsTree
            child.geometry.disposeBoundsTree = disposeBoundsTree
            child.geometry.computeBoundsTree(options)
          }
        })
        return () => {
          delete raycaster.firstHitOnly
          group.traverse((child) => {
            if (isMesh(child) && child.geometry.boundsTree) {
              child.geometry.disposeBoundsTree()
              child.raycast = Mesh.prototype.raycast
            }
          })
        }
      }
    }, [])

    return (
      <group ref={ref} {...props}>
        {children}
      </group>
    )
  }
)
