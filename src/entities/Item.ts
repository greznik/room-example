import { Group, Object3D } from 'three';
import type { ItemConfig } from '../types';

export class Item {
  readonly config: ItemConfig;
  readonly root: Group;

  constructor(config: ItemConfig, sceneGroup: Group) {
    this.config = config;
    this.root = sceneGroup;
  }

  attachToSlot(anchor: Object3D): void {
    this.root.position.set(0, 0, 0);
    this.root.rotation.set(0, 0, 0);
    anchor.add(this.root);
  }

  detach(): void { this.root.parent?.remove(this.root); }
}