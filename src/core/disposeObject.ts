import { Object3D, AnimationMixer, SkinnedMesh } from "three";

export function disposeObject(object: Object3D): void {
  object.traverse((node) => {
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
