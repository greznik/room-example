import { Group, Object3D } from 'three';
import type { ItemConfig } from '../types';

// ─────────────────────────────────────────────────────────────────
//  Item
//
//  Wraps the loaded GLTF Group for a single interactable item.
//  Keeps an "alive" state so RoomManager can swap items in/out
//  without reloading from disk.
// ─────────────────────────────────────────────────────────────────

export class Item {
  readonly config: ItemConfig;
  readonly root: Group;

  /** Elapsed time accumulator — used for idle animation. */
  private _time = 0;

  constructor(config: ItemConfig, sceneGroup: Group) {
    this.config = config;
    this.root = sceneGroup;

    if (config.scale !== undefined) {
      this.root.scale.setScalar(config.scale);
    }
  }

  // ─── Placement ──────────────────────────────────────────────────

  /** Attach this item to a slot anchor Object3D. */
  attachToSlot(anchor: Object3D): void {
    // Reset local transform relative to anchor
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    anchor.add(this.root);
  }

  /** Detach from whatever parent it currently has. */
  detach(): void {
    this.root.parent?.remove(this.root);
  }

  // ─── Per-frame update ───────────────────────────────────────────

  /**
   * Gentle hover + slow rotation.
   * Call this from Game.onUpdate only for the *active* room's items
   * to keep the loop cheap.
   */
  update(dt: number): void {
    this._time += dt;
  }
}