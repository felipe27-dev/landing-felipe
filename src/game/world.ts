import type { RegionId, SectionId } from '../content/types'
import type { Dir } from './types'

export const TILE = 16

export const enum T { Water, Sand, Grass, Path, Tree, Flower, Plaza, TallGrass, Floor, Wall, Mat, Void, Pier }

export interface Interactable {
  id: string
  x: number; y: number
  kind: 'npc' | 'sign' | 'post' | 'mailbox' | 'bottle' | 'furniture'
  dialog: string
  label: string
  /** NPCs: aparência e direção inicial. */
  look?: string
  face?: Dir
  /** Liga o objeto a um item do conteúdo (projeto, habilidade…). */
  ref?: { section: SectionId; index: number }
}

export interface Warp { x: number; y: number; to: string; tx: number; ty: number; facing: Dir }

export interface Furniture { kind: string; x: number; y: number; w?: number; h?: number; solid?: boolean }

/** Objeto de cenário (sprite em decor/): ocupa w×h tiles com base na última fileira. */
export interface Decor { key: string; x: number; y: number; w?: number; h?: number; solid?: boolean; frames?: number }

export interface Building {
  id: string
  x: number; y: number; w: number; h: number
  roof: string; roofDark: string; roofLight: string; wall: string
  door: { x: number; y: number }
  label: string
  kind: 'house' | 'lab' | 'lighthouse'
}

export interface Scene {
  id: string
  kind: 'overworld' | 'interior'
  w: number; h: number
  tiles: Uint8Array
  solid: Set<number>
  interactables: Interactable[]
  warps: Warp[]
  furniture: Furniture[]
  decor: Decor[]
  spawn: { x: number; y: number }
  music: 'overworld' | 'interior' | 'beach'
  /** Região fixa (interiores); no exterior é calculada por posição. */
  region?: RegionId
}

export interface Region { id: RegionId; x0: number; y0: number; x1: number; y1: number; spawn: { x: number; y: number }; section?: SectionId }

export function hash(x: number, y: number, seed = 0) {
  let h = (x * 374761393 + y * 668265263 + seed * 2147483647) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295
}

// ---------- Exterior ----------
const OW_W = 34, OW_H = 32

// Pegada sólida dos prédios (3 fileiras); o sprite é centralizado na porta e pode passar disso.
export const buildings: Building[] = [
  { id: 'lab', x: 6, y: 4, w: 3, h: 3, roof: '#3878D8', roofDark: '#2858A8', roofLight: '#68A0F0', wall: '#F2EEE0', door: { x: 7, y: 6 }, label: 'Laboratório', kind: 'lab' },
  { id: 'biblioteca', x: 24, y: 4, w: 3, h: 3, roof: '#D04848', roofDark: '#9C3030', roofLight: '#F07070', wall: '#F2E8CF', door: { x: 25, y: 6 }, label: 'Biblioteca', kind: 'house' },
  { id: 'oficina', x: 6, y: 16, w: 3, h: 3, roof: '#5E6C7A', roofDark: '#404C58', roofLight: '#8C9AA8', wall: '#F2E8CF', door: { x: 7, y: 18 }, label: 'Oficina', kind: 'house' },
  { id: 'correio', x: 23, y: 16, w: 5, h: 3, roof: '#D04848', roofDark: '#9C3030', roofLight: '#F07070', wall: '#F2E8CF', door: { x: 25, y: 18 }, label: 'Correio', kind: 'house' },
  { id: 'farol', x: 28, y: 9, w: 3, h: 3, roof: '#C8553D', roofDark: '#9A3F2D', roofLight: '#E07A60', wall: '#F7F3E8', door: { x: 29, y: 11 }, label: 'Farol', kind: 'lighthouse' },
]

