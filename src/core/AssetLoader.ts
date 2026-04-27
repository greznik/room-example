import {
  LoadingManager,
  Group,
  WebGLRenderer,
  Texture,
  EquirectangularReflectionMapping,
  PMREMGenerator,
  CompressedTexture,
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
  private static instance: AssetLoader | null = null;

  private readonly gltfLoader: GLTFLoader;
  private readonly rgbeLoader: RGBELoader;
  private readonly ktx2Loader: KTX2Loader;

  private readonly gltfCache = new Map<string, GLTF>();
  private readonly envCache = new Map<string, Texture>();

  private pmrem: PMREMGenerator | null = null;
  private onProgress: LoadProgressCallback | undefined;
  private readonly startTime = performance.now();

  private constructor(onProgress?: LoadProgressCallback) {
    this.onProgress = onProgress;

    const manager = new LoadingManager();
    manager.onProgress = (_url, loaded, total) => {
      this.onProgress?.({
        loaded: Math.min(loaded / total, 0.99),
        label: "Загрузка ресурсов…",
        elapsedTime: (performance.now() - this.startTime) / 1000,
      });
    };

    const draco = new DRACOLoader(manager);
    draco.setDecoderPath(
      "https://www.gstatic.com/draco/versioned/decoders/1.5.7/",
    );

    this.ktx2Loader = new KTX2Loader(manager);
    this.ktx2Loader.setTranscoderPath("/basis/");

    this.gltfLoader = new GLTFLoader(manager);
    this.gltfLoader.setDRACOLoader(draco);
    this.gltfLoader.setKTX2Loader(this.ktx2Loader);

    this.rgbeLoader = new RGBELoader(manager);
  }

  static getInstance(onProgress?: LoadProgressCallback): AssetLoader {
    if (!AssetLoader.instance) {
      AssetLoader.instance = new AssetLoader(onProgress);
    } else if (onProgress) {
      AssetLoader.instance.onProgress = onProgress;
    }
    return AssetLoader.instance;
  }

  static reset(): void {
    AssetLoader.instance = null;
  }

  initRendererSupport(renderer: WebGLRenderer): void {
    this.ktx2Loader.detectSupport(renderer);
    this.pmrem = new PMREMGenerator(renderer);
    this.pmrem.compileEquirectangularShader();
  }

  async load(url: string): Promise<Group> {
    const gltf = await this.loadGltf(url);
    return gltf.scene.clone(true);
  }

  async loadGltf(url: string): Promise<GLTF> {
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
    return gltf;
  }

  async loadEnvMap(url: string): Promise<Texture> {
    const cached = this.envCache.get(url);
    if (cached) return cached;

    if (!this.pmrem) {
      throw new Error(
        "[AssetLoader] Call initRendererSupport(renderer) before loadEnvMap",
      );
    }

    let pmremTex: Texture;

    if (url.endsWith(".ktx2")) {
      const compressed = await new Promise<CompressedTexture>(
        (resolve, reject) => {
          this.ktx2Loader.load(url, resolve, undefined, reject);
        },
      );
      compressed.mapping = EquirectangularReflectionMapping;
      pmremTex = this.pmrem.fromEquirectangular(compressed).texture;
      compressed.dispose();
    } else {
      const hdrTex = await this.rgbeLoader.loadAsync(url);
      hdrTex.mapping = EquirectangularReflectionMapping;
      pmremTex = this.pmrem.fromEquirectangular(hdrTex).texture;
      hdrTex.dispose();
    }

    this.envCache.set(url, pmremTex);
    return pmremTex;
  }

  async preloadBatch(urls: string[]): Promise<void> {
    await Promise.allSettled(urls.map((u) => this.load(u)));
  }

  getElapsedTime(): number {
    return (performance.now() - this.startTime) / 1000;
  }
}
