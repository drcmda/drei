import * as THREE from 'three'

/**
 * Sets `BufferAttribute.updateRange` since r159.
 */
export const setUpdateRange = (
  attribute: THREE.BufferAttribute,
  updateRange: { start: number; count: number }
): void => {
  attribute.updateRanges[0] = updateRange
}
