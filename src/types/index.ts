/**
 * types/index.ts
 *
 * Базовые типы проекта.
 * Типы освещения (SpotLightDef, RoomLightingConfig и т.д.) — в config/roomsConfig.ts.
 */

import type { Object3D } from "three";

export interface Boundary {
  minX: number;
  maxX: number;
}

export interface AnimationNames {
  idle: string;
  walk: string;
}

export interface CharacterConfig {
  id: string;
  name: string;
  modelPath: string;
  speed: number;
  animations: AnimationNames;
}

export interface SlotAssignment {
  slotName: string;
  itemId: string;
}

/** Базовый конфиг комнаты без освещения. Полный конфиг — RoomFullConfig в roomsConfig.ts */
export interface RoomConfig {
  id: number;
  modelPath: string;
  assignments: SlotAssignment[];
  boundary: Boundary;
}

export interface ItemConfig {
  id: string;
  modelPath: string;
}

export interface SlotDescriptor {
  name: string;
  anchor: Object3D;
}

export interface LoadProgress {
  loaded: number;
  label: string;
  elapsedTime: number;
}

export type LoadProgressCallback = (p: LoadProgress) => void;
