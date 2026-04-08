import { AssetLoader } from '../core/AssetLoader';
import { Item } from '../entities/Item';
import { ITEM_CONFIGS, ITEMS_PER_ROOM } from '../config/gameConfig';
import type { Room } from '../entities/Room';
import type { ItemConfig } from '../types';

// ─────────────────────────────────────────────────────────────────
//  ItemManager
//
//  Responsible for:
//  • Mapping room IDs → their 5 ItemConfig entries.
//  • Instantiating Item objects and placing them in Room slots.
//  • Tracking which items are currently active so they can be
//    updated each frame and detached when the room changes.
// ─────────────────────────────────────────────────────────────────

export class ItemManager {
  private readonly loader: AssetLoader;

  /** Items currently placed in the visible room. */
  private _activeItems: Item[] = [];

  constructor(loader: AssetLoader) {
    this.loader = loader;
  }

  // ─── Public API ─────────────────────────────────────────────────

  /**
   * Instantiate and attach items for the given room.
   * Clears any previously active items first.
   */
  async populateRoom(room: Room): Promise<void> {
    this.clearActiveItems();

    const configs = this._itemConfigsForRoom(room.config.id);
    const slots   = room.slots;

    for (let i = 0; i < configs.length; i++) {
      const config = configs[i];
      const slot   = slots[i % slots.length]; // wrap if fewer slots than items

      const item = await this._createItem(config);
      item.attachToSlot(slot.anchor);
      this._activeItems.push(item);
    }
  }

  /** Per-frame update — called by Game loop. */
  update(dt: number): void {
    for (const item of this._activeItems) item.update(dt);
  }

  /** Detach and clear all active items (e.g. on room change). */
  clearActiveItems(): void {
    for (const item of this._activeItems) item.detach();
    this._activeItems = [];
  }

  // ─── Private ────────────────────────────────────────────────────

  /** Slice 5 item configs for a given 1-based room ID. */
  private _itemConfigsForRoom(roomId: number): ItemConfig[] {
    const start = (roomId - 1) * ITEMS_PER_ROOM;
    return ITEM_CONFIGS.slice(start, start + ITEMS_PER_ROOM);
  }

  private async _createItem(config: ItemConfig): Promise<Item> {
    const group = await this.loader.load(config.modelPath);
    return new Item(config, group);
  }
}