export const regions: Region[] = [
  { id: 'lab', x0: 0, y0: 0, x1: 10, y1: 8, spawn: { x: 7, y: 8 }, section: 'projects' },
  { id: 'biblioteca', x0: 21, y0: 0, x1: 33, y1: 8, spawn: { x: 25, y: 8 }, section: 'skills' },
  { id: 'farol', x0: 21, y0: 9, x1: 33, y1: 14, spawn: { x: 29, y: 12 }, section: 'experience' },
  { id: 'oficina', x0: 0, y0: 15, x1: 11, y1: 20, spawn: { x: 7, y: 19 }, section: 'services' },
  { id: 'correio', x0: 19, y0: 15, x1: 33, y1: 20, spawn: { x: 25, y: 19 }, section: 'contact' },
  { id: 'praia', x0: 0, y0: 21, x1: 33, y1: 31, spawn: { x: 16, y: 22 } },
  { id: 'praca', x0: 0, y0: 0, x1: 33, y1: 25, spawn: { x: 16, y: 14 }, section: 'about' },
]

/** Ordem dos atalhos 1–6 e da navegação rápida. */
export const SHORTCUT_ORDER: RegionId[] = ['praca', 'lab', 'biblioteca', 'farol', 'oficina', 'correio']
export const OUTDOOR_REGIONS: RegionId[] = ['praca', 'lab', 'biblioteca', 'farol', 'oficina', 'correio', 'praia']

export function regionAt(scene: Scene, x: number, y: number): RegionId {
  if (scene.region) return scene.region
  return regions.find((r) => x >= r.x0 && x <= r.x1 && y >= r.y0 && y <= r.y1)?.id ?? 'ilha'
}

const owInteractables: Interactable[] = [
  { id: 'guide', x: 14, y: 11, kind: 'npc', dialog: 'guide', label: 'Guia', look: 'guide', face: 'down' },
  { id: 'welcome', x: 19, y: 11, kind: 'sign', dialog: 'welcome', label: 'Placa' },
  { id: 'mailbox', x: 22, y: 18, kind: 'mailbox', dialog: 'mailbox', label: 'Caixa de correio' },
  { id: 'bottle', x: 27, y: 26, kind: 'bottle', dialog: 'bottle', label: 'Garrafa' },
  ...([['lab', 9, 7], ['biblioteca', 27, 7], ['oficina', 9, 20], ['correio', 28, 20]] as const).map(([id, x, y]) => (
    { id: `sign-${id}`, x, y, kind: 'sign' as const, dialog: `sign-${id}`, label: 'Placa' })),
]

const owDecor: Decor[] = [
  { key: 'fountain', x: 12, y: 13, w: 2, h: 2, solid: true, frames: 6 },
  { key: 'lamp', x: 12, y: 10, solid: true }, { key: 'lamp', x: 21, y: 15, solid: true }, { key: 'lamp', x: 15, y: 7, solid: true },
  { key: 'bench', x: 19, y: 14, w: 2, solid: true },
  { key: 'fence', x: 3, y: 14, w: 3, solid: true }, { key: 'fence', x: 10, y: 16, w: 3, solid: true },
  { key: 'pier', x: 12, y: 28, w: 6 }, { key: 'boat', x: 18, y: 29, solid: true, frames: 4 },
  { key: 'rock_big', x: 6, y: 25, solid: true }, { key: 'rock_big', x: 23, y: 24, solid: true }, { key: 'rock_big', x: 9, y: 27, solid: true }, { key: 'boat', x: 28, y: 28, solid: true, frames: 4 }, { key: 'rock_big', x: 30, y: 15, solid: true },
]

