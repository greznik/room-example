import type { Scene } from 'three';
import { AssetLoader } from '../core/AssetLoader';
import { Room } from '../entities/Room';
import { ItemManager } from './ItemManager';
import { ROOM_CONFIGS } from '../config/gameConfig';

// ─────────────────────────────────────────────────────────────────
//  RoomManager
//
//  Tracks all 20 room configs and manages which one is active.
//  On room change it:
//    1. Removes old room + its items from the scene.
//    2. Instantiates (or retrieves from cache) the new room model.
//    3. Asks ItemManager to populate the new room.
// ─────────────────────────────────────────────────────────────────

export class RoomManager {
  private readonly scene: Scene;
  private readonly loader: AssetLoader;
  private readonly itemManager: ItemManager;

  /** Zero-based index into ROOM_CONFIGS. */
  private _currentIndex = 0;
  private _currentRoom: Room | null = null;

  /** Optional callback so the HUD can react to room changes. */
  onRoomChanged?: (roomId: number, total: number) => void;

  constructor(scene: Scene, loader: AssetLoader, itemManager: ItemManager) {
    this.scene       = scene;
    this.loader      = loader;
    this.itemManager = itemManager;
  }

  // ─── Public API ─────────────────────────────────────────────────

  get currentIndex(): number  { return this._currentIndex; }
  get totalRooms():   number  { return ROOM_CONFIGS.length; }
  get currentRoom():  Room | null { return this._currentRoom; }

  /** Show the first room. Call once after preloading. */
  async init(): Promise<void> {
    await this._loadRoom(0);
  }

  async goNext(): Promise<void> {
    const next = (this._currentIndex + 1) % ROOM_CONFIGS.length;
    await this._loadRoom(next);
  }

  async goPrev(): Promise<void> {
    const prev =
      (this._currentIndex - 1 + ROOM_CONFIGS.length) % ROOM_CONFIGS.length;
    await this._loadRoom(prev);
  }

  // ─── Private ────────────────────────────────────────────────────

  private async _loadRoom(index: number): Promise<void> {
    // 1. Tear down current room
    if (this._currentRoom) {
      this.itemManager.clearActiveItems();
      this._currentRoom.removeFromScene();
      this._currentRoom = null;
    }

    // 2. Instantiate new room
    const config = ROOM_CONFIGS[index];
    const group  = await this.loader.load(config.modelPath);
    const room   = new Room(config, group);
    room.addToScene(this.scene);

    // 3. Populate with items
    await this.itemManager.populateRoom(room);

    // 4. Update state
    this._currentRoom  = room;
    this._currentIndex = index;

    this.onRoomChanged?.(config.id, ROOM_CONFIGS.length);
  }
}