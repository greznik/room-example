/**
 * gameStore.ts
 *
 * Исправлено: totalRooms инициализируется из ROOMS_CONFIG.length,
 * а не хардкодом 20.
 */

import { defineStore } from "pinia";
import { ref } from "vue";
import { ROOMS_CONFIG } from "../config/roomsConfig";

export const useGameStore = defineStore("game", () => {
  const currentRoom       = ref(1);
  const totalRooms        = ref(ROOMS_CONFIG.length); // ← было 20 (хардкод)
  const selectedCharacter = ref(0);
  const isLoading         = ref(true);
  const loadTime          = ref(0);
  const loadRatio         = ref(0);
  const loadLabel         = ref("Инициализация…");
  const spawnTrigger      = ref(0);

  function updateRoom(id: number, total: number): void {
    currentRoom.value = id;
    totalRooms.value  = total;
  }

  function setProgress(ratio: number, label: string, elapsed: number): void {
    loadRatio.value = ratio;
    loadLabel.value = label;
    loadTime.value  = elapsed;
  }

  function setLoading(state: boolean): void { isLoading.value = state; }
  function setCharacter(i: number): void    { selectedCharacter.value = i; }
  function triggerSpawn(): void             { spawnTrigger.value++; }

  return {
    currentRoom,
    totalRooms,
    selectedCharacter,
    isLoading,
    loadTime,
    loadRatio,
    loadLabel,
    spawnTrigger,
    updateRoom,
    setProgress,
    setLoading,
    setCharacter,
    triggerSpawn,
  };
});