function buildOverworld(): Scene {
  const W = OW_W, H = OW_H
  const t = new Uint8Array(W * H).fill(T.Grass)
  const set = (x: number, y: number, v: T) => { if (x >= 0 && y >= 0 && x < W && y < H) t[y * W + x] = v }
  const rect = (x0: number, y0: number, x1: number, y1: number, v: T, only?: T[]) => {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) if (!only || only.includes(t[y * W + x])) set(x, y, v)
  }

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const d = Math.min(x, y, W - 1 - x, H - 1 - y) - (hash(x, y, 7) < 0.3 ? 1 : 0)
    if (d <= 1) set(x, y, T.Water)
    else if (d === 2) set(x, y, T.Sand)
  }
  // Praia sul com enseada.
  // Praia ampla no sul (orla com espaço para caminhar e ouvir a música da praia).
  rect(3, 21, 30, 27, T.Sand)
  rect(2, 28, 31, H - 1, T.Water)

  // Praça, avenidas e ramais até cada porta.
  rect(12, 10, 21, 15, T.Plaza)
  rect(16, 8, 17, 21, T.Path)
  rect(4, 8, 29, 8, T.Path)
  rect(5, 19, 29, 19, T.Path)
  rect(7, 7, 7, 7, T.Path)
  rect(25, 7, 25, 7, T.Path)
  rect(21, 12, 29, 12, T.Path)

  const blockedArea = (x: number, y: number) =>
    buildings.some((b) => x >= b.x - 2 && x <= b.x + b.w + 1 && y >= b.y - 3 && y <= b.y + b.h) ||
    owInteractables.some((i) => Math.abs(i.x - x) <= 1 && Math.abs(i.y - y) <= 1) ||
    owDecor.some((d) => x >= d.x - 1 && x <= d.x + (d.w ?? 1) && y >= d.y - (d.h ?? 1) && y <= d.y + 1)
  const nearWalkway = (x: number, y: number) => {
    for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
      const v = t[(y + dy) * W + (x + dx)]
      if (v === T.Path || v === T.Plaza) return true
    }
    return false
  }
  for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
    if (t[y * W + x] !== T.Grass || blockedArea(x, y)) continue
    const r = hash(x, y, 3)
    if (!nearWalkway(x, y) && r < 0.2) set(x, y, T.Tree)
    else if (r > 0.9) set(x, y, T.Flower)
  }
  // Píer de madeira sobre a água (caminhável).
  rect(12, 28, 17, 28, T.Pier)
  const grassy = [T.Grass, T.Flower, T.Tree]
  rect(11, 3, 14, 6, T.TallGrass, grassy)
  rect(3, 10, 6, 13, T.TallGrass, grassy)
  rect(18, 16, 21, 17, T.TallGrass, grassy)

  const solid = new Set<number>()
  for (const b of buildings) for (let y = b.y; y < b.y + b.h; y++) for (let x = b.x; x < b.x + b.w; x++) {
    if (x === b.door.x && y === b.door.y) continue
    solid.add(y * W + x)
  }
  for (const i of owInteractables) solid.add(i.y * W + i.x)
  for (const d of owDecor) {
    if (!d.solid) continue
    for (let y = d.y - (d.h ?? 1) + 1; y <= d.y; y++) for (let x = d.x; x < d.x + (d.w ?? 1); x++) solid.add(y * W + x)
  }

  return {
    id: 'overworld', kind: 'overworld', w: W, h: H, tiles: t, solid,
    interactables: owInteractables,
    warps: buildings.map((b) => ({ x: b.door.x, y: b.door.y, to: b.id, tx: 5, ty: 7, facing: 'up' as Dir })),
    furniture: [], decor: owDecor, spawn: { x: 16, y: 14 }, music: 'overworld',
  }
}

export const overworld = buildOverworld()

// ---------- Interiores ----------
export interface Counts { projects: number; skills: number; services: number; experience: number }

