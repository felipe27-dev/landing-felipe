// Arte original desenhada em código, em estilo inspirado nos RPGs portáteis 16-bit.
// Qualquer arquivo carregado por assets.ts tem prioridade sobre o desenho procedural.
import { img } from './assets'
import { buildings, hash, T, TILE, tileAt, type Building, type Decor, type Furniture, type Interactable, type Scene } from './world'
import { composeInterior, composeOverworld, hasTerrainTextures } from './terrain'
import type { Dir } from './types'

export const PAL = {
  outline: '#283038',
  grass: '#8CD070', grassDark: '#58A848', grassLight: '#B8E890',
  tall: '#48A040', tallDark: '#287028', tallLight: '#90D870',
  path: '#E8D098', pathEdge: '#C8A868', pathDot: '#D0B478',
  plaza: '#E4DCC8', plazaLine: '#C4B8A0', plazaLight: '#F4EEE0',
  sand: '#F0E0A8', sandDark: '#D8C080',
  water: '#5890F0', waterLight: '#A0D0F8', waterDark: '#3870D0', foam: '#F0F8FF',
  trunk: '#906030', trunkDark: '#604020', crown: '#40A050', crownDark: '#206830', crownLight: '#78D070', crownLine: '#183818',
  wallShade: '#D8CCB0', glass: '#88C8F0', glassLight: '#D8F0FF', frame: '#F8F8F8',
  door: '#985830', doorDark: '#683818', gold: '#F0C040',
  amber: '#FFB627', coral: '#C8553D', paper: '#F8F8F0', wood: '#B07840', woodDark: '#784818', woodLight: '#D8A060',
  shadow: 'rgba(0,0,0,0.22)', black: '#101018',
}

type Ctx = CanvasRenderingContext2D
const px = (c: Ctx, x: number, y: number, w: number, h: number, color: string) => { c.fillStyle = color; c.fillRect(x, y, w, h) }

/** Densidade dos sprites em arquivo: 4 px de imagem por pixel de jogo (64 px por tile). */
export const D = 4

/** Desenha um quadro de uma tira horizontal de tiles (64 px cada). */
function drawTileImage(c: Ctx, im: HTMLImageElement, x: number, y: number, frame: number) {
  const fw = TILE * D, frames = Math.max(1, Math.floor(im.width / fw))
  c.drawImage(im, (frame % frames) * fw, 0, fw, im.height, x, y, TILE, im.height / D)
}

/** Desenha imagem alinhada pela base e centralizada no retângulo (pode ser maior que a área). */
function drawAnchored(c: Ctx, im: HTMLImageElement, x: number, y: number, w: number, h: number) {
  const gw = im.width / D, gh = im.height / D
  c.drawImage(im, x + (w - gw) / 2, y + h - gh, gw, gh)
}

const TILE_KEY: Partial<Record<T, string>> = {
  [T.Grass]: 'grass', [T.Flower]: 'flower', [T.TallGrass]: 'tall_grass', [T.Path]: 'path', [T.Sand]: 'sand',
  [T.Water]: 'water', [T.Plaza]: 'plaza', [T.Floor]: 'floor', [T.Wall]: 'wall', [T.Mat]: 'mat',
}

// ---------- Terreno ----------
function grass(c: Ctx, x: number, y: number, tx: number, ty: number) {
  px(c, x, y, TILE, TILE, PAL.grass)
  // Tufos em padrão regular, como nos mapas clássicos.
  const tuft = (ox: number, oy: number) => {
    px(c, x + ox, y + oy + 1, 1, 1, PAL.grassDark); px(c, x + ox + 1, y + oy, 1, 1, PAL.grassDark); px(c, x + ox + 2, y + oy + 1, 1, 1, PAL.grassDark)
    px(c, x + ox + 1, y + oy + 1, 1, 1, PAL.grassLight)
  }
  tuft(2 + ((tx + ty) % 2) * 6, 3)
  tuft(9 - ((tx + ty) % 2) * 5, 10)
}

