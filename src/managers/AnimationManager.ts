import { AnimationMixer, LoopRepeat, Object3D } from 'three'
import type { GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js'

type State = 'idle' | 'walk'

export class AnimationManager {
  private mixer: AnimationMixer | null = null
  private idle: ReturnType<AnimationMixer['clipAction']> | null = null
  private walk: ReturnType<AnimationMixer['clipAction']> | null = null
  private current: State = 'idle'

  initFromGLTF(gltf: GLTF, root: Object3D, idleName: string, walkName: string) {
    this.dispose()
    this.mixer = new AnimationMixer(root)

    const find = (name: string) =>
      gltf.animations.find(c => c.name.toLowerCase() === name.toLowerCase())

    const idleClip = find(idleName)
    const walkClip = find(walkName)

    if (idleClip) {
      this.idle = this.mixer.clipAction(idleClip)
      this.idle.setLoop(LoopRepeat, Infinity).play()
    } else {
      console.warn(`[AnimationManager] clip "${idleName}" not found`)
    }

    if (walkClip) {
      this.walk = this.mixer.clipAction(walkClip)
      this.walk.setLoop(LoopRepeat, Infinity).setEffectiveWeight(0).play()
    } else {
      console.warn(`[AnimationManager] clip "${walkName}" not found`)
    }

    this.current = 'idle'
  }

  play(state: State) {
    if (this.current === state) return
    const from = state === 'walk' ? this.idle : this.walk
    const to   = state === 'walk' ? this.walk : this.idle
    if (!from || !to) return
    to.enabled = true
    to.setEffectiveTimeScale(1).setEffectiveWeight(1)
    from.crossFadeTo(to, 0.25, true)
    this.current = state
  }

  update(dt: number) { this.mixer?.update(dt) }

  dispose() {
    this.mixer?.stopAllAction()
    this.mixer?.uncacheRoot(this.mixer.getRoot())
    this.mixer = null
    this.idle = null
    this.walk = null
  }
}
