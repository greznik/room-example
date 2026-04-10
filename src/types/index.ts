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

export interface RoomConfig {
  id: number;
  modelPath: string;
  assignments: SlotAssignment[]; // слоты + что в них стоит
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