function drawGround(c: Ctx, s: Scene, t: T, tx: number, ty: number, frame: number) {
  const x = tx * TILE, y = ty * TILE
  const key = TILE_KEY[t]
  const sceneKey = s.kind === 'interior' && (t === T.Floor || t === T.Wall) ? `tiles/${s.id}_${key}` : null
  const im = (sceneKey && img(sceneKey)) || (key && img(`tiles/${key}`))
  if (im) {
    // A parede em arquivo cobre as duas fileiras do fundo de uma vez.
    if (t === T.Wall) { if (ty === 0) drawTileImage(c, im, x, y, 0); return }
    drawTileImage(c, im, x, y, frame); return
  }

  switch (t) {
    case T.Water: {
      px(c, x, y, TILE, TILE, PAL.water)
      for (const [row, off] of [[3, 0], [8, 6], [13, 3]] as const) {
        const wx = (off + frame * 2 + (tx % 2) * 8) % 16
        px(c, x + wx, y + row, 5, 1, PAL.waterLight)
        px(c, x + ((wx + 5) % 16), y + row + 1, 2, 1, PAL.waterDark)
      }
      if (tileAt(s, tx, ty - 1) === T.Sand) { px(c, x, y, TILE, 2 + (frame % 2), PAL.foam); px(c, x, y + 2 + (frame % 2), TILE, 1, PAL.waterLight) }
      break
    }
    case T.Sand:
      px(c, x, y, TILE, TILE, PAL.sand)
      for (let i = 0; i < 4; i++) px(c, x + Math.floor(hash(tx, ty, i) * 15), y + Math.floor(hash(tx, ty, i + 5) * 15), 1, 1, PAL.sandDark)
      break
    case T.Path: {
      px(c, x, y, TILE, TILE, PAL.path)
      for (let i = 0; i < 3; i++) px(c, x + 1 + Math.floor(hash(tx, ty, i) * 13), y + 1 + Math.floor(hash(tx, ty, i + 9) * 13), 2, 1, PAL.pathDot)
      const walk = (v: T) => v === T.Path || v === T.Plaza
      if (!walk(tileAt(s, tx, ty - 1))) px(c, x, y, TILE, 1, PAL.pathEdge)
      if (!walk(tileAt(s, tx, ty + 1))) px(c, x, y + 15, TILE, 1, PAL.pathEdge)
      if (!walk(tileAt(s, tx - 1, ty))) px(c, x, y, 1, TILE, PAL.pathEdge)
      if (!walk(tileAt(s, tx + 1, ty))) px(c, x + 15, y, 1, TILE, PAL.pathEdge)
      break
    }
    case T.Plaza:
      px(c, x, y, TILE, TILE, PAL.plaza)
      px(c, x, y + 7, TILE, 1, PAL.plazaLine); px(c, x, y + 15, TILE, 1, PAL.plazaLine)
      px(c, x + 7, y, 1, 7, PAL.plazaLine); px(c, x + 15, y + 8, 1, 7, PAL.plazaLine)
      px(c, x + 1, y + 1, 5, 1, PAL.plazaLight); px(c, x + 9, y + 9, 5, 1, PAL.plazaLight)
      break
    case T.TallGrass: {
      px(c, x, y, TILE, TILE, PAL.tall)
      for (let col = 0; col < 4; col++) {
        const bx = x + col * 4 + (frame % 2 && col % 2 ? 1 : 0)
        const top = y + 2 + ((col + ty) % 2) * 2
        px(c, bx, top + 3, 1, y + 16 - top - 3, PAL.tallDark)
        px(c, bx + 1, top, 1, y + 16 - top, PAL.tallLight)
        px(c, bx + 2, top + 2, 1, y + 16 - top - 2, PAL.tall)
      }
      px(c, x, y + 14, TILE, 2, PAL.tallDark)
      break
    }
    case T.Floor: floor(c, s.id, x, y, tx, ty); break
    case T.Wall: wall(c, s.id, x, y, tx, ty); break
    case T.Mat:
      floor(c, s.id, x, y, tx, ty)
      px(c, x + 1, y + 3, 14, 11, PAL.outline)
      px(c, x + 2, y + 4, 12, 9, '#B83838')
      for (let i = 0; i < 3; i++) px(c, x + 3, y + 6 + i * 3, 10, 1, '#E06060')
      break
    case T.Void:
      px(c, x, y, TILE, TILE, PAL.black)
      break
    default: {
      grass(c, x, y, tx, ty)
      if (t === T.Flower) {
        const fx = x + 3 + (frame % 2), fy = y + 3
        for (const [ox, oy, col] of [[0, 0, '#F85858'], [7, 6, '#F8F8F8']] as const) {
          px(c, fx + ox, fy + oy + 1, 3, 1, col); px(c, fx + ox + 1, fy + oy, 1, 3, col); px(c, fx + ox + 1, fy + oy + 1, 1, 1, PAL.gold)
        }
      }
    }
  }
}

const FLOORS: Record<string, [string, string, string]> = {
  lab: ['#E8ECF0', '#D0D8E0', '#B8C0C8'],
  biblioteca: ['#C89058', '#B07840', '#906028'],
  oficina: ['#B89870', '#A08058', '#806040'],
  correio: ['#F0E8D0', '#E0B0A0', '#C89080'],
  farol: ['#C8C0B0', '#B0A898', '#908878'],
}
const WALLS: Record<string, [string, string]> = {
  lab: ['#D8E8F0', '#A8C0D0'], biblioteca: ['#E8D8B8', '#C0A880'], oficina: ['#D8C0A0', '#A88868'],
  correio: ['#F8E8E0', '#E0B8B0'], farol: ['#E0E0E8', '#B0B0C0'],
}

function floor(c: Ctx, id: string, x: number, y: number, tx: number, ty: number) {
  const [a, b, line] = FLOORS[id] ?? FLOORS.lab
  if (id === 'biblioteca' || id === 'oficina') {
    // Tábuas de madeira.
    px(c, x, y, TILE, TILE, a)
    px(c, x, y + 7, TILE, 1, line); px(c, x, y + 15, TILE, 1, line)
    px(c, x + ((ty % 2) ? 4 : 12), y, 1, 7, line); px(c, x + ((ty % 2) ? 10 : 2), y + 8, 1, 7, line)
    px(c, x + 2, y + 2, 4, 1, b)
  } else {
    // Piso quadriculado.
    px(c, x, y, TILE, TILE, (tx + ty) % 2 ? a : b)
    px(c, x, y + 15, TILE, 1, line); px(c, x + 15, y, 1, TILE, line)
  }
}

