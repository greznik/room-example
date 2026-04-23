/**
 * roomsConfig.ts
 *
 * Вся конфигурация комнат + освещение на каждую комнату.
 * Каждый тип света — массив, поэтому можно добавить сколько угодно источников.
 * Все параметры редактируются через lil-gui в DEV-режиме.
 *
 * Типы: ambient | hemisphere | directional | spot | point
 */

import type { RoomConfig } from "../types";

// ─── Типы источников света ─────────────────────────────────────────────────────

export interface AmbientLightDef {
  label?: string;
  color: string;
  intensity: number;
  enabled?: boolean;
}

export interface HemisphereLightDef {
  label?: string;
  skyColor: string;
  groundColor: string;
  intensity: number;
  enabled?: boolean;
}

export interface DirectionalLightDef {
  label?: string;
  color: string;
  intensity: number;
  position: [number, number, number];
  target?: [number, number, number];
  enabled?: boolean;
  castShadow?: boolean;
  shadowMapSize?: number;
  shadowBias?: number;
  shadowNormalBias?: number;
  /** half-extent для ortho-камеры тени */
  shadowCameraSize?: number;
}

export interface SpotLightDef {
  label?: string;
  color: string;
  intensity: number;
  position: [number, number, number];
  target: [number, number, number];
  angle: number;
  penumbra: number;
  decay: number;
  distance: number;
  enabled?: boolean;
  castShadow?: boolean;
}

export interface PointLightDef {
  label?: string;
  color: string;
  intensity: number;
  position: [number, number, number];
  distance: number;
  decay: number;
  enabled?: boolean;
  castShadow?: boolean;
}

export interface RoomLightingConfig {
  ambient?: AmbientLightDef[];
  hemisphere?: HemisphereLightDef[];
  directional?: DirectionalLightDef[];
  spot?: SpotLightDef[];
  point?: PointLightDef[];
  envMapUrl?: string;
}

export interface RoomFullConfig extends RoomConfig {
  lighting: RoomLightingConfig;
}

// ─── Конфиг комнат ─────────────────────────────────────────────────────────────

export const ROOMS_CONFIG: RoomFullConfig[] = [
  {
    id: 1,
    modelPath: "/models/rooms/room_1.glb",
    boundary: { minX: -2, maxX: 2 },
    assignments: [
      { slotName: "slot_1", itemId: "item_1" },
      { slotName: "slot_2", itemId: "item_4" },
      { slotName: "slot_3", itemId: "item_2" },
      { slotName: "slot_4", itemId: "item_5" },
      { slotName: "slot_5", itemId: "item_3" },
    ],
    lighting: {
      ambient: [
        {
          label: "Ambient",
          color: "#ffffff",
          intensity: 0,
          enabled: false,
        },
      ],
      hemisphere: [
        {
          label: "Hemisphere",
          skyColor: "#ffffff",
          groundColor: "#080820",
          intensity: 3,
          enabled: true,
        },
      ],
      directional: [
        {
          label: "Directional Light",
          color: "#ffffff",
          intensity: 0.5,
          position: [0.8, 4, 1],
          target: [0, 0, 0],
          enabled: true,
          castShadow: true,
          shadowMapSize: 1024,
          shadowBias: -0.0003,
          shadowNormalBias: 0.02,
          shadowCameraSize: 10,
        },
      ],
      spot: [
        {
          label: "Spot Light 1",
          color: "#ffdd88",
          intensity: 3,
          position: [3, 6, 3],
          target: [0, 0, 0],
          angle: Math.PI / 6,
          penumbra: 0.3,
          decay: 2,
          distance: 20,
          enabled: false,
          castShadow: false,
        },
        {
          label: "Spot Light 2",
          color: "#ffffff",
          intensity: 2,
          position: [-4, 8, -2],
          target: [0, 0, 0],
          angle: Math.PI / 8,
          penumbra: 0.5,
          decay: 2,
          distance: 25,
          enabled: false,
          castShadow: false,
        },
      ],
      point: [
        // Пример точечного — выключен по умолчанию
        {
          label: "Point Light",
          color: "#ffffff",
          intensity: 1,
          position: [0, 3, 0],
          distance: 10,
          decay: 2,
          enabled: false,
          castShadow: false,
        },
      ],
      envMapUrl: "",
    },
  },

  // ── Пример комнаты 2 ─────────────────────────────────────────────────────────
  // {
  //   id: 2,
  //   modelPath: "/models/rooms/room_2.glb",
  //   boundary: { minX: -3, maxX: 3 },
  //   assignments: [],
  //   lighting: {
  //     ambient: [{ label: "Ambient", color: "#112233", intensity: 0.5, enabled: true }],
  //     hemisphere: [],
  //     directional: [
  //       {
  //         label: "Moon",
  //         color: "#aaccff",
  //         intensity: 0.8,
  //         position: [-5, 10, -3],
  //         target: [0, 0, 0],
  //         enabled: true,
  //         castShadow: false,
  //       },
  //     ],
  //     spot: [
  //       {
  //         label: "🔵 Cold fill",
  //         color: "#88ccff",
  //         intensity: 4,
  //         position: [0, 8, 0],
  //         target: [0, 0, 0],
  //         angle: Math.PI / 4,
  //         penumbra: 0.6,
  //         decay: 2,
  //         distance: 30,
  //         enabled: true,
  //         castShadow: true,
  //       },
  //     ],
  //     point: [
  //       {
  //         label: "🔴 Fill point",
  //         color: "#ff4422",
  //         intensity: 2,
  //         position: [1, 2, 1],
  //         distance: 8,
  //         decay: 2,
  //         enabled: true,
  //         castShadow: false,
  //       },
  //     ],
  //     envMapUrl: "/env/studio.hdr",
  //   },
  // },
];
