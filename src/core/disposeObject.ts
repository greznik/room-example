import { Object3D, AnimationMixer, SkinnedMesh, Mesh, Texture } from "three";

export function disposeObject(object: Object3D): void {
  object.traverse((node) => {
    if (!(node instanceof Mesh)) return;

    node.geometry?.dispose();

    const mats = Array.isArray(node.material) ? node.material : [node.material];
    for (const mat of mats) {
      // dispose всех текстурных слотов
      for (const key of Object.keys(mat) as (keyof typeof mat)[]) {
        const val = (mat as Record<string, unknown>)[key as string];
        if (val instanceof Texture) val.dispose();
      }
      mat.dispose();
    }

    if (node instanceof SkinnedMesh) {
      node.skeleton.dispose();
    }
  });

  object.parent?.remove(object);
}

/** Освободить mixer персонажа */
export function disposeMixer(mixer: AnimationMixer): void {
  mixer.stopAllAction();
  mixer.uncacheRoot(mixer.getRoot());
}
