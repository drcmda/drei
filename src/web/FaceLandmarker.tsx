/* eslint react-hooks/exhaustive-deps: 1 */
import * as React from 'react'
import { createContext, forwardRef, ReactNode, useContext, useEffect, useImperativeHandle } from 'react'
import type { FaceLandmarker as FaceLandmarkerImpl, FaceLandmarkerOptions } from '@mediapipe/tasks-vision'
import { clear, suspend } from 'suspend-react'

const FaceLandmarkerContext = /* @__PURE__ */ createContext({} as FaceLandmarkerImpl | undefined)

export type FaceLandmarkerProps = {
  basePath?: string
  options?: FaceLandmarkerOptions
  children?: ReactNode
}

export const FaceLandmarkerDefaults = {
  basePath: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm',
  options: {
    baseOptions: {
      modelAssetPath:
        'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
      delegate: 'GPU',
    },
    runningMode: 'VIDEO',
    outputFaceBlendshapes: true,
    outputFacialTransformationMatrixes: true,
  } as FaceLandmarkerOptions,
}

export const FaceLandmarker = forwardRef<FaceLandmarkerImpl, FaceLandmarkerProps>(
  ({ basePath = FaceLandmarkerDefaults.basePath, options = FaceLandmarkerDefaults.options, children }, fref) => {
    const opts = JSON.stringify(options)

    const faceLandmarker = suspend(async () => {
      const { FilesetResolver, FaceLandmarker } = await import('@mediapipe/tasks-vision')
      const vision = await FilesetResolver.forVisionTasks(basePath)
      return FaceLandmarker.createFromOptions(vision, options)
    }, [basePath, opts])

    useEffect(() => {
      return () => {
        faceLandmarker?.close()
        clear([basePath, opts])
      }
    }, [faceLandmarker, basePath, opts])

    useImperativeHandle(fref, () => faceLandmarker, [faceLandmarker]) // expose faceLandmarker through ref

    return <FaceLandmarkerContext.Provider value={faceLandmarker}>{children}</FaceLandmarkerContext.Provider>
  }
)

export function useFaceLandmarker() {
  return useContext(FaceLandmarkerContext)
}
