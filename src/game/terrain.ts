// Terreno do exterior pintado pixel a pixel (48 px/tile) com texturas contínuas e bordas orgânicas,
// no lugar de tiles quadrados: cada camada (areia, trilha, praça, água) vira uma máscara suavizada
// a partir da grade de tiles + ruído, com contorno escuro e espuma animada na costa.
import { img } from './assets'
import { hash, T, TILE, tileAt, type Scene } from './world'

const D = 4
const PX = TILE * D

interface Tex { w: number; h: number; d: Uint8ClampedArray }
const texCache = new Map<string, Tex | null>()

function tex(key: string): Tex | null {
  if (texCache.has(key)) return texCache.get(key)!
  const im = img(key)
  let t: Tex | null = null
  if (im) {
    const cv = document.createElement('canvas')
    cv.width = im.width; cv.height = im.height
    const c = cv.getContext('2d')!
    c.drawImage(im, 0, 0)
    t = { w: im.width, h: im.height, d: c.getImageData(0, 0, im.width, im.height).data }
  }
  texCache.set(key, t)
  return t
}

export function hasTerrainTextures() {
  return !!img('textures/grass') && !!img('textures/sand') && !!img('textures/water0')
}

/** Ruído de valor suave (0..1) com células de `cell` px. */
function valueNoise(x: number, y: number, cell: number, seed: number) {
  const gx = x / cell, gy = y / cell
  const x0 = Math.floor(gx), y0 = Math.floor(gy), fx = gx - x0, fy = gy - y0
  const sx = fx * fx * (3 - 2 * fx), sy = fy * fy * (3 - 2 * fy)
  const a = hash(x0, y0, seed), b = hash(x0 + 1, y0, seed), c = hash(x0, y0 + 1, seed), d = hash(x0 + 1, y0 + 1, seed)
  return a + (b - a) * sx + (c - a) * sy + (a - b - c + d) * sx * sy
}

interface Masks { W: number; H: number; water: Uint8Array; sand: Uint8Array; path: Uint8Array; plaza: Uint8Array; shore: Uint8Array }
const maskCache = new Map<string, Masks>()

function buildMasks(s: Scene): Masks {
  const W = s.w * PX, H = s.h * PX
  const layer = (is: (t: T) => boolean, outside: number, amp: number, seed: number) => {
    const m = new Uint8Array(W * H)
    const mem = (tx: number, ty: number) => (tx < 0 || ty < 0 || tx >= s.w || ty >= s.h ? outside : is(tileAt(s, tx, ty)) ? 1 : 0)
    for (let y = 0; y < H; y++) {
      const v = y / PX - 0.5, ty = Math.floor(v), fy = v - ty
      for (let x = 0; x < W; x++) {
        const u = x / PX - 0.5, tx = Math.floor(u), fx = u - tx
        const a = mem(tx, ty), b = mem(tx + 1, ty), c = mem(tx, ty + 1), d = mem(tx + 1, ty + 1)
        if (a === b && b === c && c === d) { m[y * W + x] = a; continue }
        const f = a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
        const n = amp ? (valueNoise(x, y, 14, seed) - 0.5) * amp + (valueNoise(x, y, 5, seed + 9) - 0.5) * amp * 0.4 : 0
        m[y * W + x] = f + n > 0.5 ? 1 : 0
      }
    }
    return m
  }
  const water = layer((t) => t === T.Water || t === T.Pier, 1, 0.45, 11)
  // A areia também passa por baixo da água, para nunca sobrar grama entre a praia e o mar.
  const sand = layer((t) => t === T.Sand || t === T.Water || t === T.Pier, 1, 0.4, 21)
  const path = layer((t) => t === T.Path, 0, 0.18, 31)
  const plaza = layer((t) => t === T.Plaza, 0, 0, 41)
  // Distância (em px, até 8) da água até a terra, para a espuma.
  const shore = new Uint8Array(W * H).fill(255)
  for (let i = 0; i < W * H; i++) if (!water[i]) shore[i] = 0
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x
    if (!shore[i]) continue
    let v = shore[i]
    if (x > 0) v = Math.min(v, shore[i - 1] + 1)
    if (y > 0) v = Math.min(v, shore[i - W] + 1)
    shore[i] = v
  }
  for (let y = H - 1; y >= 0; y--) for (let x = W - 1; x >= 0; x--) {
    const i = y * W + x
    if (!shore[i]) continue
    let v = shore[i]
    if (x < W - 1) v = Math.min(v, shore[i + 1] + 1)
    if (y < H - 1) v = Math.min(v, shore[i + W] + 1)
    shore[i] = v
  }
  return { W, H, water, sand, path, plaza, shore }
}