function wall(c: Ctx, id: string, x: number, y: number, tx: number, ty: number) {
  const [a, b] = WALLS[id] ?? WALLS.lab
  px(c, x, y, TILE, TILE, a)
  for (let i = 0; i < TILE; i += 4) px(c, x + i, y, 1, TILE, b)
  if (ty === 1) { px(c, x, y + 11, TILE, 5, PAL.woodDark); px(c, x, y + 11, TILE, 1, PAL.woodLight) }
  if (ty === 0) px(c, x, y, TILE, 2, b)
  // Janelas na parede de fundo.
  if (ty === 0 && (tx === 3 || tx === 7)) {
    px(c, x + 1, y + 3, 14, 12, PAL.frame)
    px(c, x + 2, y + 4, 12, 10, PAL.glass)
    px(c, x + 7, y + 4, 1, 10, PAL.frame); px(c, x + 2, y + 8, 12, 1, PAL.frame)
    px(c, x + 3, y + 5, 2, 2, PAL.glassLight)
  }
}

// ---------- Objetos do exterior ----------
function drawTree(c: Ctx, tx: number, ty: number) {
  const x = tx * TILE, y = ty * TILE
  const im = img('tiles/tree')
  if (im) { drawAnchored(c, im, x, y, TILE, TILE); return }
  px(c, x + 2, y + 13, 12, 3, PAL.shadow)
  px(c, x + 6, y + 10, 4, 5, PAL.trunk); px(c, x + 6, y + 10, 1, 5, PAL.trunkDark)
  // Copa arredondada (meia-largura por linha).
  const half = [3, 5, 6, 7, 7, 7, 7, 7, 7, 7, 6, 5, 3]
  half.forEach((h, i) => {
    const yy = y - 3 + i
    px(c, x + 8 - h - 1, yy, (h + 1) * 2, 1, PAL.crownLine)
  })
  half.forEach((h, i) => {
    const yy = y - 3 + i
    if (i === 0 || i === half.length - 1) return
    px(c, x + 8 - h, yy, h * 2, 1, i > 8 ? PAL.crownDark : PAL.crown)
  })
  px(c, x + 3, y - 1, 4, 2, PAL.crownLight); px(c, x + 2, y + 1, 2, 2, PAL.crownLight); px(c, x + 9, y + 1, 3, 1, PAL.crownLight)
  px(c, x + 5, y + 4, 2, 1, PAL.crownDark); px(c, x + 10, y + 5, 2, 1, PAL.crownDark)
}

function drawBuilding(c: Ctx, b: Building) {
  const x = b.x * TILE, y = b.y * TILE, w = b.w * TILE, h = b.h * TILE
  const im = img(`buildings/${b.id}`)
  if (im) {
    // Sprite centralizado na porta, base na última fileira da pegada.
    const gw = im.width / D, gh = im.height / D
    c.drawImage(im, b.door.x * TILE + TILE / 2 - gw / 2, y + h - gh + 3, gw, gh)
    return
  }
  if (b.kind === 'lighthouse') return drawLighthouse(c, b)

  px(c, x + 3, y + h - 1, w, 4, PAL.shadow)
  const roofH = b.kind === 'lab' ? 40 : 46
  // Parede.
  px(c, x, y + roofH - 4, w, h - roofH + 4, PAL.outline)
  px(c, x + 1, y + roofH - 3, w - 2, h - roofH + 2, b.wall)
  for (let ly = y + roofH + 2; ly < y + h - 3; ly += 5) px(c, x + 1, ly, w - 2, 1, PAL.wallShade)
  px(c, x + 1, y + h - 4, w - 2, 3, PAL.wallShade)
  // Telhado em camadas de telhas.
  px(c, x - 3, y + 2, w + 6, roofH - 4, PAL.outline)
  px(c, x - 2, y + 3, w + 4, roofH - 6, b.roof)
  px(c, x - 2, y + 3, w + 4, 3, b.roofLight)
  for (let ry = y + 9; ry < y + roofH - 7; ry += 5) {
    px(c, x - 2, ry, w + 4, 1, b.roofDark)
    for (let rx = x + ((ry / 5) % 2 ? 2 : 6); rx < x + w; rx += 8) px(c, rx, ry - 4, 1, 4, b.roofDark)
  }
  px(c, x - 2, y + roofH - 7, w + 4, 4, b.roofDark)
  px(c, x - 3, y + roofH - 3, w + 6, 2, PAL.outline)

  if (b.kind === 'lab') {
    // Antena parabólica e faixa de janelas.
    px(c, x + w - 30, y - 6, 2, 10, PAL.outline)
    px(c, x + w - 36, y - 12, 14, 8, PAL.outline); px(c, x + w - 35, y - 11, 12, 6, '#E8E8F0'); px(c, x + w - 30, y - 9, 2, 2, PAL.coral)
  } else {
    // Chaminé.
    px(c, x + w - 22, y - 6, 10, 12, PAL.outline); px(c, x + w - 21, y - 5, 8, 10, '#A05040'); px(c, x + w - 21, y - 5, 8, 2, '#C87060')
  }

  const winY = y + roofH + 3
  const winXs = b.kind === 'lab' ? [x + 8, x + 28, x + w - 48, x + w - 28] : [x + 8, x + w - 26]
  for (const wx of winXs) {
    px(c, wx - 1, winY - 1, 20, 15, PAL.outline)
    px(c, wx, winY, 18, 13, PAL.frame)
    px(c, wx + 2, winY + 2, 14, 9, PAL.glass)
    px(c, wx + 8, winY + 2, 2, 9, PAL.frame)
    px(c, wx + 3, winY + 3, 3, 3, PAL.glassLight)
  }
  // Porta.
  const dx = b.door.x * TILE, dy = b.door.y * TILE
  px(c, dx + 1, dy - 2, 14, 18, PAL.outline)
  if (b.kind === 'lab') {
    px(c, dx + 2, dy - 1, 12, 17, PAL.glass); px(c, dx + 7, dy - 1, 2, 17, PAL.outline); px(c, dx + 3, dy, 3, 6, PAL.glassLight)
  } else {
    px(c, dx + 2, dy - 1, 12, 17, PAL.door); px(c, dx + 3, dy, 10, 7, PAL.doorDark); px(c, dx + 3, dy + 8, 10, 7, PAL.doorDark)
    px(c, dx + 11, dy + 8, 2, 2, PAL.gold)
  }
}

