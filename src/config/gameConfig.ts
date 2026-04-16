import { ACESFilmicToneMapping, SRGBColorSpace } from "three";
import type { ToneMapping } from "three";
import type { CharacterConfig, RoomConfig, ItemConfig } from "../types";

// ─── Interfaces ────────────────────────────────────────────────────────────────

export interface LightConfig {
  type: "ambient" | "directional" | "point" | "spot";
  color: number;
  intensity: number;
  position?: [number, number, number];
  castShadow?: boolean;
}

export interface SlotConfig {
  name: string;
  envMapUrl?: string;
}

export interface RoomEnvConfig {
  envMapUrl: string;
}

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

export interface GameConfig {
  renderer: RendererConfig;
  animation: AnimationConfig;
  camera: { offset: { x: number; y: number; z: number }; lerp: number };
  characters: CharacterConfig[];
  rooms: RoomConfig[];
  items: ItemConfig[];
  itemsPerRoom: number;
  roomEnvMap: Record<number, RoomEnvConfig>;
  defaultEnvMapUrl: string;
}

// ─── Characters ────────────────────────────────────────────────────────────────

const CHARACTERS: CharacterConfig[] = [
  {
    id: "char_1",
    name: "Кибер",
    modelPath: "/models/characters/char_1.glb",
    speed: 2.0,
    animations: { idle: "IK_arm_LAction", walk: "IK_arm_LAction" },
  },
];

// ─── Rooms ─────────────────────────────────────────────────────────────────────

const ROOMS: RoomConfig[] = [
  {
    id: 1,
    modelPath: "/models/rooms/room_1.glb",
    assignments: [
      { slotName: "slot_1", itemId: "item_1" },
      { slotName: "slot_2", itemId: "item_4" },
      { slotName: "slot_3", itemId: "item_2" },
      { slotName: "slot_4", itemId: "item_5" },
      { slotName: "slot_5", itemId: "item_3" },
    ],
    boundary: { minX: -2, maxX: 2 },
  },
];

// ─── Items ─────────────────────────────────────────────────────────────────────

const ITEMS: ItemConfig[] = [
  {
    id: `item_1`,
    modelPath: `/models/items/1/item_1.glb`,
  },
  {
    id: `item_2`,
    modelPath: `/models/items/1/item_2.glb`,
  },
  {
    id: `item_3`,
    modelPath: `/models/items/1/item_3.glb`,
  },
  {
    id: `item_4`,
    modelPath: `/models/items/1/item_4.glb`,
  },
  {
    id: `item_5`,
    modelPath: `/models/items/1/item_5.glb`,
  },
];

// ─── Per-room env ──────────────────────────────────────────────────────────────

const ROOM_ENV: Record<number, RoomEnvConfig> = {
  1: {
    envMapUrl: "",
  },
};

// ─── Main config ───────────────────────────────────────────────────────────────

export const GAME_CONFIG = {
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
    offset: { x: 0, y: 3.5, z: 6 },
    lerp: 0.1,
    fov: {
      desktop: 50,
      mobile: 65,
    },

    aspect: {
      min: 9 / 16, // чтобы не тянуло вверх
      max: 1, // максимум квадрат
    },
    follow: {
      lookAtY: 1.0,
    },
    zoom: {
      desktop: 1.0,
      mobile: 0.4, 
    },
  },

  characters: CHARACTERS,
  rooms: ROOMS,
  items: ITEMS,
  itemsPerRoom: 5,
  roomEnvMap: ROOM_ENV,
  defaultEnvMapUrl: "",
};
