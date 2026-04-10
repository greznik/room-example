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
  lights: LightConfig[];
  slots: Record<string, SlotConfig>;
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
    animations: { idle: "Survey", walk: "Walk" },
  },
  {
    id: "char_2",
    name: "Лед",
    modelPath: "/models/characters/char_2.glb",
    speed: 2.3,
    animations: { idle: "Idle", walk: "Walk" },
  },
  {
    id: "char_3",
    name: "Репо",
    modelPath: "/models/characters/char_3.glb",
    speed: 2.6,
    animations: { idle: "Armature|idle", walk: "Armature|walk" },
  },
  {
    id: "char_4",
    name: "Призрак",
    modelPath: "/models/characters/char_4.glb",
    speed: 2.1,
    animations: { idle: "Idle", walk: "Walk" },
  },
  {
    id: "char_5",
    name: "Нова",
    modelPath: "/models/characters/char_5.glb",
    speed: 2.8,
    animations: { idle: "Idle", walk: "Walk" },
  },
];

// ─── Rooms ─────────────────────────────────────────────────────────────────────

const ROOMS: RoomConfig[] = [
  {
    id: 1,
    modelPath: "/models/rooms/room_1.glb",
    assignments: [{ slotName: "chair_spawn", itemId: "item_1" }],
    boundary: { minX: -2, maxX: 2 },
  },
];

// ─── Items ─────────────────────────────────────────────────────────────────────

const ITEMS: ItemConfig[] = Array.from({ length: 1 }, (_, i) => ({
  id: `item_${i + 1}`,
  modelPath: `/models/items/item_${(i % 8) + 1}.glb`,
}));

// ─── Per-room env / light ──────────────────────────────────────────────────────

/**
 * ROOM_ENV используется в InitializeGame при смене комнаты:
 *   const envCfg = GAME_CONFIG.roomEnvMap[room.config.id]
 *   const envMap = await loader.loadEnvMap(envCfg?.envMapUrl ?? defaultEnvMapUrl)
 *   scene.environment = envMap
 *   LightManager.applyConfig(scene, envCfg?.lights ?? [])
 *
 * Это позволяет дизайнеру задавать для каждой комнаты свой HDR и освещение
 * прямо здесь, без правки кода менеджеров.
 */
const ROOM_ENV: Record<number, RoomEnvConfig> = {
  1: {
    envMapUrl: "/environmentMaps/2.hdr",
    lights: [
      { type: "ambient", color: 0xffeedd, intensity: 0.8 },
      {
        type: "directional",
        color: 0xffffff,
        intensity: 1.5,
        position: [2, 3, 1],
        castShadow: true,
      },
    ],
    slots: {
      slot_1: { name: "slot_1" },
      slot_2: { name: "slot_2" },
      slot_3: { name: "slot_3" },
      slot_4: { name: "slot_4" },
      slot_5: { name: "slot_5" },
    },
  },
};

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
    offset: { x: 0, y: 1.4, z: 4.5 },
    lerp: 0.08,
  },
  characters: CHARACTERS,
  rooms: ROOMS,
  items: ITEMS,
  itemsPerRoom: 5,
  roomEnvMap: ROOM_ENV,
  defaultEnvMapUrl: "/environmentMaps/1.hdr",
};

// Обратная совместимость
export const CHARACTERS_CONFIG = GAME_CONFIG.characters;
export const ROOM_CONFIGS = GAME_CONFIG.rooms;
export const ITEM_CONFIGS = GAME_CONFIG.items;
export const ITEMS_PER_ROOM = GAME_CONFIG.itemsPerRoom;
export const CAMERA_OFFSET = GAME_CONFIG.camera.offset;
export const CAMERA_LERP = GAME_CONFIG.camera.lerp;