function drawLighthouse(c: Ctx, b: Building) {
  const x = b.x * TILE, y = b.y * TILE, w = b.w * TILE, h = b.h * TILE
  px(c, x + 2, y + h - 1, w, 4, PAL.shadow)
  px(c, x + 3, y + 16, w - 6, h - 16, PAL.outline)
  for (let i = 0; y + 17 + i * 10 < y + h - 1; i++) px(c, x + 4, y + 17 + i * 10, w - 8, Math.min(10, y + h - 1 - (y + 17 + i * 10)), i % 2 ? b.roof : PAL.paper)
  px(c, x + 1, y + 13, w - 2, 4, PAL.outline); px(c, x + 2, y + 14, w - 4, 2, '#606870')
  px(c, x + 7, y + 2, w - 14, 12, PAL.outline); px(c, x + 9, y + 4, w - 18, 8, PAL.gold); px(c, x + 10, y + 5, 3, 3, PAL.paper)
  px(c, x + 5, y - 3, w - 10, 6, PAL.outline); px(c, x + 6, y - 2, w - 12, 4, b.roofDark)
  const dx = b.door.x * TILE
  px(c, dx + 9, b.door.y * TILE, 14, 16, PAL.outline)
  px(c, dx + 10, b.door.y * TILE + 1, 12, 15, PAL.door)
}

function drawProp(c: Ctx, it: Interactable) {
  const x = it.x * TILE, y = it.y * TILE
  const im = img(`props/${it.kind}`)
  if (im && it.kind !== 'bottle') { drawAnchored(c, im, x, y, TILE, TILE); return }
  switch (it.kind) {
    case 'sign':
      px(c, x + 2, y + 13, 12, 3, PAL.shadow)
      px(c, x + 3, y + 9, 2, 6, PAL.outline); px(c, x + 11, y + 9, 2, 6, PAL.outline)
      px(c, x + 1, y + 1, 14, 10, PAL.outline)
      px(c, x + 2, y + 2, 12, 8, PAL.woodLight)
      px(c, x + 2, y + 8, 12, 2, PAL.wood)
      px(c, x + 4, y + 4, 8, 1, PAL.woodDark); px(c, x + 4, y + 6, 6, 1, PAL.woodDark)
      break
    case 'post':
      px(c, x + 3, y + 13, 10, 3, PAL.shadow)
      px(c, x + 4, y + 3, 8, 12, PAL.outline)
      px(c, x + 5, y + 4, 6, 10, '#B8B8C0'); px(c, x + 5, y + 4, 6, 2, '#D8D8E0')
      px(c, x + 6, y + 7, 4, 4, PAL.amber)
      break
    case 'mailbox':
      px(c, x + 3, y + 13, 10, 3, PAL.shadow)
      px(c, x + 7, y + 9, 2, 6, PAL.outline)
      px(c, x + 2, y + 1, 12, 9, PAL.outline)
      px(c, x + 3, y + 2, 10, 7, '#E04848'); px(c, x + 3, y + 2, 10, 2, '#F87878')
      px(c, x + 5, y + 5, 6, 1, PAL.outline)
      break
  }
}

