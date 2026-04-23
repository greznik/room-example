/**
 * InitializeGame.ts
 *
 * Точка входа: собирает граф зависимостей, запускает игру, возвращает GameController.
 *
 * Исправлено:
 *   - Баг: `char ?? await preloadBatch(...)` → теперь `&&`
 *   - RoomManager.update() добавлен в game loop (для LightDebugger)
 *   - Убраны неиспользуемые импорты
 */

import { Game } from "./Game";
import { AssetLoader } from "./AssetLoader";
import { Player } from "../entities/Player";
import { RoomManager } from "../managers/RoomManager";
import { ItemManager } from "../managers/ItemManager";
import { GAME_CONFIG } from "../config/gameConfig";
import { ROOMS_CONFIG } from "../config/roomsConfig";
import type { GameController } from "../types/GameController";
import { useGameStore } from "../store/gameStore";

export class GameInitializer {
  private game!: Game;
  private loader!: AssetLoader;
  private player!: Player;
  private roomManager!: RoomManager;
  private itemManager!: ItemManager;

  async initialize(
    container: HTMLElement,
    onProgress: (ratio: number, label: string, time: number) => void,
  ): Promise<GameController> {
    const store = useGameStore();

    this.game = new Game(container);
    this.loader = AssetLoader.getInstance((p) =>
      onProgress(p.loaded, p.label, p.elapsedTime),
    );
    this.loader.initRendererSupport(this.game.renderer);

    this.itemManager = new ItemManager(this.loader);
    this.roomManager = new RoomManager(
      this.game.scene,
      this.loader,
      this.itemManager,
    );

    this.roomManager.onRoomChanged = (id: number, total: number) =>
      store.updateRoom(id, total);

    this.player = new Player(this.game.scene, this.loader);

    // Предзагрузка первой комнаты и персонажа
    // Исправлен баг: было `char ?? await ...` — оператор `??` возвращает правый
    // операнд только если левый null/undefined, но char всегда существует.
    // Теперь preloadBatch вызывается всегда.
    const firstRoom = ROOMS_CONFIG[0];
    await this.loader.preloadBatch([
      firstRoom.modelPath,
      GAME_CONFIG.characters[0].modelPath,
    ]);

    await this.roomManager.init();

    const boundary = this.roomManager.currentRoom?.config.boundary;
    if (boundary) this.player.updateBoundary(boundary);

    await this.player.switchTo(GAME_CONFIG.characters[0]);
    this.game.trackObject(this.player.root);

    // Game loop
    this.game.onUpdate((dt) => {
      this.player.update(dt);
      this.itemManager.update(dt);
      this.roomManager.update(); // обновление LightDebugger хелперов
    });

    this.setupKeyboard();
    this.setupTouch(container);
    this.game.start();

    return this.buildController();
  }

  // ─── Input ───────────────────────────────────────────────────────────────────

  private setupKeyboard(): void {
    const LEFT  = new Set(["ArrowLeft", "a", "A", "ф", "Ф"]);
    const RIGHT = new Set(["ArrowRight", "d", "D", "в", "В"]);

    window.addEventListener("keydown", (e) => {
      if (LEFT.has(e.key))  this.player.moveLeft();
      if (RIGHT.has(e.key)) this.player.moveRight();
    });

    window.addEventListener("keyup", (e) => {
      if (LEFT.has(e.key) || RIGHT.has(e.key)) this.player.stop();
    });
  }

  private setupTouch(container: HTMLElement): void {
    let startX = 0;

    container.addEventListener("touchstart", (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });

    container.addEventListener("touchmove", (e) => {
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 12) {
        dx < 0 ? this.player.moveLeft() : this.player.moveRight();
      }
    }, { passive: true });

    container.addEventListener("touchend", () => this.player.stop(), { passive: true });
  }

  // ─── Controller ──────────────────────────────────────────────────────────────

  private buildController(): GameController {
    const syncBoundary = (): void => {
      const b = this.roomManager.currentRoom?.config.boundary;
      if (b) this.player.updateBoundary(b);
    };

    return {
      goNext: async () => {
        await this.roomManager.goNext();
        syncBoundary();
      },
      goPrev: async () => {
        await this.roomManager.goPrev();
        syncBoundary();
      },
      changeCharacter: async (idx: number) => {
        useGameStore().setCharacter(idx);

        const canvas = this.game.renderer.domElement;
        canvas.style.cssText += "transition:opacity .3s;opacity:0";
        await new Promise<void>((r) => setTimeout(r, 300));

        await this.player.switchTo(GAME_CONFIG.characters[idx]);
        this.game.trackObject(this.player.root);

        canvas.style.opacity = "1";
        setTimeout(() => { canvas.style.transition = ""; }, 300);
      },
    };
  }
}
