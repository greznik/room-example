import type { RoomConfig, ItemConfig } from '../types';

// ─── Models ────────────────────────────────────────────────────────────────
// Place your .glb files in /public/models/ and update the paths below.
// All rooms share the same base model for now; swap modelPath per room later.
// ───────────────────────────────────────────────────────────────────────────

const ROOM_MODEL = '/room.glb';
const ITEM_MODEL = '/item.glb';

// ─── Slots ─────────────────────────────────────────────────────────────────
// The illustrator named the first slot "slot_1" inside the room GLTF.
// Add slot_2 … slot_5 as they are created in the model.
// ───────────────────────────────────────────────────────────────────────────

const DEFAULT_SLOTS: string[] = ['chair_spawn'];

// ─── Room configs ──────────────────────────────────────────────────────────

export const ROOM_CONFIGS: RoomConfig[] = Array.from({ length: 20 }, (_, i) => ({
  id: i + 1,
  modelPath: ROOM_MODEL,
  slots: DEFAULT_SLOTS,
}));

// ─── Item configs ──────────────────────────────────────────────────────────
// 5 items per room → 100 total; they all share one model for now.

export const ITEM_CONFIGS: ItemConfig[] = Array.from({ length: 100 }, (_, i) => ({
  id: `item_${i + 1}`,
  modelPath: ITEM_MODEL,
}));

// ─── Misc ──────────────────────────────────────────────────────────────────

export const ITEMS_PER_ROOM = 5;

export const CAMERA_POSITION = { x: 0, y: 1.2, z: 4 };