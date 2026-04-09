<template>
  <div id="app">
    <!-- Canvas: Three.js рисует сюда -->
    <div ref="canvasContainer" class="canvas-wrap" />

    <!-- LoadingScreen: управляется через store, не через DOM -->
    <LoadingScreen
      :visible="store.isLoading"
      :ratio="store.loadRatio"
      :label="store.loadLabel"
      :elapsed="store.loadTime"
    />

    <!-- UI поверх игры — только после загрузки -->
    <template v-if="!store.isLoading">
      <div class="top-bar">
        <span>Комната {{ store.currentRoom }} / {{ store.totalRooms }}</span>
        <span class="time-badge">{{ store.loadTime.toFixed(1) }}с</span>
      </div>

      <div class="controls">
        <button :disabled="busy" @click="nav('prev')">← Пред</button>
        <button :disabled="busy" @click="nav('next')">След →</button>
      </div>

      <!-- <div class="characters">
        <button
          v-for="(char, i) in CHARACTERS_CONFIG"
          :key="char.id"
          :class="{ active: store.selectedCharacter === i }"
          @click="switchChar(i)"
        >
          {{ char.name }}
        </button>
      </div> -->
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useGameStore } from "./store/gameStore";
import { GameInitializer } from "./core/InitializeGame";
import LoadingScreen from "./LoadingScreen.vue";
import type { GameController } from "./types/GameController";

const store = useGameStore();
const canvasContainer = ref<HTMLDivElement | null>(null);
const controller = ref<GameController | null>(null);
const busy = ref(false);

onMounted(async () => {
  if (!canvasContainer.value) return;

  const initializer = new GameInitializer();

  controller.value = await initializer.initialize(
    canvasContainer.value,
    // Колбэк прогресса → напрямую в store
    (ratio, label, elapsed) => store.setProgress(ratio, label, elapsed),
  );

  store.setLoading(false);
  store.start(); // запустит game.start() через store-action
});

async function nav(dir: "next" | "prev") {
  if (busy.value || !controller.value) return;
  busy.value = true;
  await (dir === "next"
    ? controller.value.goNext()
    : controller.value.goPrev());
  busy.value = false;
}
</script>

<style>
* {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  overflow: hidden;
  background: #0a0a0a;
  font-family: system-ui, sans-serif;
  color: #fff;
  touch-action: none;
}

.canvas-wrap {
  position: fixed;
  inset: 0;
  z-index: 1;
}

.top-bar {
  position: fixed;
  top: 20px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 16px;
  font-size: 14px;
  background: rgba(0, 0, 0, 0.6);
  padding: 6px 14px;
  border-radius: 8px;
}

.time-badge {
  color: #fbbf24;
}

.controls,
.characters {
  position: fixed;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 8px;
}

.controls {
  bottom: 64px;
}
.characters {
  bottom: 16px;
}

button {
  padding: 8px 14px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  cursor: pointer;
  transition: background 0.2s;
}
button:hover {
  background: rgba(255, 255, 255, 0.2);
}
button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
button.active {
  background: #4ade80;
  color: #000;
  font-weight: bold;
  border-color: transparent;
}
</style>
