// Opções de fonte do jogo (todas do Google Fonts, com acentos do português).
// A escolhida vira a variável CSS --font-pixel e também é usada nas placas do canvas.

export interface FontOption { id: string; label: string; family: string; note: string }

export const FONTS: FontOption[] = [
  { id: 'vt323', label: 'VT323', family: '"VT323", monospace', note: 'Terminal clássico, muito legível em textos longos' },
  { id: 'jersey', label: 'Jersey 10', family: '"Jersey 10", sans-serif', note: 'Arredondada e encorpada, cara de RPG de portátil' },
  { id: 'pixelify', label: 'Pixelify Sans', family: '"Pixelify Sans", monospace', note: 'A atual: moderna, pixel suave' },
  { id: 'silkscreen', label: 'Silkscreen', family: '"Silkscreen", monospace', note: 'Caixa alta de 8 bits, ótima para títulos' },
  { id: 'press', label: 'Press Start 2P', family: '"Press Start 2P", monospace', note: 'Arcade/NES, forte mas cansa em parágrafos' },
  { id: 'dotgothic', label: 'DotGothic16', family: '"DotGothic16", sans-serif', note: 'Matricial japonesa, estilo RPG de 16 bits' },
]

export const DEFAULT_FONT = 'jersey'
const KEY = 'ilha:font'

export function savedFont(): FontOption {
  let id = DEFAULT_FONT
  try { id = localStorage.getItem(KEY) ?? DEFAULT_FONT } catch { /* ignora */ }
  return FONTS.find((f) => f.id === id) ?? FONTS.find((f) => f.id === DEFAULT_FONT)!
}

export function applyFont(f: FontOption) {
  document.documentElement.style.setProperty('--font-pixel', f.family)
  try { localStorage.setItem(KEY, f.id) } catch { /* ignora */ }
}
