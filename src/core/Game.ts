import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  Color,
  EquirectangularReflectionMapping,
} from "three";
import { CAMERA_POSITION } from "../config/gameConfig";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";

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
  private rgbeLoader = new RGBELoader();

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
    this.rgbeLoader.load("/environmentMaps/1/2k.hdr", (environmentMap) => {
      environmentMap.mapping = EquirectangularReflectionMapping;

      this.scene.environment = environmentMap;
    });

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

    this._setupLights();

    window.addEventListener("resize", this._onResize);
  }

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

  onUpdate(cb: (dt: number) => void): void {
    this._updateCallbacks.push(cb);
  }

  private _setupLights(): void {
    const ambient = new AmbientLight(0xffffff, 0.8);
    this.scene.add(ambient);

    const sun = new DirectionalLight(0xffffff, 1.2);
    sun.position.set(4, 8, 2);
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.radius = 6;
    sun.shadow.bias = -0.0005;
    sun.shadow.normalBias = 0.02;
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
