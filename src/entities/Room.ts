import { Group, Object3D } from 'three';
import type { RoomConfig, SlotDescriptor } from '../types';

// ─────────────────────────────────────────────────────────────────
//  Room
//
//  Wraps the loaded GLTF Group for a single room.
//  Exposes named "slots" — Object3Ds that live inside the scene
//  graph and serve as attachment points for items.
// ─────────────────────────────────────────────────────────────────

export class Room {
  readonly config: RoomConfig;
  readonly root: Group;

  private readonly _slots = new Map<string, SlotDescriptor>();

  constructor(config: RoomConfig, sceneGroup: Group) {
    this.config = config;
    this.root = sceneGroup;
    this._resolveSlots(config.slots);
  }

  // ─── Public API ─────────────────────────────────────────────────

  /** Returns the SlotDescriptor for a named slot, or null if not found. */
  getSlot(name: string): SlotDescriptor | null {
    return this._slots.get(name) ?? null;
  }

  /** All resolved slots for this room. */
  get slots(): SlotDescriptor[] {
    return [...this._slots.values()];
  }

  /** Add this room to a parent (typically the Scene). */
  addToScene(parent: { add: (o: Object3D) => void }): void {
    parent.add(this.root);
  }

  /** Remove this room from its parent. */
  removeFromScene(): void {
    this.root.parent?.remove(this.root);
  }

  // ─── Private ────────────────────────────────────────────────────

  /**
   * Walk the scene graph and index every Object3D whose name matches
   * a requested slot name.  Logs a warning for unresolved slots so
   * the designer can catch typos in the GLTF.
   */
  private _resolveSlots(slotNames: string[]): void {
    const found = new Set<string>();

    this.root.traverse((node) => {
      if (slotNames.includes(node.name)) {
        this._slots.set(node.name, { name: node.name, anchor: node });
        found.add(node.name);
      }
    });

    for (const name of slotNames) {
      if (!found.has(name)) {
        console.warn(
          `[Room ${this.config.id}] Slot "${name}" not found in model. ` +
          `Check Object3D name in Blender/Maya.`
        );
      }
    }
  }
}