/** Pinta o chão do exterior no canvas (coordenadas em px reais, sem escala). */
export function composeOverworld(c: CanvasRenderingContext2D, s: Scene, frame: number) {
  let m = maskCache.get(s.id)
  if (!m) { m = buildMasks(s); maskCache.set(s.id, m) }
  const { W, H, water, sand, path, plaza, shore } = m
  const grass = tex('textures/grass')!, sandT = tex('textures/sand')!, stone = tex('textures/stone') ?? sandT
  const wat = tex(`textures/water${frame % 4}`) ?? tex('textures/water0')!
  const out = c.createImageData(W, H), o = out.data
  const at = (t: Tex, x: number, y: number) => ((y % t.h) * t.w + (x % t.w)) * 4
  // Borda: pixel dentro da camada com vizinho (a 2 px) fora dela.
  const edge = (mk: Uint8Array, i: number, x: number, y: number) =>
    (x > 1 && !mk[i - 2]) || (x < W - 2 && !mk[i + 2]) || (y > 1 && !mk[i - 2 * W]) || (y < H - 2 && !mk[i + 2 * W])
  const near = (mk: Uint8Array, i: number, x: number, y: number) =>
    (x > 1 && mk[i - 2]) || (x < W - 2 && mk[i + 2]) || (y > 1 && mk[i - 2 * W]) || (y < H - 2 && mk[i + 2 * W])

  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, p = i * 4
    let t: Tex = grass, k = 1, foam = 0
    if (water[i]) {
      t = wat
      const dist = shore[i]
      const band = 3 + ((frame + (valueNoise(x, y, 20, 5) * 4) | 0) % 3)
      if (dist <= band) foam = 0.85
      else if (dist <= band + 4) foam = 0.25
    } else if (plaza[i]) { t = stone; if (edge(plaza, i, x, y)) k = 0.72 }
    else if (path[i]) { t = sandT; k = edge(path, i, x, y) ? 0.74 : 0.95 }
    else if (sand[i]) { t = sandT; if (edge(sand, i, x, y)) k = 0.86 }
    else if (near(path, i, x, y) || near(plaza, i, x, y)) k = 0.8 // "lábio" da grama na beira do caminho
    const q = at(t, x, y)
    let r = t.d[q] * k, g = t.d[q + 1] * k, b = t.d[q + 2] * k
    if (water[i]) { r = 246; g = 251; b = 255 } // água transparente: só a espuma é pintada aqui
    o[p] = r; o[p + 1] = g; o[p + 2] = b; o[p + 3] = water[i] ? Math.round(foam * 255) : 255
  }
  c.putImageData(out, 0, 0)
}

interface RoomStyle {
  floor: 'tiles' | 'planks' | 'stone' | 'checker'
  f1: string; f2: string; fLine: string; fLight: string
  wall: string; wallLine: string; wains: string; wainsDark: string; trim: string
  deco: { kind: 'window' | 'picture' | 'clock'; x: number }[]
}

// Paletas por sala, desenhadas nítidas a 64 px/tile (as texturas da folha borravam ao ampliar).
const ROOMS: Record<string, RoomStyle> = {
  lab: { floor: 'tiles', f1: '#E4ECF3', f2: '#D3DFEA', fLine: '#AFC0CF', fLight: '#F4F8FB', wall: '#EAF2F7', wallLine: '#D7E3EC', wains: '#A9C0D2', wainsDark: '#7E97AC', trim: '#4E6479', deco: [{ kind: 'window', x: 1.5 }, { kind: 'window', x: 8 }, { kind: 'picture', x: 5.5 }] },
  biblioteca: { floor: 'planks', f1: '#B98650', f2: '#A9773F', fLine: '#7C5228', fLight: '#CF9C63', wall: '#EFE3C8', wallLine: '#E2D3B2', wains: '#8A5A32', wainsDark: '#6A4122', trim: '#4F2F17', deco: [{ kind: 'window', x: 3.5 }, { kind: 'window', x: 7.5 }, { kind: 'clock', x: 5.5 }] },
  oficina: { floor: 'stone', f1: '#A49C8F', f2: '#968E81', fLine: '#6F685D', fLight: '#B8B0A3', wall: '#D9C7AC', wallLine: '#C9B596', wains: '#7B6A57', wainsDark: '#5C4E3F', trim: '#3E342A', deco: [{ kind: 'window', x: 4 }, { kind: 'picture', x: 6.5 }, { kind: 'clock', x: 5.5 }] },
  correio: { floor: 'checker', f1: '#F2E4D6', f2: '#E2CDBA', fLine: '#C7AE97', fLight: '#FBF3EA', wall: '#FAEDE4', wallLine: '#EEDCCF', wains: '#D2584A', wainsDark: '#A8402F', trim: '#7B2B20', deco: [{ kind: 'window', x: 1.5 }, { kind: 'window', x: 8.5 }, { kind: 'clock', x: 5 }, { kind: 'picture', x: 6.5 }] },
  farol2: { floor: 'planks', f1: '#9C7448', f2: '#8C653C', fLine: '#5E4024', fLight: '#B78A58', wall: '#E3E7EE', wallLine: '#D3D9E3', wains: '#35507C', wainsDark: '#253A5E', trim: '#18284A', deco: [{ kind: 'window', x: 1 }, { kind: 'window', x: 3.5 }, { kind: 'window', x: 6 }, { kind: 'clock', x: 8 }] },
  farol: { floor: 'stone', f1: '#C4BCAE', f2: '#B4AC9E', fLine: '#8B8376', fLight: '#D6CFC2', wall: '#E3E7EE', wallLine: '#D3D9E3', wains: '#35507C', wainsDark: '#253A5E', trim: '#18284A', deco: [{ kind: 'window', x: 4 }, { kind: 'picture', x: 0.8 }, { kind: 'window', x: 7.5 }] },
}

