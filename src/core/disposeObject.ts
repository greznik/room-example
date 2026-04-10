import {
  Object3D,
  Mesh,
  Material,
  BufferGeometry,
  Texture,
  MeshStandardMaterial,
  MeshBasicMaterial,
  AnimationMixer,
} from 'three'

/** Текстурные слоты, присутствующие в MeshBasicMaterial (минимальная база) */
const BASIC_TEXTURE_SLOTS = ['map', 'lightMap', 'aoMap', 'alphaMap', 'envMap'] as const
type BasicTextureSlot = typeof BASIC_TEXTURE_SLOTS[number]

/** Дополнительные слоты только у MeshStandardMaterial и его наследников */
const STANDARD_TEXTURE_SLOTS = [
  'normalMap',
  'roughnessMap',
  'metalnessMap',
  'emissiveMap',
  'displacementMap',
  'bumpMap',
] as const
type StandardTextureSlot = typeof STANDARD_TEXTURE_SLOTS[number]

function disposeTexture(mat: MeshBasicMaterial, slot: BasicTextureSlot): void {
  const tex = mat[slot]
  if (tex instanceof Texture) tex.dispose()
}

function disposeStandardTexture(mat: MeshStandardMaterial, slot: StandardTextureSlot): void {
  const tex = mat[slot]
  if (tex instanceof Texture) tex.dispose()
}

/** Рекурсивно освобождает геометрии, материалы и текстуры объекта */
export function disposeObject(object: Object3D): void {
  object.traverse((node) => {
    if (!(node instanceof Mesh)) return

    if (node.geometry instanceof BufferGeometry) {
      node.geometry.dispose()
    }

    const materials = Array.isArray(node.material)
      ? (node.material as Material[])
      : [node.material as Material]

    for (const mat of materials) {
      if (mat instanceof MeshBasicMaterial) {
        for (const slot of BASIC_TEXTURE_SLOTS) {
          disposeTexture(mat, slot)
        }
      }
      if (mat instanceof MeshStandardMaterial) {
        for (const slot of STANDARD_TEXTURE_SLOTS) {
          disposeStandardTexture(mat, slot)
        }
      }
      mat.dispose()
    }
  })

  object.parent?.remove(object)
}

/** Освободить mixer персонажа */
export function disposeMixer(mixer: AnimationMixer): void {
  mixer.stopAllAction()
  mixer.uncacheRoot(mixer.getRoot())
}
