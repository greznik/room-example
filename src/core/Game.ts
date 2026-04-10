import {
  WebGLRenderer,
  Scene,
  PerspectiveCamera,
  DirectionalLight,
  AmbientLight,
  PCFSoftShadowMap,
  Object3D,
} from 'three'
import { GAME_CONFIG } from '../config/gameConfig'

type TickCallback = (dt: number) => void

export class Game {
  readonly renderer: WebGLRenderer
  readonly scene: Scene
  readonly camera: PerspectiveCamera

  private rafId = 0
  private updateCallbacks: TickCallback[] = []
  private lastTime = 0
  private trackedRoot: Object3D | null = null

  constructor(container: HTMLElement) {
    const rc = GAME_CONFIG.renderer

    this.renderer = new WebGLRenderer({ antialias: rc.antialias })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, rc.pixelRatioClamp))
    this.renderer.shadowMap.enabled = rc.shadowMapEnabled
    this.renderer.shadowMap.type = PCFSoftShadowMap
    this.renderer.toneMapping = rc.toneMapping
    this.renderer.toneMappingExposure = rc.toneMappingExposure
    this.renderer.outputColorSpace = rc.outputColorSpace
    this.renderer.setSize(window.innerWidth, window.innerHeight)
    container.appendChild(this.renderer.domElement)

    this.scene = new Scene()

    const { offset } = GAME_CONFIG.camera
    this.camera = new PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.01, 100)
    this.camera.position.set(offset.x, offset.y, offset.z)

    this.setupLights()
    window.addEventListener('resize', this.onResize)
  }

  trackObject(root: Object3D): void { this.trackedRoot = root }

  start(): void {
    this.lastTime = performance.now()
    this.tick(this.lastTime)
  }

  stop(): void { cancelAnimationFrame(this.rafId) }

  dispose(): void {
    this.stop()
    window.removeEventListener('resize', this.onResize)
    this.renderer.dispose()
  }

  onUpdate(cb: TickCallback): void { this.updateCallbacks.push(cb) }

  private setupLights(): void {
    this.scene.add(new AmbientLight(0xffffff, 1.5))
    const sun = new DirectionalLight(0xffffff, 1.5)
    sun.position.set(2, 3, 1)
    sun.castShadow = true
    sun.shadow.bias = -0.0005
    sun.shadow.normalBias = 0.05
    sun.shadow.radius = 4
    sun.shadow.mapSize.set(1024, 1024)
    Object.assign(sun.shadow.camera, { near: 0.1, far: 40, left: -8, right: 8, top: 8, bottom: -8 })
    this.scene.add(sun)
  }

  private tick = (time: number): void => {
    this.rafId = requestAnimationFrame(this.tick)
    const dt = Math.min((time - this.lastTime) / 1000, 0.05)
    this.lastTime = time

    for (const cb of this.updateCallbacks) cb(dt)

    if (this.trackedRoot) {
      const { offset, lerp } = GAME_CONFIG.camera
      const tx = this.trackedRoot.position.x + offset.x
      this.camera.position.x += (tx - this.camera.position.x) * lerp
      this.camera.lookAt(this.trackedRoot.position.x, 1.0, 0)
    }

    this.renderer.render(this.scene, this.camera)
  }

  private onResize = (): void => {
    const w = window.innerWidth, h = window.innerHeight
    this.camera.aspect = w / h
    this.camera.updateProjectionMatrix()
    this.renderer.setSize(w, h)
  }
}
