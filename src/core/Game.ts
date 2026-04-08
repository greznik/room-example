import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  Color,
} from "three";
import { CAMERA_POSITION } from "../config/gameConfig";

// ─────────────────────────────────────────────────────────────────
//  Game
//
//  Owns the renderer, scene, camera and the RAF loop.
//  Other systems (RoomManager, ItemManager) receive a reference to
//  `scene` and mutate it — Game doesn't know about game logic.
// ─────────────────────────────────────────────────────────────────

export class Game {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;

  private _rafId = 0;
  private _updateCallbacks: Array<(dt: number) => void> = [];
  private _lastTime = 0;

  constructor(container: HTMLElement) {
    // ── Renderer ────────────────────────────────────────────────
    this.renderer = new WebGLRenderer({ antialias: true, alpha: false });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    // ── Scene ───────────────────────────────────────────────────
    this.scene = new Scene();
    this.scene.background = new Color(0x111111);

    // ── Camera ──────────────────────────────────────────────────
    this.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      75,
    );
    this.camera.position.set(
      CAMERA_POSITION.x,
      CAMERA_POSITION.y,
      CAMERA_POSITION.z,
    );

    // ── Lights ──────────────────────────────────────────────────
    this._setupLights();

    // ── Resize ──────────────────────────────────────────────────
    window.addEventListener("resize", this._onResize);
  }

  // ─── Lifecycle ──────────────────────────────────────────────────

  start(): void {
    this._lastTime = performance.now();
    this._tick(this._lastTime);
  }

  stop(): void {
    cancelAnimationFrame(this._rafId);
  }

  dispose(): void {
    this.stop();
    window.removeEventListener("resize", this._onResize);
    this.renderer.dispose();
  }

  // ─── Update hook ────────────────────────────────────────────────

  /** Register a per-frame callback that receives delta time in seconds. */
  onUpdate(cb: (dt: number) => void): void {
    this._updateCallbacks.push(cb);
  }

  // ─── Private ────────────────────────────────────────────────────

  private _setupLights(): void {
    const ambient = new AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const sun = new DirectionalLight(0xffffff, 1.2);
    sun.position.set(4, 8, 2);
    sun.shadow.mapSize.set(2048, 2048); // выше разрешение = меньше "пикселизации" при размытии
    sun.shadow.radius = 6; // главный параметр мягкости (2–6 обычно оптимально)
    sun.shadow.bias = -0.0005; // убирает артефакты "самотенения" (shadow acne)
    sun.shadow.normalBias = 0.02; // дополнительно сглаживает стыки геометрии
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.1;
    sun.shadow.camera.far = 30;
    sun.shadow.camera.left = -8;
    sun.shadow.camera.right = 8;
    sun.shadow.camera.top = 8;
    sun.shadow.camera.bottom = -8;
    this.scene.add(sun);
  }

  private _tick = (time: number): void => {
    this._rafId = requestAnimationFrame(this._tick);
    const dt = (time - this._lastTime) / 1000;
    this._lastTime = time;

    for (const cb of this._updateCallbacks) cb(dt);

    this.renderer.render(this.scene, this.camera);
  };

  private _onResize = (): void => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
