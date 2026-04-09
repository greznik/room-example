export interface GameController {
  goNext: () => Promise<void>
  goPrev: () => Promise<void>
  changeCharacter: (idx: number) => Promise<void>
}
