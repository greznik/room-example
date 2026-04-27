/**
 * LightDebugger.ts
 *
 * GUI-дебаггер для всех типов света текущей комнаты.
 * Пересоздаётся при каждой смене комнаты через .attach().
 *
 * Поддерживает:
 *   - AmbientLight    — color, intensity, enabled
 *   - HemisphereLight — skyColor, groundColor, intensity, enabled
 *   - DirectionalLight — position, target, color, intensity, shadows, enabled + helper
 *   - SpotLight        — position, target, color, intensity, angle, penumbra, decay, distance, shadows, enabled + helper
 *   - PointLight       — position, color, intensity, distance, decay, shadows, enabled + helper
 */

import GUI from "lil-gui";
import {
  Scene,
  AmbientLight,
  HemisphereLight,
  DirectionalLight,
  DirectionalLightHelper,
  SpotLight,
  SpotLightHelper,
  PointLight,
  PointLightHelper,
} from "three";
import type { SceneLights } from "../core/LightingSystem";

type ShadowLight = DirectionalLight | SpotLight | PointLight;
type AnyHelper = DirectionalLightHelper | SpotLightHelper | PointLightHelper;

export class LightDebugger {
  private gui: GUI | null = null;
  private helpers: AnyHelper[] = [];
  private readonly scene: Scene;

  constructor(scene: Scene) {
    this.scene = scene;
  }

  /**
   * Привязать GUI к источникам текущей комнаты.
   * Предыдущий GUI и все хелперы удаляются автоматически.
   */
  attach(lights: SceneLights, roomLabel: string): void {
    this.detach();

    this.gui = new GUI({ title: `Lights ${roomLabel}`, closeFolders: true }).close();

    for (const l of lights.ambient) this.addAmbient(l);
    for (const l of lights.hemisphere) this.addHemisphere(l);
    for (const l of lights.directional) this.addDirectional(l);
    for (const l of lights.spot) this.addSpot(l);
    for (const l of lights.point) this.addPoint(l);
  }

  /** Вызывать каждый кадр — обновляет визуальные хелперы. */
  update(): void {
    for (const h of this.helpers) h.update();
  }

  /** Убрать GUI и хелперы без уничтожения самого дебаггера. */
  detach(): void {
    this.gui?.destroy();
    this.gui = null;

    for (const h of this.helpers) {
      h.removeFromParent();
      h.dispose();
    }
    this.helpers = [];
  }

  dispose(): void {
    this.detach();
  }

  private addFolder(name: string): GUI {
    return this.gui!.addFolder(name).close();
  }

  // ─── AmbientLight ─────────────────────────────────────────────────────────────

  private addAmbient(light: AmbientLight): void {
    const folder = this.addFolder(light.name);
    folder.add(light, "visible").name("enabled");
    this.addColorControl(folder, light);
    folder.add(light, "intensity", 0, 10, 0.01).name("intensity");
    this.addLogButton(folder, light.name, () => ({
      color: "#" + light.color.getHexString(),
      intensity: light.intensity,
      enabled: light.visible,
    }));
  }

  // ─── HemisphereLight ──────────────────────────────────────────────────────────

  private addHemisphere(light: HemisphereLight): void {
    const folder = this.addFolder(light.name);
    folder.add(light, "visible").name("enabled");
    folder.add(light, "intensity", 0, 10, 0.01).name("intensity");

    const sky = { color: "#" + light.color.getHexString() };
    folder
      .addColor(sky, "color")
      .name("sky color")
      .onChange((v: string) => light.color.set(v));

    const ground = { color: "#" + light.groundColor.getHexString() };
    folder
      .addColor(ground, "color")
      .name("ground color")
      .onChange((v: string) => light.groundColor.set(v));

    this.addLogButton(folder, light.name, () => ({
      skyColor: "#" + light.color.getHexString(),
      groundColor: "#" + light.groundColor.getHexString(),
      intensity: light.intensity,
      enabled: light.visible,
    }));
  }

  // ─── DirectionalLight ─────────────────────────────────────────────────────────

