import { Group, Object3D, MathUtils } from 'three'
import type { ItemConfig } from '../types'

const DROP_HEIGHT = 1.5   // с какой высоты падает
const DROP_SPEED  = 6     // скорость падения
const SETTLE_LERP = 0.12  // плавность финального дрожания

type Phase = 'hidden' | 'dropping' | 'settling' | 'done'

export class Item {
  readonly config: ItemConfig
  readonly root: Group

  private phase: Phase = 'hidden'
  private currentY = 0

  constructor(config: ItemConfig, sceneGroup: Group) {
    this.config = config
    this.root = sceneGroup
  }

  attachToSlot(anchor: Object3D): void {
    this.root.position.set(0, 0, 0)
    this.root.rotation.set(0, 0, 0)
    this.root.visible = false
    anchor.add(this.root)
  }

  /** Запустить анимацию появления — падение сверху + lerp на место */
  spawn(): void {
    this.currentY = DROP_HEIGHT
    this.root.position.y = DROP_HEIGHT
    this.root.visible = true
    this.phase = 'dropping'
  }

  update(dt: number): void {
    if (this.phase === 'hidden' || this.phase === 'done') return

    if (this.phase === 'dropping') {
      this.currentY -= DROP_SPEED * dt
      if (this.currentY <= 0) {
        this.currentY = 0
        this.phase = 'settling'
      }
      this.root.position.y = this.currentY

    } else if (this.phase === 'settling') {
      this.root.position.y = MathUtils.lerp(this.root.position.y, 0, SETTLE_LERP)
      if (Math.abs(this.root.position.y) < 0.001) {
        this.root.position.y = 0
        this.phase = 'done'
      }
    }
  }

  detach(): void {
    this.phase = 'hidden'
    this.root.parent?.remove(this.root)
  }
}