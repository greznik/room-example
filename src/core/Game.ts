/**
 * Game.ts
 *
 * Ядро: WebGLRenderer, Scene, Camera, game loop.
 * Свет управляется через LightingSystem (вызывается из RoomManager).
 * Дебаггер подключается через LightDebugger.
 */

import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  PCFSoftShadowMap,
  Object3D,
  Vector3,
} from "three";
import Stats from "stats.js";
import { GAME_CONFIG } from "../config/gameConfig";

type TickCallback = (dt: number) => void;

const MOBILE_BREAKPOINT = 768;

export class Game {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;

  private rafId = 0;
  private updateCallbacks: TickCallback[] = [];
  private lastTime = 0;
  private trackedRoot: Object3D | null = null;
  private readonly container: HTMLElement;
  private stats: Stats | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    const rc = GAME_CONFIG.renderer;

    this.renderer = new WebGLRenderer({ antialias: rc.antialias });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, rc.pixelRatioClamp));
    this.renderer.shadowMap.enabled = rc.shadowMapEnabled;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = rc.toneMapping;
    this.renderer.toneMappingExposure = rc.toneMappingExposure;
    this.renderer.outputColorSpace = rc.outputColorSpace;

    container.appendChild(this.renderer.domElement);

    this.scene = new Scene();

    const { offset, fov } = GAME_CONFIG.camera;
    this.camera = new PerspectiveCamera(fov.desktop, 1, 0.01, 100);
    this.camera.position.set(offset.x, offset.y, offset.z);
    this.camera.lookAt(0, 0, 0);

    if (import.meta.env.DEV) {
      this.addStats();
    }

    this.onResize();
    window.addEventListener("resize", this.onResize);
  }

  trackObject(root: Object3D): void {
    this.trackedRoot = root;
  }

  onUpdate(cb: TickCallback): void {
    this.updateCallbacks.push(cb);
  }

  start(): void {
    this.lastTime = performance.now();
    this.tick(this.lastTime);
  }

  stop(): void {
    cancelAnimationFrame(this.rafId);
  }

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.stats?.dom.remove();
    this.stats = null;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private addStats(): void {
    this.stats = new Stats();
    this.stats.dom.style.transform = "scale(0.7)";
    this.stats.dom.style.transformOrigin = "top left";
    this.stats.dom.style.zIndex = "9999";

    if (getComputedStyle(this.container).position === "static") {
      this.container.style.position = "relative";
    }
    this.container.appendChild(this.stats.dom);
  }

  private isMobile(): boolean {
    return this.container.clientWidth < MOBILE_BREAKPOINT;
  }

  private tick = (time: number): void => {
    this.rafId = requestAnimationFrame(this.tick);

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    for (const cb of this.updateCallbacks) cb(dt);

    this.updateCamera();

    this.stats?.update();
    this.renderer.render(this.scene, this.camera);
  };

  private updateCamera(): void {
    if (!this.trackedRoot) return;

    const { offset, lerp, follow, zoom } = GAME_CONFIG.camera;
    const zoomFactor = this.isMobile() ? zoom.mobile : zoom.desktop;
    const target = this.trackedRoot.position;

    const offsetVec = new Vector3(offset.x, offset.y, offset.z);
    const dir = offsetVec.clone().normalize();
    const distance = offsetVec.length() * zoomFactor;

    const desiredPos = target.clone().addScaledVector(dir, distance);
    this.camera.position.lerp(desiredPos, lerp);
    this.camera.lookAt(target.x, follow.lookAtY, target.z);
  }

  private onResize = (): void => {
    const { width: rawW, height: rawH } = this.container.getBoundingClientRect();
    const mobile = rawW < MOBILE_BREAKPOINT;

    let width = rawW;
    let height = rawH;

    if (!mobile) {
      const size = Math.min(rawW, rawH);
      width = size;
      height = size;
    }

    this.camera.fov = mobile
      ? GAME_CONFIG.camera.fov.mobile
      : GAME_CONFIG.camera.fov.desktop;

    const { min, max } = GAME_CONFIG.camera.aspect;
    const aspect = Math.min(Math.max(width / height, min), max);

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };
}