// ---------- Móveis dos interiores ----------
function drawFurniture(c: Ctx, f: Furniture) {
  const x = f.x * TILE, y = f.y * TILE, w = (f.w ?? 1) * TILE, h = (f.h ?? 1) * TILE
  const im = furnitureImg(f)
  if (im) {
    // Móveis com largura > 1 podem usar uma imagem do tamanho total ou de 1 tile repetida.
    if (im.width >= w * D * 0.6 || (f.w ?? 1) === 1) drawAnchored(c, im, x, y, w, h)
    else for (let i = 0; i < (f.w ?? 1); i++) drawAnchored(c, im, x + i * TILE, y, TILE, h)
    return
  }
  const box = (bx: number, by: number, bw: number, bh: number, fill: string, top?: string) => {
    px(c, bx, by, bw, bh, PAL.outline); px(c, bx + 1, by + 1, bw - 2, bh - 2, fill); if (top) px(c, bx + 1, by + 1, bw - 2, 2, top)
  }
  switch (f.kind) {
    case 'terminal':
      box(x, y + 6, 16, 10, PAL.wood, PAL.woodLight)
      box(x + 2, y - 6, 12, 11, '#9098A8')
      px(c, x + 3, y - 5, 10, 8, '#284858'); px(c, x + 4, y - 4, 5, 1, '#78E8C8'); px(c, x + 4, y - 2, 7, 1, '#78E8C8'); px(c, x + 4, y, 4, 1, '#78E8C8')
      px(c, x + 6, y + 5, 4, 2, PAL.outline)
      break
    case 'pc':
      box(x, y + 6, 16, 10, '#D0D0D8', '#F0F0F8')
      box(x + 2, y - 5, 12, 11, '#E8E8F0')
      px(c, x + 3, y - 4, 10, 7, '#3868B8'); px(c, x + 4, y - 3, 3, 2, '#A8D8F8')
      break
    case 'shelf':
    case 'mailshelf':
      box(x, y - 10, w, 26, PAL.woodDark)
      for (let row = 0; row < 3; row++) {
        const ry = y - 7 + row * 8
        px(c, x + 2, ry + 6, w - 4, 1, PAL.wood)
        for (let bx = x + 2; bx < x + w - 3; bx += 3) {
          const colors = f.kind === 'shelf' ? ['#D04848', '#4878D0', '#48A858', '#E8B830', '#8858B8'] : ['#F8F0D8', '#E8D8B0', '#C89060']
          px(c, bx, ry + (f.kind === 'shelf' ? 0 : 2), 2, f.kind === 'shelf' ? 6 : 4, colors[Math.floor(hash(bx, ry, 1) * colors.length)])
        }
      }
      break
    case 'table':
      box(x, y + 1, w, 12, PAL.woodLight, '#E8C088')
      px(c, x + 2, y + 13, 2, 3, PAL.woodDark); px(c, x + w - 4, y + 13, 2, 3, PAL.woodDark)
      for (let i = 0; i < (f.w ?? 1); i++) if (hash(f.x + i, f.y, 4) > 0.5) px(c, x + i * 16 + 5, y + 4, 5, 4, ['#F8F8F0', '#88C8F0', '#E87070'][i % 3])
      break
    case 'workbench':
      box(x, y + 2, w, 12, PAL.wood, PAL.woodLight)
      px(c, x + 2, y + 14, 2, 2, PAL.woodDark); px(c, x + w - 4, y + 14, 2, 2, PAL.woodDark)
      px(c, x + 4, y + 4, 8, 2, '#909098'); px(c, x + 10, y + 3, 2, 5, PAL.woodDark)
      px(c, x + 18, y + 5, 10, 2, '#C0C0C8'); px(c, x + 18, y + 7, 10, 1, '#808088')
      break
    case 'counter':
      box(x, y, w, 16, '#E05050', '#F8F0E8')
      px(c, x + 1, y + 1, w - 2, 5, '#F8F0E8')
      px(c, x + 1, y + 6, w - 2, 1, PAL.outline)
      break
    case 'plant':
      px(c, x + 3, y + 12, 10, 3, PAL.shadow)
      box(x + 4, y + 8, 8, 7, '#C86838', '#E08850')
      px(c, x + 3, y, 10, 9, PAL.crownLine); px(c, x + 4, y + 1, 8, 7, PAL.crown); px(c, x + 5, y + 2, 3, 2, PAL.crownLight)
      break
    case 'bench':
      box(x, y + 5, 16, 6, PAL.woodLight); px(c, x + 2, y + 11, 2, 4, PAL.woodDark); px(c, x + 12, y + 11, 2, 4, PAL.woodDark)
      break
    case 'stairs':
      for (let i = 0; i < 4; i++) box(x + i * 4, y + i * 8, w - i * 4, h - i * 8, i % 2 ? '#A8A098' : '#C8C0B8')
      break
    case 'plaque':
      px(c, x + 7, y + 10, 2, 5, PAL.woodDark)
      box(x + 1, y - 4, 14, 15, PAL.gold)
      px(c, x + 3, y - 2, 10, 11, PAL.paper); px(c, x + 4, y, 8, 1, '#808080'); px(c, x + 4, y + 2, 6, 1, '#808080'); px(c, x + 4, y + 4, 7, 1, '#808080')
      break
    case 'rug':
      px(c, x + 1, y + 1, w - 2, h - 2, '#4870B8'); px(c, x + 3, y + 3, w - 6, h - 6, '#6890D0'); px(c, x + 3, y + 7, w - 6, 2, PAL.gold)
      break
    case 'crate':
      box(x + 1, y + 2, 14, 13, PAL.wood, PAL.woodLight); px(c, x + 2, y + 8, 12, 1, PAL.woodDark); px(c, x + 7, y + 3, 1, 11, PAL.woodDark)
      break
    case 'anvil':
      box(x + 3, y + 9, 10, 7, PAL.wood)
      box(x + 1, y + 2, 14, 6, '#606878', '#909AA8'); px(c, x + 5, y + 7, 6, 3, '#505868')
      break
    case 'globe':
      px(c, x + 7, y + 11, 2, 4, PAL.woodDark); px(c, x + 4, y + 14, 8, 2, PAL.woodDark)
      px(c, x + 3, y, 10, 11, PAL.outline); px(c, x + 4, y + 1, 8, 9, '#58A0E0'); px(c, x + 5, y + 3, 3, 3, '#58B858'); px(c, x + 9, y + 6, 2, 2, '#58B858')
      break
    case 'bookpile':
      for (let i = 0; i < 3; i++) box(x + 2 + (i % 2), y + 10 - i * 4, 12, 5, ['#D04848', '#4878D0', '#E8B830'][i])
      break
  }
}


