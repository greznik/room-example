import type { Scene } from "three";
import { AssetLoader } from "../core/AssetLoader";
import { Room } from "../entities/Room";
import { ItemManager } from "./ItemManager";
import { ROOM_CONFIGS } from "../config/gameConfig";

export class RoomManager {
  private readonly scene: Scene;
  private readonly loader: AssetLoader;
  private readonly itemManager: ItemManager;

  private idx = 0;
  private room: Room | null = null;

  // Индексы, которые уже загружены в кэш — не грузим повторно
  private prefetched = new Set<number>();

  onRoomChanged?: (roomId: number, total: number) => void;

  constructor(scene: Scene, loader: AssetLoader, itemManager: ItemManager) {
    this.scene = scene;
    this.loader = loader;
    this.itemManager = itemManager;
  }

  get currentRoom(): Room | null {
    return this.room;
  }
  get totalRooms(): number {
    return ROOM_CONFIGS.length;
  }

  async init(): Promise<void> {
    await this.loadRoom(0);
  }
  async goNext(): Promise<void> {
    await this.loadRoom((this.idx + 1) % this.totalRooms);
  }
  async goPrev(): Promise<void> {
    await this.loadRoom((this.idx - 1 + this.totalRooms) % this.totalRooms);
  }

  private async loadRoom(index: number): Promise<void> {
    // Убираем текущую комнату
    if (this.room) {
      this.itemManager.clearActiveItems();
      this.room.removeFromScene();
    }

    const config = ROOM_CONFIGS[index];
    const group = await this.loader.load(config.modelPath);

    this.room = new Room(config, group);
    this.room.addToScene(this.scene);
    this.idx = index;

    await this.itemManager.populateRoom(this.room);
    this.onRoomChanged?.(config.id, this.totalRooms);

    // Предзагружаем ТОЛЬКО следующую и предыдущую, один раз
    this.prefetchNeighbors(index);
  }

  private prefetchNeighbors(current: number): void {
    const neighbors = [
      (current + 1) % this.totalRooms,
      (current - 1 + this.totalRooms) % this.totalRooms,
    ];
    for (const i of neighbors) {
      if (!this.prefetched.has(i)) {
        this.prefetched.add(i);
        this.loader.load(ROOM_CONFIGS[i].modelPath).catch(() => {});
      }
    }
  }
}
