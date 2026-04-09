import { defineStore } from "pinia";
import { ref } from "vue";

export const useGameStore = defineStore("game", () => {
  const currentRoom = ref(1);
  const totalRooms = ref(20);
  const selectedCharacter = ref(0);
  const isLoading = ref(true);
  const loadTime = ref(0);
  const loadRatio = ref(0);
  const loadLabel = ref("Инициализация…");

  function updateRoom(id: number, total: number) {
    currentRoom.value = id;
    totalRooms.value = total;
  }

  function setProgress(ratio: number, label: string, elapsed: number) {
    loadRatio.value = ratio;
    loadLabel.value = label;
    loadTime.value = elapsed;
  }

  function setLoading(state: boolean) {
    isLoading.value = state;
  }
  function setLoadTime(t: number) {
    loadTime.value = t;
  }
  function setCharacter(i: number) {
    selectedCharacter.value = i;
  }

  // game.start() вызывается из InitializeGame, store только хранит состояние
  function start() {}

  return {
    currentRoom,
    totalRooms,
    selectedCharacter,
    isLoading,
    loadTime,
    loadRatio,
    loadLabel,
    updateRoom,
    setProgress,
    setLoading,
    setLoadTime,
    setCharacter,
    start,
  };
});
