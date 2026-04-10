import { clone as skeletonClone } from "three/examples/jsm/utils/SkeletonUtils.js";
import { MathUtils, Object3D, Scene } from "three";
import { AnimationManager } from "../managers/AnimationManager";
import { disposeObject } from "../core/disposeObject";
import type { AssetLoader } from "../core/AssetLoader";
import type { CharacterConfig, Boundary } from "../types";

const DECEL_FACTOR = 0.88;
const ROTATE_SPEED = 8;

export class Player {
  root!: Object3D;
  private animMgr = new AnimationManager();
  private velocityX = 0;
  private targetDir = 0;
  private currentRotY = 0;
  private targetRotY = 0;
  private speed = 2;
  private boundary: Boundary = { minX: -5, maxX: 5 };

  constructor(
    private readonly scene: Scene,
    private readonly loader: AssetLoader,
  ) {}

  async switchTo(conf: CharacterConfig): Promise<void> {
    // Удаляем старого персонажа из сцены
    if (this.root) {
      this.animMgr.dispose();
      disposeObject(this.root);
    }

    const gltf = await this.loader.loadGltf(conf.modelPath);
    this.root = skeletonClone(gltf.scene);
    this.root.position.set(0, 0, 1.5);
    this.root.scale.set(0.01, 0.01, 0.01);

    this.speed = conf.speed;
    this.velocityX = 0;
    this.targetDir = 0;
    this.currentRotY = 0;
    this.targetRotY = 0;

    this.animMgr = new AnimationManager();
    this.animMgr.initFromGLTF(
      gltf,
      this.root,
      conf.animations.idle,
      conf.animations.walk,
    );

    this.scene.add(this.root);
  }

  update(dt: number): void {
    if (!this.root) return;

    // Скорость
    if (this.targetDir !== 0) {
      this.velocityX = MathUtils.lerp(
        this.velocityX,
        this.targetDir * this.speed,
        1 - Math.pow(DECEL_FACTOR, dt * 60),
      );
    } else {
      this.velocityX *= Math.pow(DECEL_FACTOR, dt * 60);
      if (Math.abs(this.velocityX) < 0.01) this.velocityX = 0;
    }

    // Анимация
    this.animMgr.play(Math.abs(this.velocityX) > 0.05 ? "walk" : "idle");

    // Поворот
    if (this.targetDir !== 0) {
      this.targetRotY = this.targetDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    const t = 1 - Math.pow(0.05, dt * ROTATE_SPEED);
    this.currentRotY = MathUtils.lerp(this.currentRotY, this.targetRotY, t);
    this.root.rotation.y = this.currentRotY;

    // Позиция
    const nextX = this.root.position.x + this.velocityX * dt;
    this.root.position.x = MathUtils.clamp(
      nextX,
      this.boundary.minX,
      this.boundary.maxX,
    );
    if (
      this.root.position.x <= this.boundary.minX ||
      this.root.position.x >= this.boundary.maxX
    ) {
      this.velocityX = 0;
    }

    this.animMgr.update(dt);
  }

  moveLeft() {
    this.targetDir = -1;
  }
  moveRight() {
    this.targetDir = 1;
  }
  stop() {
    this.targetDir = 0;
  }
  updateBoundary(b: Boundary) {
    this.boundary = b;
  }

  dispose() {
    this.animMgr.dispose();
    disposeObject(this.root);
  }
}
