/**
 * RoomManager.ts
 *
 * Управляет загрузкой и сменой комнат.
 * При каждой смене комнаты:
 *   1. Применяет освещение из конфига через LightingSystem
 *   2. Обновляет GUI-дебаггер (только в DEV)
 *   3. Загружает env map (если задан)
 *   4. Размещает предметы
 */

import type { Scene } from "three";
import { AssetLoader } from "../core/AssetLoader";
import { LightingSystem } from "../core/LightingSystem";
import { LightDebugger } from "../debug/LightDebugger";
import { Room } from "../entities/Room";
import { ItemManager } from "./ItemManager";
import { ROOMS_CONFIG } from "../config/roomsConfig";

export class RoomManager {
  private readonly scene: Scene;
  private readonly loader: AssetLoader;
  private readonly itemManager: ItemManager;
  private readonly lightingSystem: LightingSystem;
  private readonly lightDebugger: LightDebugger | null;

  private idx = 0;
  private room: Room | null = null;
  private readonly prefetched = new Set<number>();

  onRoomChanged?: (roomId: number, total: number) => void;

  constructor(scene: Scene, loader: AssetLoader, itemManager: ItemManager) {
    this.scene = scene;
    this.loader = loader;
    this.itemManager = itemManager;
    this.lightingSystem = new LightingSystem(scene);

    this.lightDebugger = new LightDebugger(scene);
  }

  get currentRoom(): Room | null {
    return this.room;
  }
  get totalRooms(): number {
    return ROOMS_CONFIG.length;
  }

  async init(): Promise<void> {
    await this.loadRoom(0);
  }
  async goNext(): Promise<void> {
    if (this.isLoading) return;
    await this.loadRoom((this.idx + 1) % this.totalRooms);
  }
  async goPrev(): Promise<void> {
    await this.loadRoom((this.idx - 1 + this.totalRooms) % this.totalRooms);
  }

  /** Вызывать каждый кадр — обновляет визуальные хелперы в DEV. */
  update(): void {
    this.lightDebugger?.update();
  }

  dispose(): void {
    this.lightingSystem.dispose();
    this.lightDebugger?.dispose();
  }

  // ─── Private ─────────────────────────────────────────────────────────────────
  private isLoading = false;

  private async loadRoom(index: number): Promise<void> {
    this.isLoading = true;
    try {
      if (this.room) {
        this.itemManager.clearActiveItems();
        this.room.removeFromScene();
      }

      const config = ROOMS_CONFIG[index];
      const group = await this.loader.load(config.modelPath);

      this.room = new Room(config, group);
      this.room.addToScene(this.scene);
      this.idx = index;

      // 1. Освещение
      const lights = this.lightingSystem.applyRoomLighting(config.lighting);

      // 2. Debug GUI — пересоздаётся для каждой комнаты
      this.lightDebugger?.attach(lights, `Комната ${config.id}`);

      // 3. Env map
      if (config.lighting.envMapUrl) {
        const envMap = await this.loader.loadEnvMap(config.lighting.envMapUrl);
        this.scene.environment = envMap;
      } else {
        this.scene.environment = null;
      }

      // 4. Предметы
      await this.itemManager.populateRoom(this.room);
      this.itemManager.spawnAll();

      this.onRoomChanged?.(config.id, this.totalRooms);
      this.prefetchNeighbors(index);
    } finally {
      this.isLoading = false;
    }
  }

  private prefetchNeighbors(current: number): void {
    const neighbors = [
      (current + 1) % this.totalRooms,
      (current - 1 + this.totalRooms) % this.totalRooms,
    ];
    for (const i of neighbors) {
      if (!this.prefetched.has(i)) {
        this.prefetched.add(i);
        this.loader.load(ROOMS_CONFIG[i].modelPath).catch(() => {});
      }
    }
  }
}
