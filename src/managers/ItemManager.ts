import { AssetLoader } from '../core/AssetLoader'
import { Item } from '../entities/Item'
import { ITEM_CONFIGS, ITEMS_PER_ROOM } from '../config/gameConfig'
import type { Room } from '../entities/Room'

export class ItemManager {
  private readonly loader: AssetLoader
  private activeItems: Item[] = []

  constructor(loader: AssetLoader) { this.loader = loader }

  async populateRoom(room: Room): Promise<void> {
    this.clearActiveItems()

    const slots = room.slots
    if (!slots.length) return

    // Берём 5 предметов для этой комнаты по её id (не по индексу)
    const start   = (room.config.id - 1) * ITEMS_PER_ROOM
    const configs = ITEM_CONFIGS.slice(start, start + ITEMS_PER_ROOM)

    await Promise.all(
      configs.map(async (conf, i) => {
        const slot  = slots[i % slots.length]
        const group = await this.loader.load(conf.modelPath)
        const item  = new Item(conf, group)
        item.attachToSlot(slot.anchor)
        this.activeItems.push(item)
      })
    )
  }

  clearActiveItems(): void {
    for (const item of this.activeItems) item.detach()
    this.activeItems = []
  }
}
