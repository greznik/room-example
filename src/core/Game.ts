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
import { AssetLoader } from "./AssetLoader";

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
  private _isMobile = false;
  private stats: Stats | null = null;
  private dcPanel: Stats.Panel | null = null;
  private bppPanel: Stats.Panel | null = null;
  private readonly bpp: number;
  private readonly container: HTMLElement;

  constructor(container: HTMLElement) {
    this.container = container;

    const rc = GAME_CONFIG.renderer;

    this.renderer = new WebGLRenderer({ antialias: rc.antialias });
    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, rc.pixelRatioClamp),
    );
    this.renderer.shadowMap.enabled = rc.shadowMapEnabled;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = rc.toneMapping;
    this.renderer.toneMappingExposure = rc.toneMappingExposure;
    this.renderer.outputColorSpace = rc.outputColorSpace;

    container.appendChild(this.renderer.domElement);
    this.bpp = this.getBpp();
    this.scene = new Scene();

    const { offset, fov } = GAME_CONFIG.camera;
    this.camera = new PerspectiveCamera(fov.desktop, 1, 0.01, 100);
    this.camera.position.set(offset.x, offset.y, offset.z);
    this.camera.lookAt(0, 0, 0);

    this.addStats();

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
    AssetLoader.reset();
    window.removeEventListener("resize", this.onResize);
    this.renderer.dispose();
    this.stats?.dom.remove();
    this.stats = null;
  }

  // ─── Private ─────────────────────────────────────────────────────────────────

  private addStats(): void {
    this.stats = new Stats();
    this.stats.dom.style.transformOrigin = "top left";
    this.stats.dom.style.zIndex = "9999";

    // Кастомные панели
    this.dcPanel = new Stats.Panel("DC", "#ff0", "#220");
    this.stats.addPanel(this.dcPanel);
    this.bppPanel = new Stats.Panel("BPP", "#0ff", "#022");
    this.stats.addPanel(this.bppPanel);
    this.stats.showPanel(0);

    this.container.appendChild(this.stats.dom);
  }

  private getBpp(): number {
    const gl = this.renderer.getContext();

    const colorBits =
      gl.getParameter(gl.RED_BITS) +
      gl.getParameter(gl.GREEN_BITS) +
      gl.getParameter(gl.BLUE_BITS) +
      gl.getParameter(gl.ALPHA_BITS);

    const depthBits = gl.getParameter(gl.DEPTH_BITS);
    const stencilBits = gl.getParameter(gl.STENCIL_BITS);

    return colorBits + depthBits + stencilBits;
  }

  private isMobile(): boolean {
    return this._isMobile;
  }

  private tick = (time: number): void => {
    this.rafId = requestAnimationFrame(this.tick);

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    for (const cb of this.updateCallbacks) cb(dt);

    this.updateCamera();

    this.stats?.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats?.end();

    // Обновляем кастомные панели после рендера
    const info = this.renderer.info;
    this.dcPanel?.update(info.render.calls, 300);
    this.bppPanel?.update(this.bpp, 64);
    this.renderer.info.reset(); // сбрасываем счётчики каждый кадр
  };

  private readonly _offsetVec = new Vector3();
  private readonly _desiredPos = new Vector3();

  private updateCamera(): void {
    const { offset, lerp, follow, zoom } = GAME_CONFIG.camera;
    const zoomFactor = this.isMobile() ? zoom.mobile : zoom.desktop;
    const target = this.trackedRoot!.position;

    this._offsetVec.set(offset.x, offset.y, offset.z);
    const distance = this._offsetVec.length() * zoomFactor;
    this._offsetVec.normalize();

    this._desiredPos.copy(target).addScaledVector(this._offsetVec, distance);

    this.camera.position.lerp(this._desiredPos, lerp);
    this.camera.lookAt(target.x, follow.lookAtY, target.z);
  }

  private onResize = (): void => {
    const { width: rawW, height: rawH } =
      this.container.getBoundingClientRect();
    this._isMobile = rawW < MOBILE_BREAKPOINT; // единственное место определения

    let width = rawW;
    let height = rawH;

    if (!this._isMobile) {
      const size = Math.min(rawW, rawH);
      width = size;
      height = size;
    }

    this.camera.fov = this._isMobile
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