/** Pedrinhas: decalque estático, fica no chão pré-renderizado. */
function drawRocks(c: Ctx, s: Scene) {
  const rock = img('decals/rock'), rock2 = img('decals/rock2')
  if (!rock && !rock2) return
  for (let ty = 0; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) {
    const r = hash(tx, ty, 77)
    if (tileAt(s, tx, ty) === T.Grass && r > 0.975) drawAnchored(c, (r > 0.9875 ? rock2 : rock) ?? rock!, tx * TILE, ty * TILE - 3, TILE, TILE)
  }
}

/** Decalque animado desenhado ao vivo (flores, tufos, mato alto). */
export interface Decal { im: HTMLImageElement; fw: number; frames: number; x: number; y: number; w: number; h: number; phase: number; tall: boolean; tx: number; ty: number }

export function sceneDecals(s: Scene): Decal[] {
  if (s.kind !== 'overworld') return []
  const red = img('decals/flower_red'), white = img('decals/flower_white'), tall = img('decals/tall_grass'), tuft = img('decals/tuft')
  const out: Decal[] = []
  const add = (im: HTMLImageElement | undefined, fw: number, tx: number, ty: number, dx: number, dy: number, isTall = false) => {
    if (!im) return
    const w = fw / D, h = im.height / D
    out.push({ im, fw, frames: Math.max(1, Math.floor(im.width / fw)), x: tx * TILE + (TILE - w) / 2 + dx, y: ty * TILE + TILE - h + dy, w, h, phase: Math.floor(hash(tx, ty, 21) * 8), tall: isTall, tx, ty })
  }
  for (let ty = 0; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) {
    const t = tileAt(s, tx, ty), r = hash(tx, ty, 77)
    if (t === T.Flower) add(r < 0.5 ? red : white, 64, tx, ty, 0, 0)
    else if (t === T.TallGrass) add(tall, 67, tx, ty, 0, 1, true)
    else if (t === T.Grass && r < 0.07) add(tuft, 64, tx, ty, (hash(tx, ty, 3) - 0.5) * 6, -2)
  }
  return out
}

function drawDecor(c: Ctx, d: Decor, frame: number) {
  const im = img(`decor/${d.key}`)
  if (!im) return
  const w = (d.w ?? 1) * TILE, x = d.x * TILE
  // O píer é piso: centralizado na fileira caminhável.
  const yb = d.key === 'pier' ? d.y * TILE + 8 + im.height / D / 2 : (d.y + 1) * TILE
  if (d.frames) {
    const fw = im.width / d.frames
    const gw = fw / D, gh = im.height / D
    c.drawImage(im, (frame % d.frames) * fw, 0, fw, im.height, x + (w - gw) / 2, yb - gh, gw, gh)
  } else {
    const gw = im.width / D, gh = im.height / D
    c.drawImage(im, x + (w - gw) / 2, yb - gh, gw, gh)
  }
}

/** Árvore/arbusto do novo conjunto de cenário, se existir. */
function drawTreeDecor(c: Ctx, tx: number, ty: number): boolean {
  const bush = hash(tx, ty, 13) > 0.8
  const im = img(bush ? 'decor/bush' : 'decor/tree') ?? img('decor/tree')
  if (!im) return false
  c.fillStyle = 'rgba(20,40,20,0.25)'
  c.beginPath(); c.ellipse(tx * TILE + 8, ty * TILE + 14, bush ? 7 : 11, 3, 0, 0, Math.PI * 2); c.fill()
  return true
}

/** Pré-render do cenário estático (um quadro; água e decalques são animados ao vivo pelo motor). */
export function bakeScene(s: Scene): HTMLCanvasElement[] {
  return [0].map((frame) => {
    const cv = document.createElement('canvas')
    cv.width = s.w * TILE * D; cv.height = s.h * TILE * D
    const c = cv.getContext('2d')!
    c.imageSmoothingEnabled = false
    const textured = s.kind === 'overworld' ? hasTerrainTextures() && (composeOverworld(c, s, frame), true) : composeInterior(c, s)
    c.setTransform(D, 0, 0, D, 0, 0)
    for (let ty = 0; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) {
      const t = tileAt(s, tx, ty)
      // Com texturas, só o tapete de saída ainda é desenhado por tile.
      if (textured && t !== T.Mat) continue
      drawGround(c, s, t === T.Tree ? T.Grass : t, tx, ty, frame)
    }
    if (s.kind === 'overworld') {
      if (textured) drawRocks(c, s)
      for (let ty = 0; ty < s.h; ty++) {
        for (const d of s.decor) if (d.y === ty && d.key === 'pier') drawDecor(c, d, frame)
        for (let tx = 0; tx < s.w; tx++) if (tileAt(s, tx, ty) === T.Tree && !drawTreeDecor(c, tx, ty)) drawTree(c, tx, ty)
        for (const it of s.interactables) if (it.y === ty && it.kind !== 'npc' && it.kind !== 'bottle' && !img(`props/${it.kind}`)) drawProp(c, it)
        for (const b of buildings) if (b.y + b.h - 1 === ty && !img(`buildings/${b.id}`)) drawBuilding(c, b)
      }
    } else {

      const sorted = [...s.furniture].sort((a, b) => (a.kind === 'rug' ? -1 : 0) - (b.kind === 'rug' ? -1 : 0) || a.y - b.y)
      for (const f of sorted) if (f.kind === 'rug' || !furnitureImg(f)) drawFurniture(c, f)
    }
    return cv
  })
}

const furnitureImg = (f: Furniture) => (f.kind === 'rug' && img('interior/rug')) || img(`furniture/${f.kind}`)

