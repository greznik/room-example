import {
  AnimationMixer,
  AnimationAction,
  LoopRepeat,
  MathUtils,
  Object3D,
} from "three";
import type { CharacterConfig, Boundary } from "../types";

const BLEND_TIME = 0.25; // секунд на кросс-фейд анимаций
const ROTATE_SPEED = 8; // рад/с — скорость разворота
const DECEL_FACTOR = 0.88; // множитель торможения (меньше → резче)

export class Player {
  readonly root: Object3D;

  private readonly mixer: AnimationMixer;
  private idleAction: AnimationAction | null = null;
  private walkAction: AnimationAction | null = null;

  private speed: number;
  private boundary: Boundary;

  // Реальная скорость — плавно нарастает/убывает
  private velocityX = 0;
  // -1 | 0 | 1 — желаемое направление
  private targetDir = 0;
  // куда смотрит персонаж по Y (для плавного поворота)
  private currentRotY = 0;
  private targetRotY = 0;

  private isWalking = false;

  constructor(
    private readonly config: CharacterConfig,
    sceneGroup: Object3D,
    boundary: Boundary,
  ) {
    this.root = sceneGroup;
    this.speed = config.speed;
    this.boundary = boundary;

    this.root.position.set(0, 0, 1.5);
    this.root.rotation.set(0, 0, 0);
    this.root.scale.set(0.01, 0.01, 0.01);

    this.mixer = new AnimationMixer(this.root);
  }

  moveLeft(): void {
    this.targetDir = -1;
  }
  moveRight(): void {
    this.targetDir = 1;
  }
  stop(): void {
    this.targetDir = 0;
  }

  updateBoundary(b: Boundary): void {
    this.boundary = b;
  }

  update(dt: number): void {
    const wantWalk = this.targetDir !== 0;

    // Скорость
    if (wantWalk) {
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
    const shouldWalk = Math.abs(this.velocityX) > 0.05;
    if (shouldWalk && !this.isWalking) {
      this.crossFadeTo("walk");
      this.isWalking = true;
    } else if (!shouldWalk && this.isWalking) {
      this.crossFadeTo("idle");
      this.isWalking = false;
    }

    // Поворот (плавный, через RotY)
    if (this.targetDir !== 0) {
      // вправо → смотрит по +Z (π/2 в рад относительно оси Y)
      this.targetRotY = this.targetDir > 0 ? Math.PI / 2 : -Math.PI / 2;
    }
    const t = 1 - Math.pow(0.05, dt * ROTATE_SPEED);
    this.currentRotY = MathUtils.lerp(this.currentRotY, this.targetRotY, t);
    this.root.rotation.y = this.currentRotY;

    // Движение с ограничением
    const nextX = this.root.position.x + this.velocityX * dt;
    this.root.position.x = MathUtils.clamp(
      nextX,
      this.boundary.minX,
      this.boundary.maxX,
    );

    // Упёрся в стену — гасим скорость
    if (
      this.root.position.x <= this.boundary.minX ||
      this.root.position.x >= this.boundary.maxX
    ) {
      this.velocityX = 0;
    }

    this.mixer.update(dt);
  }

  /** Ищет клипы по именам из конфига. Работает с clone(true). */
  private initAnimations(group: Object3D): void {
    // AnimationClips у Three.js живут на gltf.animations, НО при
    // clone(true) они копируются в group.animations (если экспортёр
    // их туда пишет). Альтернатива — передавать gltf.animations явно.
    const clips = (group as any).animations as
      | import("three").AnimationClip[]
      | undefined;

    if (!clips?.length) {
      console.warn("[Player] Нет AnimationClips в модели. Проверь GLB.");
      return;
    }

    const find = (name: string) =>
      clips.find((c) => c.name.toLowerCase() === name.toLowerCase());

    const idleClip = find(this.config.animations.idle);
    const walkClip = find(this.config.animations.walk);

    if (idleClip) {
      this.idleAction = this.mixer.clipAction(idleClip);
      this.idleAction.setLoop(LoopRepeat, Infinity);
      this.idleAction.play();
    } else {
      console.warn(
        `[Player] Клип idle "${this.config.animations.idle}" не найден`,
      );
    }

    if (walkClip) {
      this.walkAction = this.mixer.clipAction(walkClip);
      this.walkAction.setLoop(LoopRepeat, Infinity);
      this.walkAction.setEffectiveWeight(0).play();
    } else {
      console.warn(
        `[Player] Клип walk "${this.config.animations.walk}" не найден`,
      );
    }
  }

  private crossFadeTo(target: "idle" | "walk", instant = false): void {
    const from = target === "walk" ? this.idleAction : this.walkAction;
    const to = target === "walk" ? this.walkAction : this.idleAction;
    if (!from || !to) return;

    to.setEffectiveTimeScale(1).setEffectiveWeight(1);
    if (instant) {
      from.setEffectiveWeight(0);
      to.setEffectiveWeight(1);
    } else {
      from.crossFadeTo(to, BLEND_TIME, true);
    }
  }

  // Передать клипы из gltf.animations снаружи (если clone не копирует).
  injectAnimations(clips: import("three").AnimationClip[]): void {
    (this.root as any).animations = clips;
    this.initAnimations(this.root);
    this.crossFadeTo("idle", true);
  }
}
