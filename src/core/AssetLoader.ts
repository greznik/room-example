import {
  LoadingManager,
  type Group,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';
import type { LoadProgressCallback } from '../types';

// ─────────────────────────────────────────────────────────────────
//  AssetLoader
//
//  Singleton wrapper around GLTFLoader + DRACOLoader.
//  • Caches loaded models by URL (returns clones on cache hit).
//  • Aggregates progress across multiple simultaneous loads.
// ─────────────────────────────────────────────────────────────────

export class AssetLoader {
  private static _instance: AssetLoader;

  private readonly gltfLoader: GLTFLoader;
  private readonly cache = new Map<string, Group>();

  private constructor(onProgress?: LoadProgressCallback) {
    const manager = new LoadingManager();

    manager.onProgress = (_url, loaded, total) => {
      onProgress?.({
        loaded: loaded / total,
        label: `Loading assets… (${loaded}/${total})`,
      });
    };

    const dracoLoader = new DRACOLoader(manager);
    // Use Google's hosted Draco WASM decoder — no local copy needed.
    dracoLoader.setDecoderPath(
      'https://www.gstatic.com/draco/versioned/decoders/1.5.7/'
    );
    dracoLoader.preload();

    this.gltfLoader = new GLTFLoader(manager);
    this.gltfLoader.setDRACOLoader(dracoLoader);
  }

  // ─── Singleton ──────────────────────────────────────────────────

  static getInstance(onProgress?: LoadProgressCallback): AssetLoader {
    if (!AssetLoader._instance) {
      AssetLoader._instance = new AssetLoader(onProgress);
    }
    return AssetLoader._instance;
  }

  // ─── Public API ─────────────────────────────────────────────────

  /** Load a GLTF/GLB and return the scene Group (cloned from cache). */
  async load(url: string): Promise<Group> {
    const cached = this.cache.get(url);
    if (cached) {
      return cached.clone(true);
    }

    const gltf = await this.gltfLoader.loadAsync(url);
    const scene = gltf.scene;
    scene.traverse((node) => {
      if ('isMesh' in node && node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    this.cache.set(url, scene);
    return scene.clone(true);
  }

  /** Pre-warm the cache for a list of URLs. */
  async preloadAll(
    urls: string[],
    onProgress?: LoadProgressCallback
  ): Promise<void> {
    const unique = [...new Set(urls)];
    let done = 0;

    await Promise.all(
      unique.map(async (url) => {
        await this.load(url);
        done++;
        onProgress?.({
          loaded: done / unique.length,
          label: `Loaded ${done} / ${unique.length} assets`,
        });
      })
    );
  }
}