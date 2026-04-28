/**
 * gameConfig.ts
 *
 * Глобальные настройки рендерера, камеры, анимации, персонажей и предметов.
 * Конфигурация комнат (включая освещение) — в roomsConfig.ts.
 */

import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { ToneMapping } from "three";
import type { CharacterConfig, ItemConfig } from "../types";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface RendererConfig {
  toneMapping: ToneMapping;
  toneMappingExposure: number;
  outputColorSpace: typeof SRGBColorSpace;
  antialias: boolean;
  shadowMapEnabled: boolean;
  pixelRatioClamp: number;
}

export interface AnimationConfig {
  crossFadeDur: number;
  walkThreshold: number;
  rotateSpeed: number;
  decelFactor: number;
}

export interface CameraConfig {
  offset: { x: number; y: number; z: number };
  lerp: number;
  fov: { desktop: number; mobile: number };
  aspect: { min: number; max: number };
  follow: { lookAtY: number };
  zoom: { desktop: number; mobile: number };
}

export interface GameConfig {
  renderer: RendererConfig;
  animation: AnimationConfig;
  camera: CameraConfig;
  characters: CharacterConfig[];
  items: ItemConfig[];
  itemsPerRoom: number;
}

// ─── Characters ────────────────────────────────────────────────────────────────

const CHARACTERS: CharacterConfig[] = [
  {
    id: "char_1",
    name: "Кибер",
    modelPath: "/models/characters/char_1.glb",
    speed: 2.0,
    animations: { idle: "Idle", walk: "Walk" },
  },
];

// ─── Items ─────────────────────────────────────────────────────────────────────

const ITEMS: ItemConfig[] = [
  { id: "item_1", modelPath: "/models/items/1/item_1.glb" },
  { id: "item_2", modelPath: "/models/items/1/item_2.glb" },
  { id: "item_3", modelPath: "/models/items/1/item_3.glb" },
  { id: "item_4", modelPath: "/models/items/1/item_4.glb" },
  { id: "item_5", modelPath: "/models/items/1/item_5.glb" },
];

// ─── Main config ───────────────────────────────────────────────────────────────

export const GAME_CONFIG: GameConfig = {
  renderer: {
    toneMapping: ACESFilmicToneMapping,
    toneMappingExposure: 1.0,
    outputColorSpace: SRGBColorSpace,
    antialias: true,
    shadowMapEnabled: true,
    pixelRatioClamp: 2,
  },

  animation: {
    crossFadeDur: 0.25,
    walkThreshold: 0.05,
    rotateSpeed: 8,
    decelFactor: 0.88,
  },

  camera: {
    offset: { x: 0, y: 2.5, z: 6 },
    lerp: 0.1,
    fov: {
      desktop: 50,
      mobile: 65,
    },
    aspect: {
      min: 9 / 16,
      max: 1,
    },
    follow: {
      lookAtY: 1.0,
    },
    zoom: {
      desktop: 0.5,
      mobile: 0.6,
    },
  },

  characters: CHARACTERS,
  items: ITEMS,
  itemsPerRoom: 5,
};