/** Objeto desenhado a cada quadro, ordenado pela base junto com os personagens. */
export interface Sprite { im: HTMLImageElement; sw: number; frames: number; x: number; y: number; w: number; h: number; base: number; sway?: number; bob?: number; fps?: number }

function sprite(im: HTMLImageElement, x: number, yBottom: number, base: number, frames = 1): Sprite {
  const sw = im.width / frames, w = sw / D, h = im.height / D
  return { im, sw, frames, x, y: yBottom - h, w, h, base }
}

/** Objetos altos da cena (árvores, prédios, cenário, móveis) para a camada com profundidade. */
export function sceneSprites(s: Scene): Sprite[] {
  const out: Sprite[] = []
  if (s.kind === 'overworld') {
    for (let ty = 0; ty < s.h; ty++) for (let tx = 0; tx < s.w; tx++) {
      if (tileAt(s, tx, ty) !== T.Tree) continue
      const bush = hash(tx, ty, 13) > 0.8
      const im = img(bush ? 'decor/bush' : 'decor/tree') ?? img('decor/tree')
      if (im) out.push({ ...sprite(im, tx * TILE + 8 - im.width / D / 2, ty * TILE + TILE + (bush ? 0 : 1), (ty + 1) * TILE), sway: bush ? 0.012 : 0.02 })
    }
    for (const d of s.decor) {
      const im = img(`decor/${d.key}`)
      if (!im || d.key === 'pier') continue
      const w = (d.w ?? 1) * TILE, sp = sprite(im, 0, (d.y + 1) * TILE, (d.y + 1) * TILE, d.frames ?? 1)
      sp.x = d.x * TILE + (w - sp.w) / 2
      if (d.key === 'boat') { sp.bob = 1.2; sp.fps = 5 }
      if (d.key === 'fountain') sp.fps = 12
      out.push(sp)
    }
    for (const it of s.interactables) {
      const im = it.kind !== 'npc' && it.kind !== 'bottle' ? img(`props/${it.kind}`) : undefined
      if (im) out.push(sprite(im, it.x * TILE + (TILE - im.width / D) / 2, (it.y + 1) * TILE, (it.y + 1) * TILE))
    }
    for (const b of buildings) {
      const im = img(`buildings/${b.id}`)
      if (im) out.push(sprite(im, b.door.x * TILE + TILE / 2 - im.width / D / 2, (b.y + b.h) * TILE + 3, (b.y + b.h) * TILE))
    }
  } else {
    for (const f of s.furniture) {
      const im = furnitureImg(f)
      if (!im || f.kind === 'rug') continue
      const w = (f.w ?? 1) * TILE, h = (f.h ?? 1) * TILE, x = f.x * TILE, base = f.y * TILE + h
      if (im.width >= w * D * 0.6 || (f.w ?? 1) === 1) out.push(sprite(im, x + (w - im.width / D) / 2, base, base))
      else for (let i = 0; i < (f.w ?? 1); i++) out.push(sprite(im, x + i * TILE + (TILE - im.width / D) / 2, base, base))
    }
  }
  return out
}


// ---------- Personagens (16×24, 3 quadros × 4 direções) ----------
export interface Look { skin: string; hair: string; top: string; topDark: string; pants: string; shoes: string; hat?: string; brim?: string; pack?: string; glasses?: boolean }

export const LOOKS: Record<string, Look> = {
  player: { skin: '#F8C8A0', hair: '#583828', top: '#3878D8', topDark: '#2858A8', pants: '#383848', shoes: '#C83838', hat: '#E84838', brim: '#F8F8F8', pack: '#F0B030' },
  guide: { skin: '#E8B088', hair: '#C85030', top: '#58C8A8', topDark: '#389078', pants: '#486848', shoes: '#584028' },
  scientist: { skin: '#F0C8A8', hair: '#A8A8B0', top: '#F8F8F8', topDark: '#C8C8D0', pants: '#506070', shoes: '#383838', glasses: true },
  librarian: { skin: '#E0A880', hair: '#402818', top: '#8858B8', topDark: '#604090', pants: '#483058', shoes: '#302030', glasses: true },
  artisan: { skin: '#D89870', hair: '#302018', top: '#986038', topDark: '#704020', pants: '#485060', shoes: '#302018', hat: '#E8B830', brim: '#C89820' },
  clerk: { skin: '#F8D0B0', hair: '#E87890', top: '#F8F8F8', topDark: '#E06070', pants: '#E06070', shoes: '#F8F8F8', hat: '#F8F8F8', brim: '#E06070' },
  keeper: { skin: '#E0A880', hair: '#E8E8E8', top: '#284878', topDark: '#183058', pants: '#383848', shoes: '#302018', hat: '#284878', brim: '#183058' },
}

export const CHAR_W = 16, CHAR_H = 24
const ROWS: Dir[] = ['down', 'up', 'left', 'right']
export const dirRow = (d: Dir) => ROWS.indexOf(d)