  private addDirectional(light: DirectionalLight): void {
    const helper = new DirectionalLightHelper(light, 0.5);
    this.scene.add(helper);
    this.helpers.push(helper);

    const folder = this.addFolder(light.name);

    folder
      .add(light, "visible")
      .name("enabled")
      .onChange((v: boolean) => {
        helper.visible = v;
      });

    this.addColorControl(folder, light);
    folder.add(light, "intensity", 0, 10, 0.01).name("intensity");

    // Позиция
    const pos = folder.addFolder("position");
    pos.add(light.position, "x", -20, 20, 0.1).name("X");
    pos.add(light.position, "y", 0, 20, 0.1).name("Y");
    pos.add(light.position, "z", -20, 20, 0.1).name("Z");

    // Target
    const tgt = folder.addFolder("target");
    tgt.add(light.target.position, "x", -20, 20, 0.1).name("X");
    tgt.add(light.target.position, "y", -10, 10, 0.1).name("Y");
    tgt.add(light.target.position, "z", -20, 20, 0.1).name("Z");

    // Тени
    this.addShadowControls(folder, light);

    folder
      .add({ helperVisible: true }, "helperVisible")
      .name("show helper")
      .onChange((v: boolean) => {
        helper.visible = v && light.visible;
      });

    this.addLogButton(folder, light.name, () => ({
      color: "#" + light.color.getHexString(),
      intensity: light.intensity,
      position: light.position.toArray(),
      target: light.target.position.toArray(),
      castShadow: light.castShadow,
      shadowBias: light.shadow.bias,
      shadowNormalBias: light.shadow.normalBias,
      shadowRadius: light.shadow.radius,
      enabled: light.visible,
    }));
  }

  // ─── SpotLight ────────────────────────────────────────────────────────────────

  private addSpot(light: SpotLight): void {
    const helper = new SpotLightHelper(light);
    this.scene.add(helper);
    this.helpers.push(helper);

    const folder = this.addFolder(light.name);

    folder
      .add(light, "visible")
      .name("enabled")
      .onChange((v: boolean) => {
        helper.visible = v;
      });

    this.addColorControl(folder, light);
    folder.add(light, "intensity", 0, 10, 0.01).name("intensity");
    folder.add(light, "angle", 0.05, Math.PI / 2, 0.01).name("angle");
    folder.add(light, "penumbra", 0, 1, 0.01).name("penumbra");
    folder.add(light, "distance", 0, 50, 0.1).name("distance");
    folder.add(light, "decay", 0, 5, 0.1).name("decay");

    // Позиция
    const pos = folder.addFolder("position");
    pos.add(light.position, "x", -20, 20, 0.1).name("X");
    pos.add(light.position, "y", 0, 20, 0.1).name("Y");
    pos.add(light.position, "z", -20, 20, 0.1).name("Z");

    // Target
    const tgt = folder.addFolder("target");
    tgt.add(light.target.position, "x", -20, 20, 0.1).name("X");
    tgt.add(light.target.position, "y", -10, 10, 0.1).name("Y");
    tgt.add(light.target.position, "z", -20, 20, 0.1).name("Z");

    // Тени
    this.addShadowControls(folder, light);

    folder
      .add({ helperVisible: true }, "helperVisible")
      .name("show helper")
      .onChange((v: boolean) => {
        helper.visible = v && light.visible;
      });

    this.addLogButton(folder, light.name, () => ({
      color: "#" + light.color.getHexString(),
      intensity: light.intensity,
      position: light.position.toArray(),
      target: light.target.position.toArray(),
      angle: light.angle,
      penumbra: light.penumbra,
      distance: light.distance,
      decay: light.decay,
      castShadow: light.castShadow,
      shadowBias: light.shadow.bias,
      shadowNormalBias: light.shadow.normalBias,
      shadowRadius: light.shadow.radius,
      enabled: light.visible,
    }));
  }

  // ─── PointLight ───────────────────────────────────────────────────────────────

