<template>
  <Transition name="fade">
    <div v-if="visible" class="loading-screen">
      <p class="loading-title">Загрузка мира…</p>

      <div class="progress-track">
        <div class="progress-fill" :style="{ width: fillWidth }" />
      </div>

      <p class="loading-label">{{ label }}</p>
      <p class="loading-time">{{ timeText }}</p>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed } from "vue";

const props = defineProps<{
  visible: boolean;
  ratio: number; // 0–1
  label: string;
  elapsed: number; // секунды
}>();

const fillWidth = computed(() => `${Math.round(props.ratio * 100)}%`);
const timeText = computed(
  () => `Загружено за: ${props.elapsed.toFixed(1)} сек`,
);
</script>

<style scoped>
.loading-screen {
  position: fixed;
  inset: 0;
  background: #0a0a0a;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 18px;
  z-index: 100;
}

.loading-title {
  color: #fff;
  font-size: 22px;
  font-weight: 300;
  letter-spacing: 4px;
  text-transform: uppercase;
  margin: 0;
}

.progress-track {
  width: 260px;
  height: 2px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 2px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: #fff;
  border-radius: 2px;
  transition: width 0.25s ease;
}

.loading-label {
  color: rgba(255, 255, 255, 0.45);
  font-size: 11px;
  letter-spacing: 2px;
  text-transform: uppercase;
  margin: 0;
}

.loading-time {
  color: #fbbf24;
  font-size: 12px;
  margin: 0;
}

/* Transition — плавное исчезновение */
.fade-leave-active {
  transition: opacity 0.5s ease;
}
.fade-leave-to {
  opacity: 0;
}
</style>