export function bakeCharacter(lookId: string): HTMLCanvasElement {
  const asset = img(`characters/${lookId}`)
  if (asset) {
    // Normaliza para 3 colunas × 4 linhas.
    const cv = document.createElement('canvas')
    cv.width = asset.width; cv.height = asset.height
    cv.getContext('2d')!.drawImage(asset, 0, 0)
    return cv
  }
  const p = LOOKS[lookId] ?? LOOKS.guide
  const cv = document.createElement('canvas')
  cv.width = CHAR_W * 3; cv.height = CHAR_H * 4
  const c = cv.getContext('2d')!
  const O = PAL.outline

  for (let f = 0; f < 3; f++) {
    for (const dir of ['down', 'up', 'left'] as Dir[]) {
      const ox = f * CHAR_W, oy = dirRow(dir) * CHAR_H
      const r = (x: number, y: number, w: number, h: number, col: string) => px(c, ox + x, oy + y, w, h, col)
      const b = f ? 1 : 0
      const liftL = f === 1 ? 1 : 0, liftR = f === 2 ? 1 : 0
      if (dir !== 'left') {
        // Pernas e sapatos.
        r(5, 19, 2, 2 - liftL + 1, p.pants); r(9, 19, 2, 2 - liftR + 1, p.pants)
        r(5, 22 - liftL, 2, 1, p.shoes); r(9, 22 - liftR, 2, 1, p.shoes)
        // Tronco e braços.
        r(4, 12 + b, 8, 7, p.top); r(4, 17 + b, 8, 2, p.topDark)
        r(3, 13 + b, 1, 4, p.top); r(12, 13 + b, 1, 4, p.top)
        r(3, 17 + b - liftR, 1, 1, p.skin); r(12, 17 + b - liftL, 1, 1, p.skin)
        if (p.pack && dir === 'down') { r(5, 12 + b, 1, 4, p.pack); r(10, 12 + b, 1, 4, p.pack) }
        if (p.pack && dir === 'up') { r(5, 12 + b, 6, 6, p.pack); r(5, 12 + b, 6, 1, O) }
        // Cabeça.
        if (dir === 'down') {
          r(3, 4 + b, 10, 8, p.hair)
          r(4, 6 + b, 8, 6, p.skin)
          r(6, 8 + b, 1, 2, O); r(9, 8 + b, 1, 2, O)
          if (p.glasses) { r(5, 8 + b, 3, 1, O); r(8, 8 + b, 3, 1, O) }
          if (p.hat) { r(3, 2 + b, 10, 4, p.hat); r(2, 6 + b, 12, 1, p.brim ?? p.hat); r(6, 3 + b, 4, 2, p.brim ?? p.hat) }
          else r(3, 3 + b, 10, 3, p.hair)
        } else {
          r(3, 3 + b, 10, 9, p.hair)
          r(4, 10 + b, 8, 1, p.skin)
          if (p.hat) r(3, 2 + b, 10, 6, p.hat)
        }
      } else {
        // Perfil (esquerda); a direita é espelhada depois.
        const apart = f !== 0
        r(apart ? 4 : 6, 19, 2, 3, p.pants); r(apart ? 9 : 8, 19, 2, 3, p.pants)
        r(apart ? 3 : 5, 22, 3, 1, p.shoes); r(apart ? 8 : 7, 22, 3, 1, p.shoes)
        r(5, 12 + b, 6, 7, p.top); r(5, 17 + b, 6, 2, p.topDark)
        if (p.pack) r(10, 12 + b, 2, 6, p.pack)
        const armX = f === 1 ? 5 : f === 2 ? 8 : 7
        r(armX, 13 + b, 2, 4, p.topDark); r(armX, 17 + b, 2, 1, p.skin)
        r(4, 3 + b, 9, 9, p.hair)
        r(3, 6 + b, 7, 6, p.skin)
        r(5, 8 + b, 1, 2, O)
        if (p.glasses) r(3, 8 + b, 4, 1, O)
        if (p.hat) { r(4, 2 + b, 9, 4, p.hat); r(1, 6 + b, 7, 1, p.brim ?? p.hat) }
      }
    }
  }
  // Direita = esquerda espelhada.
  const left = dirRow('left') * CHAR_H, right = dirRow('right') * CHAR_H
  for (let f = 0; f < 3; f++) {
    c.save()
    c.translate((f + 1) * CHAR_W, 0)
    c.scale(-1, 1)
    c.drawImage(cv, f * CHAR_W, left, CHAR_W, CHAR_H, 0, right, CHAR_W, CHAR_H)
    c.restore()
  }
  outline(c, cv.width, cv.height)
  // Amplia para a mesma densidade dos sprites em arquivo.
  const big = document.createElement('canvas')
  big.width = cv.width * D; big.height = cv.height * D
  const bc = big.getContext('2d')!
  bc.imageSmoothingEnabled = false
  bc.drawImage(cv, 0, 0, big.width, big.height)
  return big
}

function outline(c: Ctx, w: number, h: number) {
  const img0 = c.getImageData(0, 0, w, h)
  const d = img0.data, out = new Uint8ClampedArray(d)
  const filled = (x: number, y: number) => x >= 0 && y >= 0 && x < w && y < h && d[(y * w + x) * 4 + 3] > 0
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    if (filled(x, y)) continue
    // Não cruza a fronteira entre quadros.
    const fx = x % CHAR_W, fy = y % CHAR_H
    const n = (dx: number, dy: number) => {
      const nx = fx + dx, ny = fy + dy
      return nx >= 0 && ny >= 0 && nx < CHAR_W && ny < CHAR_H && filled(x + dx, y + dy)
    }
    if (n(-1, 0) || n(1, 0) || n(0, -1) || n(0, 1)) {
      const i = (y * w + x) * 4
      out[i] = 0x28; out[i + 1] = 0x30; out[i + 2] = 0x38; out[i + 3] = 255
    }
  }
  c.putImageData(new ImageData(out, w, h), 0, 0)
}
