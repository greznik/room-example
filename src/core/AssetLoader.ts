import {
  LoadingManager,
  Group,
  WebGLRenderer,
  Texture,
  EquirectangularReflectionMapping,
} from "three";
import {
  GLTFLoader,
  type GLTF,
} from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { KTX2Loader } from "three/examples/jsm/loaders/KTX2Loader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import type { LoadProgressCallback } from "../types";

export class AssetLoader {
  private static instance: AssetLoader;

  private readonly gltfLoader: GLTFLoader;
  private readonly rgbeLoader: RGBELoader;

  // Кэш: url → оригинальный Group (клонируем на выдаче)
  private readonly meshCache = new Map<string, Group>();
  // Кэш: url → оригинальный GLTF (для доступа к animations)
  private readonly gltfCache = new Map<string, GLTF>();
  // Кэш: url → HDR Texture
  private readonly envCache = new Map<string, Texture>();

  private readonly startTime = performance.now();

  private constructor(onProgress?: LoadProgressCallback) {
    const manager = new LoadingManager();

    manager.onProgress = (_url, loaded, total) => {
      onProgress?.({
        loaded: Math.min(loaded / total, 0.99),
        label: "Загрузка ресурсов…",
        elapsedTime: (performance.now() - this.startTime) / 1000,
      });
    };

    const draco = new DRACOLoader(manager);
    draco.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
    );

    const ktx2 = new KTX2Loader(manager);
    ktx2.setTranscoderPath("/basis/");

    this.gltfLoader = new GLTFLoader(manager);
    this.gltfLoader.setDRACOLoader(draco);
    this.gltfLoader.setKTX2Loader(ktx2);

    this.rgbeLoader = new RGBELoader(manager);
  }

  static getInstance(onProgress?: LoadProgressCallback): AssetLoader {
    if (!AssetLoader.instance)
      AssetLoader.instance = new AssetLoader(onProgress);
    return AssetLoader.instance;
  }

  initRendererSupport(renderer: WebGLRenderer): void {
    (this.gltfLoader.ktx2Loader as KTX2Loader)?.detectSupport(renderer);
  }

  /** Загрузить GLB → клонированный Group (для комнат и предметов) */
  async load(url: string): Promise<Group> {
    const cached = this.meshCache.get(url);
    if (cached) return cached.clone(true);

    const gltf = await this.fetchGltf(url);
    return gltf.scene.clone(true);
  }

  async loadGltf(url: string): Promise<GLTF> {
    const cached = this.gltfCache.get(url);
    if (cached) return cached;
    return this.fetchGltf(url);
  }

  async loadEnvMap(hdrUrl: string): Promise<Texture> {
    const cached = this.envCache.get(hdrUrl);
    if (cached) return cached;

    const tex = await this.rgbeLoader.loadAsync(hdrUrl);
    tex.mapping = EquirectangularReflectionMapping;
    this.envCache.set(hdrUrl, tex);
    return tex;
  }

  async preloadBatch(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.map((u) => this.load(u)));
  }

  getElapsedTime(): number {
    return (performance.now() - this.startTime) / 1000;
  }

  private async fetchGltf(url: string): Promise<GLTF> {
    const cached = this.gltfCache.get(url);
    if (cached) return cached;

    const gltf = await this.gltfLoader.loadAsync(url);

    gltf.scene.traverse((node) => {
      if ("isMesh" in node && node.isMesh) {
        node.castShadow = true;
        node.receiveShadow = true;
      }
    });

    this.gltfCache.set(url, gltf);
    this.meshCache.set(url, gltf.scene);
    return gltf;
  }
}