/** Piso e parede dos interiores, desenhados em código (nítidos) com detalhes da folha nas paredes. */
export function composeInterior(c: CanvasRenderingContext2D, s: Scene): boolean {
  const r = ROOMS[s.id]
  if (!r) return false
  const W = s.w * PX, H = s.h * PX, top = 2 * PX
  const box = (x: number, y: number, w: number, h: number, col: string) => { c.fillStyle = col; c.fillRect(x, y, w, h) }

  // ---- Piso ----
  for (let ty = 2; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) {
    const x = tx * PX, y = ty * PX
    switch (r.floor) {
      case 'tiles':
      case 'checker': {
        const alt = r.floor === 'checker' ? (tx + ty) % 2 : hash(tx, ty, 5) > 0.75 ? 1 : 0
        box(x, y, PX, PX, alt ? r.f2 : r.f1)
        box(x + 4, y + 4, PX - 12, 3, r.fLight)
        box(x + 4, y + 4, 3, PX - 12, r.fLight)
        box(x, y + PX - 3, PX, 3, r.fLine); box(x + PX - 3, y, 3, PX, r.fLine)
        break
      }
      case 'planks': {
        const ph = PX / 3
        for (let i = 0; i < 3; i++) {
          const py = y + i * ph
          box(x, py, PX, ph, (tx + ty + i) % 3 === 0 ? r.f2 : r.f1)
          box(x, py, PX, 2, r.fLight)
          box(x, py + ph - 2, PX, 2, r.fLine)
          const seam = x + ((ty * 3 + i) * 23 % PX)
          box(seam, py, 2, ph, r.fLine)
          box(x + ((tx * 7 + i * 13) % (PX - 10)) + 4, py + ph / 2, 6, 2, r.f2)
        }
        break
      }
      case 'stone': {
        box(x, y, PX, PX, r.f1)
        const half = PX / 2
        for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) {
          const sx = x + j * half + (i % 2 ? half / 2 : 0) % half, sy = y + i * half
          box(sx + 2, sy + 2, half - 4, half - 4, hash(tx * 2 + j, ty * 2 + i, 9) > 0.5 ? r.f1 : r.f2)
          box(sx + 2, sy + 2, half - 6, 2, r.fLight)
          box(sx, sy + half - 2, half, 2, r.fLine); box(sx + half - 2, sy, 2, half, r.fLine)
        }
      }
    }
  }

  // ---- Parede (2 fileiras): papel de parede, lambri e rodapé ----
  box(0, 0, W, top, r.wall)
  for (let x = 0; x < W; x += 16) box(x, 0, 2, top * 0.62, r.wallLine)
  box(0, 0, W, 6, r.trim)
  const wy = Math.round(top * 0.62)
  box(0, wy - 4, W, 4, r.trim)
  box(0, wy, W, top - wy, r.wains)
  for (let x = 6; x < W; x += 32) { box(x, wy + 6, 22, top - wy - 18, r.wainsDark); box(x + 2, wy + 8, 18, top - wy - 22, r.wains) }
  box(0, top - 8, W, 8, r.trim)

  // Detalhes da folha (janela, quadro, relógio) no tamanho nativo.
  for (const d of r.deco) {
    const im = img(`interior/${d.kind}`)
    if (!im) continue
    const scale = d.kind === 'window' ? 1.25 : 1
    const w = im.width * scale, h = im.height * scale
    c.drawImage(im, Math.round(d.x * PX - w / 2 + PX / 2), Math.round((wy - h) / 2 + 2), w, h)
  }

  // Sombra da parede sobre o piso e leve vinheta nas laterais.
  const g = c.createLinearGradient(0, top, 0, top + 22)
  g.addColorStop(0, 'rgba(0,0,0,0.30)'); g.addColorStop(1, 'rgba(0,0,0,0)')
  c.fillStyle = g; c.fillRect(0, top, W, 22)
  const v = c.createLinearGradient(0, 0, W, 0)
  v.addColorStop(0, 'rgba(0,0,0,0.16)'); v.addColorStop(0.08, 'rgba(0,0,0,0)'); v.addColorStop(0.92, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,0.16)')
  c.fillStyle = v; c.fillRect(0, 0, W, H)
  return true
}
