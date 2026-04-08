// ─────────────────────────────────────────────────────────────────
//  LoadingScreen
//
//  Thin controller for the #loading-screen DOM overlay.
//  Decoupled from Three.js intentionally — easy to swap for a React
//  component or any other UI framework later.
// ─────────────────────────────────────────────────────────────────

export class LoadingScreen {
  private readonly el: HTMLElement;
  private readonly fill: HTMLElement;
  private readonly label: HTMLElement;

  constructor() {
    this.el    = this.getEl('loading-screen');
    this.fill  = this.getEl('progress-fill');
    this.label = this.getEl('loading-label');
  }

  /** Update progress bar (0–1) and status text. */
  setProgress(ratio: number, text: string): void {
    this.fill.style.width = `${Math.round(ratio * 100)}%`;
    this.label.textContent = text;
  }

  /** Fade out and remove from flow. */
  hide(): void {
    this.el.classList.add('hidden');
    // Remove from DOM after transition so it doesn't block pointer events.
    this.el.addEventListener(
      'transitionend',
      () => this.el.remove(),
      { once: true }
    );
  }

  // ─── Helpers ────────────────────────────────────────────────────

  private getEl(id: string): HTMLElement {
    const el = document.getElementById(id);
    if (!el) throw new Error(`LoadingScreen: #${id} not found in DOM`);
    return el;
  }
}