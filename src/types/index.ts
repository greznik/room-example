import type * as THREE from 'three'

export interface Boundary {
  minX: number
  maxX: number
}

export interface AnimationNames {
  idle: string
  walk: string
}

export interface CharacterConfig {
  id: string
  name: string
  modelPath: string
  speed: number
  animations: AnimationNames
}

export interface RoomConfig {
  id: number
  modelPath: string
  slots: string[]
  boundary: Boundary
}

export interface ItemConfig {
  id: string
  modelPath: string
}

export interface SlotDescriptor {
  name: string
  anchor: THREE.Object3D
}

export interface LoadProgress {
  loaded: number
  label: string
  elapsedTime: number
}

export type LoadProgressCallback = (p: LoadProgress) => void
