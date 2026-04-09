import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  AmbientLight,
  DirectionalLight,
  PCFSoftShadowMap,
  ACESFilmicToneMapping,
  SRGBColorSpace,
} from "three";
import { CAMERA_OFFSET, CAMERA_LERP } from "../config/gameConfig";
import type { Player } from "../entities/Player";

export class Game {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;

  private rafId = 0;
  private updateCallbacks: Array<(dt: number) => void> = [];
  private lastTime = 0;
  private player: Player | null = null;

  constructor(container: HTMLElement) {
    this.renderer = new WebGLRenderer({ antialias: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = ACESFilmicToneMapping;
    this.renderer.outputColorSpace = SRGBColorSpace;
    this.renderer.toneMappingExposure = 1;
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(this.renderer.domElement);

    this.scene = new Scene();

    this.camera = new PerspectiveCamera(
      45,
      window.innerWidth / window.innerHeight,
      0.01,
      100,
    );
    this.camera.position.set(CAMERA_OFFSET.x, CAMERA_OFFSET.y, CAMERA_OFFSET.z);

    this.setupLights();
    window.addEventListener("resize", this.onResize);
  }

  registerPlayer(player: Player): void {
    this.player = player;
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
  }

  onUpdate(cb: (dt: number) => void): void {
    this.updateCallbacks.push(cb);
  }

  private setupLights(): void {
    this.scene.add(new AmbientLight(0xffffff, 0.5));
    const sun = new DirectionalLight(0xffffff, 1.8);
    sun.position.set(2, 8, 4);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    Object.assign(sun.shadow.camera, {
      near: 0.1,
      far: 30,
      left: -8,
      right: 8,
      top: 8,
      bottom: -8,
    });
    this.scene.add(sun);
  }

  private tick = (time: number): void => {
    this.rafId = requestAnimationFrame(this.tick);
    const dt = Math.min((time - this.lastTime) / 1000, 0.1);
    this.lastTime = time;

    // Обновляем игрока (движение + анимации)
    this.player?.update(dt);

    for (const cb of this.updateCallbacks) cb(dt);

    // Плавная камера за персонажем (только по X)
    if (this.player) {
      const tx = this.player.root.position.x + CAMERA_OFFSET.x;
      this.camera.position.x += (tx - this.camera.position.x) * CAMERA_LERP;
      this.camera.lookAt(this.player.root.position.x, 1.0, 0);
    }

    this.renderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    const w = window.innerWidth,
      h = window.innerHeight;
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
  };
}