function buildInterior(id: string, region: RegionId, items: { furniture: Furniture[]; interactables: Interactable[] }, opts: { exit?: boolean; warps?: Warp[]; spawn?: { x: number; y: number } } = {}): Scene {
  const W = 11, H = 9
  const t = new Uint8Array(W * H).fill(T.Floor)
  for (let x = 0; x < W; x++) { t[x] = T.Wall; t[W + x] = T.Wall }
  const exit = { x: 5, y: H - 1 }
  // A saída fica sob o tapete da entrada (sem bloco de capacho separado).
  const b = buildings.find((bb) => bb.id === id)
  const solid = new Set<number>()
  for (let i = 0; i < 2 * W; i++) solid.add(i)
  for (const f of items.furniture) {
    if (f.solid === false) continue
    for (let y = f.y; y < f.y + (f.h ?? 1); y++) for (let x = f.x; x < f.x + (f.w ?? 1); x++) solid.add(y * W + x)
  }
  for (const i of items.interactables) solid.add(i.y * W + i.x)
  return {
    id, kind: 'interior', w: W, h: H, tiles: t, solid, region,
    interactables: items.interactables, furniture: items.furniture, decor: [],
    warps: [
      ...(opts.exit !== false && b ? [{ x: exit.x, y: exit.y, to: 'overworld', tx: b.door.x, ty: b.door.y + 1, facing: 'down' as Dir }] : []),
      ...(opts.warps ?? []),
    ],
    spawn: opts.spawn ?? { x: 5, y: 7 }, music: 'interior',
  }
}

const slots = (n: number, xs: number[]) => xs.slice(0, Math.max(0, Math.min(n, xs.length)))

