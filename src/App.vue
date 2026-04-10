<template>
  <div id="app">
    <div ref="canvasContainer" class="canvas-wrap" />

    <LoadingScreen
      :visible="store.isLoading"
      :ratio="store.loadRatio"
      :label="store.loadLabel"
      :elapsed="store.loadTime"
    />

    <template v-if="!store.isLoading">
      <div class="top-bar">
        <span>Комната {{ store.currentRoom }} / {{ store.totalRooms }}</span>
        <span class="time-badge">{{ store.loadTime.toFixed(1) }}с</span>
      </div>

      <div class="controls">
        <button :disabled="busy" @click="nav('prev')">← Пред</button>
        <button @click="store.triggerSpawn()">Показать диван</button>
        <button :disabled="busy" @click="nav('next')">След →</button>
      </div>
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
    (ratio, label, elapsed) => store.setProgress(ratio, label, elapsed),
  );
  store.setLoading(false);
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
.controls {
  position: fixed;
  bottom: 64px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 10;
  display: flex;
  gap: 8px;
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
</style>
