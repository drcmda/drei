// this hook wraps a gltf and allows the use of the khr variants extension

import { useMemo, useState, useEffect, useCallback } from 'react'
import type { Material, Mesh } from 'three'
import type { GLTF } from 'three-stdlib'

export const useVariants = (model: GLTF, inVariant?: string) => {
  // states
  const [activeVariant, setActiveVariant] = useState<string | null>(null)
  const [materials, setMaterials] = useState<Material[]>([])

  // On load handler
  useEffect(() => {
    // get the materials from the model
    model.parser.getDependencies('material').then((materials) => {
      setMaterials(materials)
    })
  }, [model])

  const variants = useMemo(() => {
    return model.userData.gltfExtensions?.KHR_materials_variants?.variants
  }, [model])

  // use the parser to apply the variant to the model
  const applyVariant = useCallback(
    (variantIndex) => {
      model.scene.traverse(async (object) => {
        if (!('isMesh' in object) || !object.userData.gltfExtensions) return
        const meshObject = object as Mesh
        const meshVariantDef = meshObject.userData.gltfExtensions.KHR_materials_variants

        if (!meshVariantDef) return

        // when this first runs we want to set the original material
        if (!meshObject.userData.originalMaterial) meshObject.userData.originalMaterial = meshObject.material

        const mapping = meshVariantDef.mappings.find((mapping) => mapping.variants.includes(variantIndex))

        if (mapping) {
          meshObject.material = await model.parser.getDependency('material', mapping.material)
          model.parser.assignFinalMaterial(meshObject)
        } else meshObject.material = meshObject.userData.originalMaterial
        // mark the material for update
        if (Array.isArray(meshObject.material)) for (const mat of meshObject.material) mat.needsUpdate = true
        else meshObject.material.needsUpdate = true
      })
    },
    [model]
  )

  // set the active variant, block if non existent
  const setVariant = useCallback(
    (variantName: string | null) => {
      // check if the variant is in the variants array and set it accordingly
      if (!variants) return
      const newVariant = variantName && variants.some((v) => v.name === variantName) ? variantName : null
      setActiveVariant(newVariant)
    },
    [variants]
  )

  // if the variants or active variant change, apply the variant
  useEffect(() => {
    if (!variants) return
    const variantIndex = variants.findIndex((v) => v.name === activeVariant)
    applyVariant(variantIndex > -1 ? variantIndex : 0)
  }, [variants, activeVariant, applyVariant])

  // take in variant as an option and set it accordingly
  useEffect(() => {
    setVariant(inVariant)
  }, [inVariant, setVariant])

  return { variants, activeVariant, setVariant, materials }
}