export function buildScenes(c: Counts): Record<string, Scene> {
  // Cada sala tem poucos objetos, cada um com papel claro: destaques individuais + um objeto
  // que abre a lista completa (sem fileiras de móveis idênticos).
  const all = (id: string, x: number, y: number, dialog: string, label: string): Interactable =>
    ({ id, x, y, kind: 'furniture', dialog, label })
  const lab = buildInterior('lab', 'lab', {
    furniture: [
      ...slots(c.projects, [2, 4, 6]).map((x) => ({ kind: 'terminal', x, y: 2 })),
      { kind: 'table', x: 4, y: 5, w: 2 }, { kind: 'plant', x: 0, y: 2 }, { kind: 'plant', x: 10, y: 2 },
      { kind: 'pc', x: 9, y: 2 }, { kind: 'plant', x: 0, y: 7 },
      { kind: 'rug', x: 4, y: 8, w: 3, solid: false },
    ],
    interactables: [
      ...slots(c.projects, [2, 4, 6]).map((x, i) => ({ id: `terminal${i}`, x, y: 2, kind: 'furniture' as const, dialog: 'terminal', label: `Terminal ${i + 1}`, ref: { section: 'projects' as const, index: i } })),
      all('labBoard', 4, 5, 'labBoard', 'Mesa de projetos'),
      all('labArchive', 9, 2, 'labBoard', 'Arquivo de projetos'),
      { id: 'scientist', x: 8, y: 6, kind: 'npc', dialog: 'labNpc', label: 'Assistente', look: 'scientist', face: 'left' },
    ],
  })
  const lib = buildInterior('biblioteca', 'biblioteca', {
    furniture: [
      { kind: 'shelf', x: 1, y: 2 }, { kind: 'shelf', x: 9, y: 2 },
      { kind: 'table', x: 4, y: 5, w: 2 }, { kind: 'plant', x: 0, y: 7 }, { kind: 'plant', x: 10, y: 7 },
      { kind: 'rug', x: 4, y: 8, w: 3, solid: false },
    ],
    interactables: [
      all('shelfA', 1, 2, 'shelfAll', 'Estante'), all('shelfB', 9, 2, 'shelfAll', 'Estante'),
      all('libTable', 4, 5, 'shelfAll', 'Mesa de leitura'),
      { id: 'librarian', x: 2, y: 5, kind: 'npc', dialog: 'libNpc', label: 'Bibliotecária', look: 'librarian', face: 'right' },
    ],
  })
  const work = buildInterior('oficina', 'oficina', {
    furniture: [
      { kind: 'workbench', x: 1, y: 2, w: 2 }, { kind: 'workbench', x: 7, y: 2, w: 2 },
      { kind: 'anvil', x: 9, y: 5 }, { kind: 'crate', x: 0, y: 6 }, { kind: 'crate', x: 10, y: 7 },
      { kind: 'rug', x: 4, y: 8, w: 3, solid: false },
    ],
    interactables: [
      all('benchA', 1, 2, 'benchAll', 'Bancada'), all('benchB', 7, 2, 'benchAll', 'Bancada'),
      { id: 'artisan', x: 5, y: 4, kind: 'npc', dialog: 'workNpc', label: 'Artesão', look: 'artisan', face: 'down' },
    ],
  })
  const post = buildInterior('correio', 'correio', {
    furniture: [
      { kind: 'mailshelf', x: 2, y: 4 }, { kind: 'mailshelf', x: 8, y: 4 }, { kind: 'plant', x: 3, y: 4 }, { kind: 'plant', x: 7, y: 4 },
      { kind: 'counter', x: 4, y: 4, w: 3 }, { kind: 'pc', x: 10, y: 5 }, { kind: 'bench', x: 0, y: 7 },
      { kind: 'rug', x: 4, y: 8, w: 3, solid: false },
    ],
    interactables: [
      { id: 'clerk', x: 5, y: 3, kind: 'npc', dialog: 'clerk', label: 'Atendente', look: 'clerk', face: 'down' },
      { id: 'counter', x: 5, y: 4, kind: 'furniture', dialog: 'clerk', label: 'Balcão' },
      { id: 'pc', x: 10, y: 5, kind: 'furniture', dialog: 'pc', label: 'Computador' },
    ],
  })
  const tower = buildInterior('farol', 'farol', {
    furniture: [
      { kind: 'plaque', x: 2, y: 2 }, { kind: 'stairs', x: 9, y: 2, solid: false },
      { kind: 'crate', x: 0, y: 7 }, { kind: 'plant', x: 10, y: 7 },
      { kind: 'rug', x: 4, y: 8, w: 3, solid: false },
    ],
    interactables: [
      all('plaqueA', 2, 2, 'plaqueAll', 'Placa da trajetória'),
      { id: 'keeper', x: 4, y: 5, kind: 'npc', dialog: 'keeper', label: 'Faroleiro', look: 'keeper', face: 'down' },
    ],
  }, { warps: [{ x: 9, y: 2, to: 'farol2', tx: 9, ty: 3, facing: 'down' }] })
  // Segundo andar: sala da lanterna com os 4 marcos da trajetória.
  const tower2 = buildInterior('farol2', 'farol', {
    furniture: [
      ...[2, 4, 6].map((x) => ({ kind: 'plaque', x, y: 2 })), { kind: 'plaque', x: 1, y: 5 },
      { kind: 'stairs', x: 9, y: 2, solid: false }, { kind: 'plant', x: 0, y: 7 }, { kind: 'plant', x: 10, y: 7 },
      { kind: 'rug', x: 4, y: 6, w: 3, solid: false },
    ],
    interactables: [
      ...[[2, 2], [4, 2], [6, 2], [1, 5]].map(([x, y], i) => ({ id: `post${i}`, x, y, kind: 'furniture' as const, dialog: `post${i}`, label: `Marco ${i + 1}` })),
    ],
  }, { exit: false, spawn: { x: 9, y: 3 }, warps: [{ x: 9, y: 2, to: 'farol', tx: 9, ty: 3, facing: 'down' }] })
  return { overworld, lab, biblioteca: lib, oficina: work, correio: post, farol: tower, farol2: tower2 }
}

export function tileAt(s: Scene, x: number, y: number): T {
  if (x < 0 || y < 0 || x >= s.w || y >= s.h) return s.kind === 'overworld' ? T.Water : T.Void
  return s.tiles[y * s.w + x] as T
}

export function isWalkable(s: Scene, x: number, y: number) {
  const v = tileAt(s, x, y)
  if (v === T.Water || v === T.Tree || v === T.Wall || v === T.Void) return false
  return !s.solid.has(y * s.w + x)
}

export function interactableAt(s: Scene, x: number, y: number) {
  return s.interactables.find((i) => i.x === x && i.y === y)
}

export function warpAt(s: Scene, x: number, y: number) {
  return s.warps.find((w) => w.x === x && w.y === y)
}
