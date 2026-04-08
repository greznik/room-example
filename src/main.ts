import { Game } from './core/Game';
import { AssetLoader } from './core/AssetLoader';
import { LoadingScreen } from './core/LoadingScreen';
import { ItemManager } from './managers/ItemManager';
import { RoomManager } from './managers/RoomManager';
import { ROOM_CONFIGS, ITEM_CONFIGS } from './config/gameConfig';

// ─────────────────────────────────────────────────────────────────
//  Bootstrap
//
//  Execution order:
//    1. Show loading screen.
//    2. Pre-warm asset cache (unique model URLs only).
//    3. Hide loading screen.
//    4. Start game loop & show first room.
// ─────────────────────────────────────────────────────────────────

async function bootstrap(): Promise<void> {
  const loadingScreen = new LoadingScreen();

  // ── Loader ────────────────────────────────────────────────────
  const loader = AssetLoader.getInstance((p) => {
    loadingScreen.setProgress(p.loaded, p.label);
  });

  // Pre-warm: collect unique model paths so we only fetch each once
  const uniquePaths = [
    ...new Set([
      ...ROOM_CONFIGS.map((r) => r.modelPath),
      ...ITEM_CONFIGS.map((i) => i.modelPath),
    ]),
  ];

  loadingScreen.setProgress(0, 'Loading assets…');
  await loader.preloadAll(uniquePaths, (p) => {
    loadingScreen.setProgress(p.loaded * 0.9, p.label);
  });

  // ── Three.js setup ────────────────────────────────────────────
  const container = document.getElementById('canvas-container');
  if (!container) throw new Error('#canvas-container not found');

  const game        = new Game(container);
  const itemManager = new ItemManager(loader);
  const roomManager = new RoomManager(game.scene, loader, itemManager);

  // ── HUD wiring ───────────────────────────────────────────────
//   const roomIndexEl = document.getElementById('room-index');
//   const btnPrev     = document.getElementById('btn-prev') as HTMLButtonElement;
//   const btnNext     = document.getElementById('btn-next') as HTMLButtonElement;

//   roomManager.onRoomChanged = (id, _total) => {
//     if (roomIndexEl) roomIndexEl.textContent = String(id);
//   };

//   btnNext.addEventListener('click', async () => {
//     btnNext.disabled = btnPrev.disabled = true;
//     await roomManager.goNext();
//     btnNext.disabled = btnPrev.disabled = false;
//   });

//   btnPrev.addEventListener('click', async () => {
//     btnNext.disabled = btnPrev.disabled = true;
//     await roomManager.goPrev();
//     btnNext.disabled = btnPrev.disabled = false;
//   });

  // ── Item update hook ─────────────────────────────────────────
  game.onUpdate((dt) => itemManager.update(dt));

  // ── First room ───────────────────────────────────────────────
  loadingScreen.setProgress(0.95, 'Строим первую комнату…');
  await roomManager.init();
  loadingScreen.setProgress(1, 'Готово');

  // Small delay so the "Ready" state is visible before fade
  await delay(300);
  loadingScreen.hide();

  game.start();
}

function delay(ms: number): Promise<void> {
  return new Promise((res) => setTimeout(res, ms));
}

bootstrap().catch((err) => {
  console.error('[bootstrap]', err);
});