  private addPoint(light: PointLight): void {
    const helper = new PointLightHelper(light, 0.5);
    this.scene.add(helper);
    this.helpers.push(helper);

    const folder = this.addFolder(light.name);

    folder
      .add(light, "visible")
      .name("enabled")
      .onChange((v: boolean) => {
        helper.visible = v;
      });

    this.addColorControl(folder, light);
    folder.add(light, "intensity", 0, 10, 0.01).name("intensity");
    folder.add(light, "distance", 0, 50, 0.1).name("distance");
    folder.add(light, "decay", 0, 5, 0.1).name("decay");

    const pos = folder.addFolder("position");
    pos.add(light.position, "x", -20, 20, 0.1).name("X");
    pos.add(light.position, "y", 0, 20, 0.1).name("Y");
    pos.add(light.position, "z", -20, 20, 0.1).name("Z");

    // Тени
    this.addShadowControls(folder, light);

    folder
      .add({ helperVisible: true }, "helperVisible")
      .name("show helper")
      .onChange((v: boolean) => {
        helper.visible = v && light.visible;
      });

    this.addLogButton(folder, light.name, () => ({
      color: "#" + light.color.getHexString(),
      intensity: light.intensity,
      position: light.position.toArray(),
      distance: light.distance,
      decay: light.decay,
      castShadow: light.castShadow,
      shadowBias: light.shadow.bias,
      shadowNormalBias: light.shadow.normalBias,
      shadowRadius: light.shadow.radius,
      enabled: light.visible,
    }));
  }

  // ─── Shadow controls ──────────────────────────────────────────────────────────

  /**
   * Универсальная секция теней для DirectionalLight / SpotLight / PointLight.
   *
   * castShadow: false → shadow.* слайдеры скрыты (нет смысла туда, лезть).
   * Включение castShadow показывает их через lil-gui .show()/.hide().
   *
   * ⚠️  mapSize нельзя менять у живого shadow map без пересоздания рендертаргета,
   *     поэтому выносим его отдельно с пометкой «требует перезагрузки».
   */
  private addShadowControls(folder: GUI, light: ShadowLight): void {
    const shadowFolder = folder.addFolder("shadows");

    shadowFolder
      .add(light, "castShadow")
      .name("castShadow")
      .onChange((enabled: boolean) => {
        // Показываем/скрываем параметры при включении/выключении
        biasCtrl.show(enabled);
        normalBiasCtrl.show(enabled);
        radiusCtrl.show(enabled);
        mapSizeNote.show(enabled);
      });

    // bias — компенсирует shadow acne (артефакты само-тени)
    // Типичные значения: от -0.001 до -0.0001
    const biasCtrl = shadowFolder
      .add(light.shadow, "bias", -0.01, 0.01, 0.0001)
      .name("bias");

    // normalBias — сдвиг по нормали, помогает при крутых углах
    // Типичные значения: 0.01..0.05
    const normalBiasCtrl = shadowFolder
      .add(light.shadow, "normalBias", 0, 0.1, 0.001)
      .name("normalBias");

    // radius — PCF-размытие тени (только PCFSoftShadowMap)
    // 1 = чёткая, 8–16 = мягкая
    const radiusCtrl = shadowFolder
      .add(light.shadow, "radius", 1, 16, 0.5)
      .name("radius (blur)");

    // mapSize — информационный, реально не меняем на лету
    const mapSizeProxy = {
      mapSize: `${light.shadow.mapSize.x} × ${light.shadow.mapSize.y}`,
    };
    const mapSizeNote = shadowFolder
      .add(mapSizeProxy, "mapSize")
      .name("mapSize (readonly)")
      .disable();

    // Начальное состояние: если тени выключены — прячем параметры
    const show = light.castShadow;
    biasCtrl.show(show);
    normalBiasCtrl.show(show);
    radiusCtrl.show(show);
    mapSizeNote.show(show);

    // По умолчанию папку тени закрываем — не засоряем UI
    shadowFolder.close();
  }

  private addColorControl(
    folder: GUI,
    light: { color: { getHexString(): string; set(v: string): void } },
  ): void {
    const proxy = { color: "#" + light.color.getHexString() };
    folder
      .addColor(proxy, "color")
      .name("color")
      .onChange((v: string) => light.color.set(v));
  }

  private addLogButton(
    folder: GUI,
    label: string,
    getData: () => Record<string, unknown>,
  ): void {
    folder
      .add({ log: () => console.log(`[Light] ${label}`, getData()) }, "log")
      .name("Log to console");
  }
}
