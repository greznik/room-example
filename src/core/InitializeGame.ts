import { Game } from "./Game";
import { AssetLoader } from "./AssetLoader";
import { RoomManager } from "../managers/RoomManager";
import { ItemManager } from "../managers/ItemManager";
import { Player } from "../entities/Player";
import { CHARACTERS_CONFIG, ROOM_CONFIGS } from "../config/gameConfig";
import type { GameController } from "../types/GameController";
import { useGameStore } from "../store/gameStore";
import { PMREMGenerator } from "three";
import { SkeletonUtils } from "three/examples/jsm/Addons.js";

export class GameInitializer {
  private game!: Game;
  private loader!: AssetLoader;
  private roomManager!: RoomManager;
  private player!: Player;

  async initialize(
    container: HTMLElement,
    onProgress: (ratio: number, label: string, time: number) => void,
  ): Promise<GameController> {
    const store = useGameStore();

    // ── Renderer & scene ────────────────────────────────────────
    this.game = new Game(container);

    this.loader = AssetLoader.getInstance((p) =>
      onProgress(p.loaded, p.label, p.elapsedTime),
    );
    this.loader.initRendererSupport(this.game.renderer);

    // ── Менеджеры ───────────────────────────────────────────────
    const itemManager = new ItemManager(this.loader);
    this.roomManager = new RoomManager(
      this.game.scene,
      this.loader,
      itemManager,
    );
    this.roomManager.onRoomChanged = (id, total) => store.updateRoom(id, total);

    // Предзагрузка: первая комната + первый персонаж
    await this.loader.preloadBatch([
      ROOM_CONFIGS[0].modelPath,
      CHARACTERS_CONFIG[0].modelPath,
    ]);

    // Первая комната
    await this.roomManager.init();

    // Env map
    const hdr = await this.loader.loadEnvMap("/environmentMaps/1/2k.hdr");

    const pmrem = new PMREMGenerator(this.game.renderer);
    const envMap = pmrem.fromEquirectangular(hdr).texture;

    this.game.scene.environment = envMap;
    this.game.scene.background = envMap;
    this.game.scene.environment = envMap;
    this.game.scene.background = envMap;

    // Первый персонаж
    this.player = await this.spawnPlayer(0);

    // Ввод
    this.setupKeyboard();
    this.setupTouch(container);
    this.game.start();
    return this.buildController();
  }

  // Создать персонажа
  private async spawnPlayer(idx: number, prevPlayer?: Player): Promise<Player> {
    const conf = CHARACTERS_CONFIG[idx];
    const boundary = this.roomManager.currentRoom!.config.boundary;

    const gltf = await this.loader.loadGltf(conf.modelPath);

    const group = SkeletonUtils.clone(gltf.scene);

    const player = new Player(conf, group, boundary);

    // Передаём клипы из gltf.animations (они не копируются при clone)
    if (gltf.animations?.length) {
      player.injectAnimations(gltf.animations);
    } else {
      console.warn("GLTF без анимаций:", conf.modelPath);
    }

    // Убираем старого
    if (prevPlayer) this.game.scene.remove(prevPlayer.root);

    this.game.scene.add(player.root);
    this.game.registerPlayer(player);

    return player;
  }

  // Клавиатура
  private setupKeyboard(): void {
    const LEFT = new Set(["ArrowLeft", "a", "A", "ф", "Ф"]);
    const RIGHT = new Set(["ArrowRight", "d", "D", "в", "В"]);

    window.addEventListener("keydown", (e) => {
      if (LEFT.has(e.key)) this.player.moveLeft();
      if (RIGHT.has(e.key)) this.player.moveRight();
    });
    window.addEventListener("keyup", (e) => {
      if (LEFT.has(e.key) || RIGHT.has(e.key)) this.player.stop();
    });
  }

  // Touch
  private setupTouch(container: HTMLElement): void {
    let startX = 0;
    const THRESHOLD = 12;

    container.addEventListener(
      "touchstart",
      (e) => {
        startX = e.touches[0].clientX;
      },
      { passive: true },
    );

    container.addEventListener(
      "touchmove",
      (e) => {
        const dx = e.touches[0].clientX - startX;
        if (Math.abs(dx) > THRESHOLD) {
          if (dx < 0) this.player.moveLeft();
          else this.player.moveRight();
        }
      },
      { passive: true },
    );

    container.addEventListener(
      "touchend",
      () => {
        this.player.stop();
      },
      { passive: true },
    );
  }

  // GameController
  private buildController(): GameController {
    const updateBoundary = () => {
      const b = this.roomManager.currentRoom?.config.boundary;
      if (b) this.player.updateBoundary(b);
    };

    return {
      goNext: async () => {
        await this.roomManager.goNext();
        updateBoundary();
      },

      goPrev: async () => {
        await this.roomManager.goPrev();
        updateBoundary();
      },

      changeCharacter: async (idx: number) => {
        const store = useGameStore();
        store.setCharacter(idx);

        // Простая fade-анимация через CSS: прячем канвас, меняем, показываем
        const canvas = this.game.renderer.domElement;
        canvas.style.transition = "opacity 0.3s";
        canvas.style.opacity = "0";

        await new Promise((r) => setTimeout(r, 300));

        this.player = await this.spawnPlayer(idx, this.player);

        canvas.style.opacity = "1";
        setTimeout(() => {
          canvas.style.transition = "";
        }, 300);
      },
    };
  }
}
