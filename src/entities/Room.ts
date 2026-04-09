import { Group, Object3D } from "three";
import type { RoomConfig, SlotDescriptor } from "../types";

export class Room {
  readonly config: RoomConfig;
  readonly root: Group;
  private readonly slots_map = new Map<string, SlotDescriptor>();

  constructor(config: RoomConfig, sceneGroup: Group) {
    this.config = config;
    this.root = sceneGroup;
    this.resolveSlots(config.slots);
  }

  get slots(): SlotDescriptor[] {
    return [...this.slots_map.values()];
  }

  addToScene(parent: { add: (o: Object3D) => void }): void {
    parent.add(this.root);
  }

  removeFromScene(): void {
    this.root.parent?.remove(this.root);
  }

  private resolveSlots(slotNames: string[]): void {
    const found = new Set<string>();
    this.root.traverse((node) => {
      if (slotNames.includes(node.name)) {
        this.slots_map.set(node.name, { name: node.name, anchor: node });
        found.add(node.name);
      }
    });

    for (const name of slotNames) {
      if (!found.has(name)) {
        console.warn(
          `[Room ${this.config.id}] Слот "${name}" не найден в модели.`,
        );
      }
    }
  }
}
