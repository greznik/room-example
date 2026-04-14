import { AssetLoader } from '../core/AssetLoader'
import { Item } from '../entities/Item'
import { GAME_CONFIG } from '../config/gameConfig'
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

        const conf = GAME_CONFIG.items.find((c) => c.id === itemId)
        if (!conf) {
          console.warn(`[ItemManager] Предмет "${itemId}" не найден в конфиге`)
          return
        }

        const group = await this.loader.load(conf.modelPath)
        const item = new Item(conf, group)
        item.attachToSlot(slot.anchor)
        this.activeItems.push(item)
      }),
    )
  }

  spawnAll(): void {
    for (const item of this.activeItems) item.spawn()
  }

  update(dt: number): void {
    for (const item of this.activeItems) item.update(dt)
  }

  clearActiveItems(): void {
    for (const item of this.activeItems) item.detach()
    this.activeItems = []
  }
}
