import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  DirectionalLight,
  AmbientLight,
  PCFSoftShadowMap,
  Object3D,
  Vector3,
} from "three";
import Stats from "stats.js";
import { GAME_CONFIG } from "../config/gameConfig";

type TickCallback = (dt: number) => void;

export class Game {
  readonly renderer: WebGLRenderer;
  readonly scene: Scene;
  readonly camera: PerspectiveCamera;

  private rafId = 0;
  private updateCallbacks: TickCallback[] = [];
  private lastTime = 0;
  private trackedRoot: Object3D | null = null;
  private container: HTMLElement;
  private stats: Stats | null = null;

  constructor(container: HTMLElement) {
    this.container = container;

    const rc = GAME_CONFIG.renderer;

    this.renderer = new WebGLRenderer({
      antialias: rc.antialias,
    });

    this.renderer.setPixelRatio(
      Math.min(window.devicePixelRatio || 1, rc.pixelRatioClamp),
    );

    this.renderer.shadowMap.enabled = rc.shadowMapEnabled;
    this.renderer.shadowMap.type = PCFSoftShadowMap;
    this.renderer.toneMapping = rc.toneMapping;
    this.renderer.toneMappingExposure = rc.toneMappingExposure;
    this.renderer.outputColorSpace = rc.outputColorSpace;

    container.appendChild(this.renderer.domElement);

    this.scene = new Scene();

    const { offset } = GAME_CONFIG.camera;

    this.camera = new PerspectiveCamera(
      GAME_CONFIG.camera.fov.desktop,
      1,
      0.01,
      100,
    );

    this.camera.position.set(offset.x, offset.y, offset.z);
    this.camera.lookAt(0, 0, 0);

    this.setupLights();
    this.addStats();

    this.onResize();
    window.addEventListener("resize", this.onResize);
  }

  trackObject(root: Object3D): void {
    this.trackedRoot = root;
  }

  addStats(): void {
    this.stats = new Stats();

    this.stats.dom.style.transform = "scale(0.7)";
    this.stats.dom.style.transformOrigin = "top left";

    if (getComputedStyle(this.container).position === "static") {
      this.container.style.position = "relative";
    }

    this.container.appendChild(this.stats.dom);
    this.stats.dom.style.zIndex = "9999";
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

    if (this.stats?.dom.parentNode) {
      this.stats.dom.remove();
    }
    this.stats = null;
  }

  onUpdate(cb: TickCallback): void {
    this.updateCallbacks.push(cb);
  }

  private setupLights(): void {
    const ambient = new AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // Основной свет
    const keyLight = new DirectionalLight(0xffffff, 1.5);
    keyLight.position.set(0.8, 4, 1);

    keyLight.castShadow = true;

    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.radius = 6;

    keyLight.shadow.bias = -0.0003;
    keyLight.shadow.normalBias = 0.02;

    const d = 10;
    Object.assign(keyLight.shadow.camera, {
      left: -d,
      right: d,
      top: d,
      bottom: -d,
      near: 0.5,
      far: 40,
    });

    this.scene.add(keyLight);
    // спереди
    const fillLight = new DirectionalLight(0xffffff, 1);
    fillLight.position.set(-2, 2, 3);

    // this.scene.add(fillLight);

    // сзади
    const rimLight = new DirectionalLight(0xffffff, 1.6);
    rimLight.position.set(0, 2, -5);

    // this.scene.add(rimLight);
  }

  private tick = (time: number): void => {
    this.rafId = requestAnimationFrame(this.tick);

    const dt = Math.min((time - this.lastTime) / 1000, 0.05);
    this.lastTime = time;

    for (const cb of this.updateCallbacks) cb(dt);

    if (this.trackedRoot) {
      const { offset, lerp, follow, zoom } = GAME_CONFIG.camera;

      const isMobile = this.container.clientWidth < 768;
      const zoomFactor = isMobile ? zoom.mobile : zoom.desktop;

      const target = this.trackedRoot.position;

      // 🎥 базовое направление камеры
      const dir = new Vector3(offset.x, offset.y, offset.z).normalize();

      // 🔥 применяем zoom через distance
      const distance =
        new Vector3(offset.x, offset.y, offset.z).length() * zoomFactor;

      const desiredPos = target.clone().addScaledVector(dir, distance);

      this.camera.position.lerp(desiredPos, lerp);

      this.camera.lookAt(target.x, follow.lookAtY, target.z);
    }

    this.stats?.update();
    this.renderer.render(this.scene, this.camera);
  };

  private onResize = (): void => {
    const rect = this.container.getBoundingClientRect();

    let width = rect.width;
    let height = rect.height;

    const isMobile = width < 768;

    if (!isMobile) {
      const size = Math.min(width, height);
      width = size;
      height = size;
    }

    this.camera.fov = isMobile
      ? GAME_CONFIG.camera.fov.mobile
      : GAME_CONFIG.camera.fov.desktop;

    const { min, max } = GAME_CONFIG.camera.aspect;

    let aspect = width / height;

    if (aspect < min) aspect = min;
    if (aspect > max) aspect = max;

    this.camera.aspect = aspect;
    this.camera.updateProjectionMatrix();

    this.renderer.setSize(width, height);

    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  };
}
