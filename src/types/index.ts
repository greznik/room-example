import type * as THREE from 'three';

// ─────────────────────────────────────────────
// Config types
// ─────────────────────────────────────────────

export interface RoomConfig {
  /** Unique numeric ID (1–20) */
  id: number;
  /** Path relative to /public */
  modelPath: string;
  /** Named slots inside the GLTF scene that accept items */
  slots: string[];
}

export interface ItemConfig {
  id: string;
  modelPath: string;
  /** Optional uniform scale override */
  scale?: number;
}

// ─────────────────────────────────────────────
// Runtime types
// ─────────────────────────────────────────────

export interface SlotDescriptor {
  name: string;
  /** The Object3D found inside the room's scene graph */
  anchor: THREE.Object3D;
}

export interface LoadProgress {
  loaded: number;  // 0–1
  label: string;
}

export type LoadProgressCallback = (p: LoadProgress) => void;