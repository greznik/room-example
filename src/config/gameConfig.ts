import type { RoomConfig, ItemConfig, CharacterConfig } from '../types'

// ── Персонажи ────────────────────────────────────────────────────
// animations.idle / animations.walk — точные имена клипов в GLB
export const CHARACTERS_CONFIG: CharacterConfig[] = [
  {
    id: 'char_1',
    name: 'Кибер',
    modelPath: '/models/characters/char_1.glb',
    speed: 2.0,
    animations: { idle: 'Survey', walk: 'Walk' },
  },
  {
    id: 'char_2',
    name: 'Лед',
    modelPath: '/models/characters/char_2.glb',
    speed: 2.3,
    animations: { idle: 'Idle', walk: 'Walk' },
  },
  {
    id: 'char_3',
    name: 'Репо',
    modelPath: '/models/characters/char_3.glb',
    speed: 2.6,
    animations: { idle: 'Armature|idle', walk: 'Armature|walk' },
  },
]

// ── Комнаты ──────────────────────────────────────────────────────
// slots — имена Object3D в конкретной GLB-модели комнаты
// boundary — на сколько может уйти персонаж влево/вправо
export const ROOM_CONFIGS: RoomConfig[] = [
  {
    id: 1,
    modelPath: '/models/rooms/room_1.glb',
    slots: ['chair_spawn'],
    boundary: { minX: -2, maxX: 2 },
  },
]

// ── Предметы ─────────────────────────────────────────────────────
// 5 предметов × 20 комнат = 100 записей; itemPath ротируется по 8 моделям
export const ITEM_CONFIGS: ItemConfig[] = Array.from({ length: 3 }, (_, i) => ({
  id: `item_${i + 1}`,
  modelPath: `/models/items/item_${(i % 8) + 1}.glb`,
}))

export const ITEMS_PER_ROOM = 5

// Камера немного над и позади персонажа
export const CAMERA_OFFSET = { x: 0, y: 1.4, z: 4.5 }
export const CAMERA_LERP   = 0.08
