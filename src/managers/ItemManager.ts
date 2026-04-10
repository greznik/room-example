import { AssetLoader } from '../core/AssetLoader'
import { Item } from '../entities/Item'
import { ITEM_CONFIGS } from '../config/gameConfig'
import type { Room } from '../entities/Room'

export class ItemManager {
  private readonly loader: AssetLoader
  private activeItems: Item[] = []

  constructor(loader: AssetLoader) {
    this.loader = loader
  }

  async populateRoom(room: Room): Promise<void> {
    this.clearActiveItems()

    const { assignments } = room.config
    if (!assignments.length) return

    await Promise.all(
      assignments.map(async ({ slotName, itemId }) => {
        const slot = room.getSlot(slotName)
        if (!slot) {
          console.warn(`[ItemManager] Слот "${slotName}" не найден в комнате ${room.config.id}`)
          return
        }

        const conf = ITEM_CONFIGS.find(c => c.id === itemId)
        if (!conf) {
          console.warn(`[ItemManager] Предмет "${itemId}" не найден в ITEM_CONFIGS`)
          return
        }

        const group = await this.loader.load(conf.modelPath)
        const item = new Item(conf, group)
        item.attachToSlot(slot.anchor)
        this.activeItems.push(item)
      })
    )
  }

  /** Запустить анимацию появления всех предметов в комнате */
  spawnAll(): void {
    for (const item of this.activeItems) {
      item.spawn()
    }
  }

  /** Вызывать каждый кадр */
  update(dt: number): void {
    for (const item of this.activeItems) {
      item.update(dt)
    }
  }

  clearActiveItems(): void {
    for (const item of this.activeItems) item.detach()
    this.activeItems = []
  }
}