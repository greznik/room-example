/**
 * LightingSystem.ts
 *
 * Создаёт Three.js-источники из конфига комнаты и переключает их при смене комнаты.
 * Поддерживает: AmbientLight, HemisphereLight, DirectionalLight, SpotLight, PointLight.
 * Возвращает живые экземпляры для передачи в LightDebugger.
 */

import {
  Scene,
  AmbientLight,
  HemisphereLight,
  DirectionalLight,
  SpotLight,
  PointLight,
  OrthographicCamera,
} from "three";
import type {
  RoomLightingConfig,
  AmbientLightDef,
  HemisphereLightDef,
  DirectionalLightDef,
  SpotLightDef,
  PointLightDef,
} from "../config/roomsConfig";

export interface SceneLights {
  ambient: AmbientLight[];
  hemisphere: HemisphereLight[];
  directional: DirectionalLight[];
  spot: SpotLight[];
  point: PointLight[];
}

export class LightingSystem {
  private readonly scene: Scene;
  private active: SceneLights = this.empty();

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /** Применить конфиг освещения. Старые огни автоматически удаляются. */
  applyRoomLighting(config: RoomLightingConfig): SceneLights {
    this.clearLights();

    for (const def of config.ambient ?? []) {
      const light = this.makeAmbient(def);
      this.scene.add(light);
      this.active.ambient.push(light);
    }

    for (const def of config.hemisphere ?? []) {
      const light = this.makeHemisphere(def);
      this.scene.add(light);
      this.active.hemisphere.push(light);
    }

    for (const def of config.directional ?? []) {
      const light = this.makeDirectional(def);
      this.scene.add(light);
      this.scene.add(light.target);
      this.active.directional.push(light);
    }

    for (const def of config.spot ?? []) {
      const light = this.makeSpot(def);
      this.scene.add(light);
      this.scene.add(light.target);
      this.active.spot.push(light);
    }

    for (const def of config.point ?? []) {
      const light = this.makePoint(def);
      this.scene.add(light);
      this.active.point.push(light);
    }

    return this.snapshot();
  }

  getActiveLights(): SceneLights {
    return this.snapshot();
  }

  dispose(): void {
    this.clearLights();
  }

  // ─── Фабрики ──────────────────────────────────────────────────────────────────

  private makeAmbient(def: AmbientLightDef): AmbientLight {
    const light = new AmbientLight(def.color, def.intensity);
    light.name = def.label ?? "Ambient";
    light.visible = def.enabled ?? true;
    return light;
  }

  private makeHemisphere(def: HemisphereLightDef): HemisphereLight {
    const light = new HemisphereLight(def.skyColor, def.groundColor, def.intensity);
    light.name = def.label ?? "Hemisphere";
    light.visible = def.enabled ?? true;
    return light;
  }

  private makeDirectional(def: DirectionalLightDef): DirectionalLight {
    const light = new DirectionalLight(def.color, def.intensity);
    light.name = def.label ?? "Directional";
    light.position.set(...def.position);
    light.target.position.set(...(def.target ?? [0, 0, 0]));
    light.visible = def.enabled ?? true;
    light.castShadow = def.castShadow ?? false;

    if (light.castShadow) {
      const size = def.shadowMapSize ?? 1024;
      light.shadow.mapSize.set(size, size);
      light.shadow.bias = def.shadowBias ?? -0.0003;
      light.shadow.normalBias = def.shadowNormalBias ?? 0.02;

      const ext = def.shadowCameraSize ?? 10;
      const cam = light.shadow.camera as OrthographicCamera;
      cam.left   = -ext;
      cam.right  =  ext;
      cam.top    =  ext;
      cam.bottom = -ext;
      cam.near   = 0.5;
      cam.far    = 40;
      cam.updateProjectionMatrix();
    }

    return light;
  }

  private makeSpot(def: SpotLightDef): SpotLight {
    const light = new SpotLight(def.color, def.intensity);
    light.name = def.label ?? "Spot";
    light.position.set(...def.position);
    light.target.position.set(...def.target);
    light.angle    = def.angle;
    light.penumbra = def.penumbra;
    light.decay    = def.decay;
    light.distance = def.distance;
    light.visible  = def.enabled ?? true;
    light.castShadow = def.castShadow ?? false;

    if (light.castShadow) {
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.bias = -0.0003;
    }

    return light;
  }

  private makePoint(def: PointLightDef): PointLight {
    const light = new PointLight(def.color, def.intensity, def.distance, def.decay);
    light.name = def.label ?? "Point";
    light.position.set(...def.position);
    light.visible  = def.enabled ?? true;
    light.castShadow = def.castShadow ?? false;

    if (light.castShadow) {
      light.shadow.mapSize.set(1024, 1024);
      light.shadow.bias = -0.0003;
    }

    return light;
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────────

  private clearLights(): void {
    for (const l of this.active.ambient)     l.removeFromParent();
    for (const l of this.active.hemisphere)  l.removeFromParent();
    for (const l of this.active.directional) { l.target.removeFromParent(); l.removeFromParent(); }
    for (const l of this.active.spot)        { l.target.removeFromParent(); l.removeFromParent(); }
    for (const l of this.active.point)       l.removeFromParent();
    this.active = this.empty();
  }

  private snapshot(): SceneLights {
    return {
      ambient:     [...this.active.ambient],
      hemisphere:  [...this.active.hemisphere],
      directional: [...this.active.directional],
      spot:        [...this.active.spot],
      point:       [...this.active.point],
    };
  }

  private empty(): SceneLights {
    return { ambient: [], hemisphere: [], directional: [], spot: [], point: [] };
  }
}
