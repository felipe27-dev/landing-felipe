import { bakeCharacter, bakeScene, D, dirRow, PAL, sceneDecals, sceneSprites, type Decal, type Sprite } from './art'
import { img } from './assets'
import { audio } from './audio'
import { findPath, pathToAdjacent } from './path'
import { DELTA, type Dir } from './types'
import {
  buildings, buildScenes, interactableAt, isWalkable, regionAt, regions, T, TILE, tileAt, warpAt,
  type Counts, type Interactable, type Scene,
} from './world'
import type { RegionId } from '../content/types'

export interface GameEvents {
  onInteract(it: Interactable, sceneId: string): void
  onRegion(id: RegionId): void
  onNearby(it: Interactable | null): void
  onMove(x: number, y: number, sceneId: string): void
  onScene(sceneId: string): void
  onStep(tile: T): void
}

const KEY_DIR: Record<string, Dir> = {
  ArrowUp: 'up', KeyW: 'up', ArrowDown: 'down', KeyS: 'down',
  ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right',
}
const INTERACT_KEYS = new Set(['KeyE', 'Space', 'Enter', 'NumpadEnter', 'KeyZ'])
const opposite: Record<Dir, Dir> = { up: 'down', down: 'up', left: 'right', right: 'left' }

export class Game {
  private ctx: CanvasRenderingContext2D
  private scenes: Record<string, Scene>
  private scene: Scene
  private baked = new Map<string, HTMLCanvasElement[]>()
  private sheets = new Map<string, HTMLCanvasElement>()
  private npcFace = new Map<string, Dir>()
  private raf = 0
  private last = 0
  private time = 0

  x = 19; y = 17
  private fromX = 19; private fromY = 17
  private progress = 1
  private facing: Dir = 'up'
  private stepCount = 0
  private held: Dir[] = []
  private tap: Dir | null = null
  private touchDir: Dir | null = null
  private running = false
  private queue: { x: number; y: number }[] = []
  private pendingInteract: Interactable | null = null
  private region: RegionId = 'praca'
  private nearby: Interactable | null = null
  private bumpCooldown = 0
  private emote: { id: string; t: number } | null = null
  private greeted = false
  private warp: { phase: 'out' | 'in'; t: number; to: string; tx: number; ty: number; facing: Dir; sfx: 'door' | 'exit' | 'travel' } | null = null

  paused = true
  reducedMotion = false
  fontFamily = "\"Jersey 10\", sans-serif"
  private scale = 3
  private dpr = 1
  private marker: { x: number; y: number; t: number } | null = null

  constructor(private canvas: HTMLCanvasElement, private ev: GameEvents, counts: Counts) {
    this.ctx = canvas.getContext('2d')!
    this.scenes = buildScenes(counts)
    this.scene = this.scenes.overworld
    this.x = this.fromX = this.scene.spawn.x
    this.y = this.fromY = this.scene.spawn.y
    for (const s of Object.values(this.scenes)) for (const i of s.interactables) if (i.face) this.npcFace.set(i.id, i.face)
    window.addEventListener('keydown', this.onKeyDown)
    window.addEventListener('keyup', this.onKeyUp)
    window.addEventListener('blur', this.clearInput)
    canvas.addEventListener('pointerdown', this.onPointer)
    this.resize()
    this.raf = requestAnimationFrame(this.loop)
  }

  destroy() {
    cancelAnimationFrame(this.raf)
    window.removeEventListener('keydown', this.onKeyDown)
    window.removeEventListener('keyup', this.onKeyUp)
    window.removeEventListener('blur', this.clearInput)
    this.canvas.removeEventListener('pointerdown', this.onPointer)
  }

  get sceneId() { return this.scene.id }

  private spriteCache = new Map<string, Sprite[]>()

  private sprites(s: Scene) {
    let l = this.spriteCache.get(s.id)
    if (!l) { l = sceneSprites(s); this.spriteCache.set(s.id, l) }
    return l
  }

  private frames(s: Scene) {
    let f = this.baked.get(s.id)
    if (!f) { f = bakeScene(s); this.baked.set(s.id, f) }
    return f
  }

  private sheet(look: string) {
    let s = this.sheets.get(look)
    if (!s) { s = bakeCharacter(look); this.sheets.set(look, s) }
    return s
  }

  resize() {
    const r = this.canvas.getBoundingClientRect()
    this.dpr = Math.min(window.devicePixelRatio || 1, 2)
    this.canvas.width = Math.round(r.width * this.dpr)
    this.canvas.height = Math.round(r.height * this.dpr)
    // Escala inteira: ~15 × 10 tiles visíveis, como numa tela de portátil.
    // Zoom de portátil: ~13 × 9 tiles visíveis (escala inteira; suaviza quando não é múltipla de 3).
    const fit = Math.floor(Math.min(r.width / (TILE * 13), r.height / (TILE * 9)))
    this.scale = Math.max(2, Math.min(8, fit))
    this.ctx.imageSmoothingEnabled = false
  }

  private talking: string | null = null

  setPaused(p: boolean) {
    this.paused = p
    if (!p) this.talking = null
    if (p) this.clearInput()
  }

  setTouchDir(d: Dir | null) {
    this.touchDir = d
    if (d) { this.tap = d; this.queue = []; this.pendingInteract = null }
  }

  interact() {
    if (this.paused || this.progress < 1 || this.warp) return
    const [dx, dy] = DELTA[this.facing]
    const it = interactableAt(this.scene, this.x + dx, this.y + dy)
    if (it) this.fire(it)
  }

  private fire(it: Interactable) {
    // NPCs viram para o jogador; o balcão aciona o atendente atrás dele.
    const npc = it.kind === 'npc' ? it : it.id === 'counter' ? this.scene.interactables.find((i) => i.id === 'clerk') : null
    if (npc) this.npcFace.set(npc.id, npc.id === 'clerk' ? 'down' : opposite[this.facing])
    this.talking = npc?.id ?? null
    audio.sfx('interact')
    this.ev.onInteract(it, this.scene.id)
  }

  travelTo(id: RegionId) {
    const r = regions.find((g) => g.id === id)
    if (!r || this.warp) return
    this.startWarp({ to: 'overworld', tx: r.spawn.x, ty: r.spawn.y, facing: 'up' }, 'travel')
  }

  private startWarp(w: { to: string; tx: number; ty: number; facing: Dir }, sfx: 'door' | 'exit' | 'travel') {
    this.queue = []; this.pendingInteract = null
    this.warp = { phase: 'out', t: 0, to: w.to, tx: w.tx, ty: w.ty, facing: w.facing, sfx }
    audio.sfx(sfx)
  }

  private applyWarp() {
    const w = this.warp!
    const changed = this.scene.id !== w.to
    this.scene = this.scenes[w.to]
    this.x = this.fromX = w.tx; this.y = this.fromY = w.ty
    this.facing = w.facing
    this.progress = 1
    if (changed) this.ev.onScene(this.scene.id)
    this.afterStep(true)
  }

  private clearInput = () => { this.held = []; this.tap = null; this.touchDir = null; this.running = false }

  private onKeyDown = (e: KeyboardEvent) => {
    if (this.paused) return
    const tag = (e.target as HTMLElement)?.tagName
    if ((tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON' || tag === 'A') && !(e.code in KEY_DIR)) return
    if (e.key === 'Shift' || e.code === 'KeyX') this.running = true
    const d = KEY_DIR[e.code]
    if (d) {
      e.preventDefault()
      if (!e.repeat) this.tap = d
      this.held = [d, ...this.held.filter((h) => h !== d)]
      this.queue = []; this.pendingInteract = null
    } else if (INTERACT_KEYS.has(e.code) && !e.repeat) {
      e.preventDefault()
      this.interact()
    }
  }

  private onKeyUp = (e: KeyboardEvent) => {
    if (e.key === 'Shift' || e.code === 'KeyX') this.running = false
    const d = KEY_DIR[e.code]
    if (d) this.held = this.held.filter((h) => h !== d)
  }

  private onPointer = (e: PointerEvent) => {
    if (this.paused || this.warp) return
    const r = this.canvas.getBoundingClientRect()
    const { camX, camY } = this.camera()
    const T = TILE * this.scale
    const tx = Math.floor((e.clientX - r.left - camX) / T)
    let ty = Math.floor((e.clientY - r.top - camY) / T)
    // Clique na cabeça de um personagem (tile de cima) conta para ele.
    if (!interactableAt(this.scene, tx, ty) && interactableAt(this.scene, tx, ty + 1)?.kind === 'npc') ty++
    if (tx < 0 || ty < 0 || tx >= this.scene.w || ty >= this.scene.h) return
    this.goTo(tx, ty)
  }

  /** Caminha até o tile; objeto: vai ao lado e interage; prédio: vai até a porta. */
  goTo(tx: number, ty: number) {
    const s = this.scene, start = { x: this.x, y: this.y }
    const b = s.kind === 'overworld' ? buildings.find((bb) => tx >= bb.x && tx < bb.x + bb.w && ty >= bb.y && ty < bb.y + bb.h) : undefined
    if (b) { tx = b.door.x; ty = b.door.y }
    const target = interactableAt(s, tx, ty)
    if (target) {
      const steps = pathToAdjacent(s, start, target)
      if (!steps) return
      this.queue = steps
      this.pendingInteract = target
      this.marker = { x: target.x, y: target.y, t: 0 }
      if (!steps.length && this.progress >= 1) this.faceAndInteract()
      return
    }
    const steps = findPath(s, start, { x: tx, y: ty })
    if (!steps) { audio.sfx('bump'); return }
    this.queue = steps
    this.pendingInteract = null
    this.marker = { x: tx, y: ty, t: 0 }
  }

  private faceAndInteract() {
    const it = this.pendingInteract
    if (!it) return
    this.pendingInteract = null
    const dx = it.x - this.x, dy = it.y - this.y
    this.facing = dx > 0 ? 'right' : dx < 0 ? 'left' : dy > 0 ? 'down' : 'up'
    this.fire(it)
  }

  private tryStep(d: Dir): boolean {
    this.facing = d
    const [dx, dy] = DELTA[d]
    const nx = this.x + dx, ny = this.y + dy
    if (!isWalkable(this.scene, nx, ny)) {
      if (this.bumpCooldown <= 0) { audio.sfx('bump'); this.bumpCooldown = 0.35 }
      return false
    }
    this.fromX = this.x; this.fromY = this.y
    this.x = nx; this.y = ny
    this.progress = 0
    this.stepCount++
    return true
  }

  private afterStep(arrived = false) {
    const s = this.scene
    const reg = regionAt(s, this.x, this.y)
    if (reg !== this.region) { this.region = reg; this.ev.onRegion(reg) }
    this.ev.onMove(this.x, this.y, s.id)
    audio.playMusic(s.kind === 'interior' ? 'interior' : reg === 'praia' ? 'beach' : 'overworld')

    if (!arrived) {
      this.ev.onStep(tileAt(s, this.x, this.y))
      // Portas e tapetes de saída.
      const w = warpAt(s, this.x, this.y)
      if (w) { this.startWarp(w, s.kind === 'overworld' ? 'door' : 'exit'); return }
    }

    if (!this.greeted && s.kind === 'overworld') {
      const g = s.interactables.find((i) => i.id === 'guide')!
      if (Math.abs(g.x - this.x) + Math.abs(g.y - this.y) <= 3) { this.greeted = true; this.emote = { id: 'guide', t: 0 } }
    }

    const [dx, dy] = DELTA[this.facing]
    let near = interactableAt(s, this.x + dx, this.y + dy) ?? null
    if (!near) for (const d of Object.values(DELTA)) { near = interactableAt(s, this.x + d[0], this.y + d[1]) ?? null; if (near) break }
    if (near !== this.nearby) { this.nearby = near; this.ev.onNearby(near) }
  }

  private update(dt: number) {
    this.time += dt
    this.bumpCooldown -= dt
    if (this.marker) { this.marker.t += dt; if (this.marker.t > 0.6) this.marker = null }
    if (this.emote) { this.emote.t += dt; if (this.emote.t > 1.2) this.emote = null }

    if (this.warp) {
      this.warp.t += dt * (this.reducedMotion ? 20 : 4)
      if (this.warp.t >= 1) {
        if (this.warp.phase === 'out') { this.applyWarp(); this.warp.phase = 'in'; this.warp.t = 0 }
        else this.warp = null
      }
      return
    }

    const speed = this.running ? 8.5 : 4.8
    let carry = 0
    if (this.progress < 1) {
      this.progress += dt * speed
      if (this.progress < 1) return
      carry = Math.min(0.9, this.progress - 1) // fração do próximo passo já "andada" neste quadro
      this.progress = 1
      this.afterStep()
      if (this.warp) return
    }
    if (this.paused) return
    const go = (d: Dir) => { const ok = this.tryStep(d); if (ok) this.progress = carry; return ok }

    const dir = this.touchDir ?? this.held[0] ?? this.tap
    this.tap = null
    if (dir) { go(dir); return }

    const next = this.queue.shift()
    if (next) {
      const d: Dir = next.x > this.x ? 'right' : next.x < this.x ? 'left' : next.y > this.y ? 'down' : 'up'
      if (!go(d)) this.queue = []
    } else if (this.pendingInteract) this.faceAndInteract()
  }

  private camera() {
    const s = this.scale, sc = this.scene
    const r = this.canvas.getBoundingClientRect()
    const t = this.progress
    const pxx = (this.fromX + (this.x - this.fromX) * t + 0.5) * TILE * s
    const pyy = (this.fromY + (this.y - this.fromY) * t + 0.5) * TILE * s
    const mapW = sc.w * TILE * s, mapH = sc.h * TILE * s
    let camX = r.width / 2 - pxx, camY = r.height / 2 - pyy
    camX = mapW < r.width ? (r.width - mapW) / 2 : Math.min(0, Math.max(r.width - mapW, camX))
    camY = mapH < r.height ? (r.height - mapH) / 2 : Math.min(0, Math.max(r.height - mapH, camY))
    return { camX: Math.round(camX), camY: Math.round(camY) }
  }

  /** Quantos quadros por direção a folha tem (células com proporção 2:3). */
  private cols(look: string) {
    const sh = this.sheet(look)
    return Math.max(1, Math.round(sh.width / ((sh.height / 4) * (2 / 3))))
  }

  private drawChar(look: string, x: number, y: number, dir: Dir, frame: number, camX: number, camY: number, breathe = 0) {
    const c = this.ctx, s = this.scale, T = TILE * s
    const sh = this.sheet(look)
    const fw = sh.width / this.cols(look), fh = sh.height / 4
    const gw = fw / D * s, gh = fh / D * s * (1 + breathe)
    const bx = Math.round(camX + x * T), by = Math.round(camY + y * T)
    // Sombra oval suave sob os pés, para assentar o personagem no chão.
    const g = c.createRadialGradient(bx + T / 2, by + T - 2 * s, 0, bx + T / 2, by + T - 2 * s, 7 * s)
    g.addColorStop(0, 'rgba(20,30,20,0.38)'); g.addColorStop(1, 'rgba(20,30,20,0)')
    c.fillStyle = g
    c.beginPath(); c.ellipse(bx + T / 2, by + T - 2 * s, 7 * s, 2.6 * s, 0, 0, Math.PI * 2); c.fill()
    c.drawImage(sh, frame * fw, dirRow(dir) * fh, fw, fh, bx + Math.round((T - gw) / 2), by + T - gh, gw, gh)
  }

  private render() {
    const c = this.ctx, s = this.scale, dpr = this.dpr, sc = this.scene
    c.setTransform(1, 0, 0, 1, 0, 0)
    c.fillStyle = sc.kind === 'interior' ? PAL.black : PAL.water
    c.fillRect(0, 0, this.canvas.width, this.canvas.height)
    const { camX, camY } = this.camera()
    c.setTransform(dpr, 0, 0, dpr, 0, 0)
    // Escala múltipla da densidade fica nítida; nas demais suaviza para não distorcer.
    c.imageSmoothingEnabled = (s * dpr) % D !== 0
    c.imageSmoothingQuality = 'high'

    if (sc.kind === 'overworld') this.drawWater(camX, camY)
    const baked = this.frames(sc)[0]
    c.drawImage(baked, camX, camY, sc.w * TILE * s, sc.h * TILE * s)
    this.drawDecals(sc, camX, camY)

    const T = TILE * s
    const sx = (tx: number) => camX + tx * T, sy = (ty: number) => camY + ty * T

    if (this.marker) {
      c.strokeStyle = `rgba(255,255,255,${1 - this.marker.t / 0.6})`
      c.lineWidth = s
      c.strokeRect(sx(this.marker.x) + s, sy(this.marker.y) + s, T - 2 * s, T - 2 * s)
    }

    const bottle = sc.interactables.find((i) => i.kind === 'bottle')
    if (bottle) this.drawBottle(sx(bottle.x), sy(bottle.y))

    // Personagens por profundidade.
    const t = this.progress
    const ppx = this.fromX + (this.x - this.fromX) * t, ppy = this.fromY + (this.y - this.fromY) * t
    const pc = this.cols('player')
    // Ciclo clássico de RPG portátil: em cada tile, metade com o pé à frente (alternando
    // esquerdo/direito a cada passo) e metade parado. Com folhas de mais quadros, avança pela distância.
    // Folha de 8 quadros = 1 ciclo completo a cada 2 tiles (≈19 fps andando, ≈34 correndo).
    const walkFrame = t >= 1 ? 0 : pc >= 8
      ? Math.floor((this.stepCount + t) * (pc / 2)) % pc
      : pc >= 4 ? 1 + (Math.floor((this.stepCount + t) * 3.4) % (pc - 1))
      : t < 0.5 ? (this.stepCount % 2 ? 1 : 2) : 0
    const actors = sc.interactables.filter((i) => i.kind === 'npc').map((i) => {
      let dir = this.npcFace.get(i.id) ?? 'down'
      if (i.id === 'guide' && !this.paused && Math.abs(this.x - i.x) + Math.abs(this.y - i.y) <= 3)
        dir = Math.abs(this.x - i.x) > Math.abs(this.y - i.y) ? (this.x < i.x ? 'left' : 'right') : (this.y < i.y ? 'up' : 'down')
      const talking = this.paused && this.talking === i.id && dir === 'down' && this.cols(i.look ?? 'guide') > 1
      return { look: i.look ?? 'guide', x: i.x, y: i.y, dir, f: talking ? 1 : 0, player: false, phase: i.x * 1.7 + i.y, lift: 0 }
    })
    // Leve sobe-desce contínuo (1 por tile), só enquanto anda.
    const lift = 0 // a descida do tronco já está nos quadros da caminhada
    actors.push({ look: 'player', x: ppx, y: ppy - lift, dir: this.facing, f: walkFrame, player: true, phase: 0, lift })
    // Personagens e objetos altos na mesma fila, pela base (em px de jogo): quem está "acima" fica atrás.
    type Item = { base: number; actor?: (typeof actors)[number]; sp?: Sprite }
    const items: Item[] = actors.map((a) => ({ base: (a.y + a.lift + 1) * TILE + 0.5, actor: a }))
    const viewTop = -camY / s - 64, viewBottom = (-camY + this.canvas.height / dpr) / s + 160
    for (const sp of this.sprites(sc)) if (sp.base > viewTop && sp.base < viewBottom) items.push({ base: sp.base, sp })
    items.sort((a, b) => a.base - b.base)
    for (const it of items) {
      if (it.sp) {
        const p = it.sp, rm = this.reducedMotion
        const f = rm ? 0 : Math.floor(this.time * (p.fps ?? 8) + p.base * 0.37) % p.frames
        const dx = Math.round(camX + p.x * s), dy = camY + p.y * s + (p.bob && !rm ? Math.sin(this.time * 1.8 + p.x) * p.bob * s : 0)
        if (p.sway && !rm) {
          // Inclina a partir da base (copas balançando ao vento), contínuo a 60 fps.
          const k = Math.sin(this.time * 1.3 + p.x * 0.21) * p.sway
          c.save()
          c.transform(1, 0, -k, 1, k * (dy + p.h * s), 0)
          c.drawImage(p.im, f * p.sw, 0, p.sw, p.im.height, dx, Math.round(dy), p.w * s, p.h * s)
          c.restore()
        } else c.drawImage(p.im, f * p.sw, 0, p.sw, p.im.height, dx, Math.round(dy), p.w * s, p.h * s)
        continue
      }
      const a = it.actor!
      // NPCs respiram (escala vertical sutil); o jogador anima pelos quadros.
      const breathe = a.player || this.reducedMotion ? 0 : Math.sin(this.time * 2.2 + a.phase) * 0.018
      this.drawChar(a.look, a.x, a.y, a.dir, a.f, camX, camY, breathe)
      // Mato alto cobre os pés do jogador.
      if (a.player && t >= 0.5 && tileAt(sc, this.x, this.y) === T_TALL) {
        const d = this.decals(sc).find((k) => k.tall && k.tx === this.x && k.ty === this.y)
        if (d) {
          const cut = 8, f = (Math.floor(this.time * 5) + d.phase) % d.frames
          c.drawImage(d.im, f * d.fw, d.im.height - cut * D, d.fw, cut * D, Math.round(camX + d.x * s), Math.round(camY + (d.y + d.h - cut) * s), d.w * s, cut * s)
        }
      }
    }

    if (sc.kind === 'overworld') {
      c.font = `${Math.max(12, 5.5 * s)}px ${this.fontFamily}`
      c.textAlign = 'center'; c.textBaseline = 'middle'
      for (const b of buildings) {
        const bim = img(`buildings/${b.id}`)
        const top = bim ? b.y + b.h - bim.height / D / TILE : b.y
        const cx = sx(b.door.x) + T / 2, cy = sy(top) - 6 * s
        this.drawTag(b.label, cx, cy)
      }
    }

    if (this.emote) {
      const n = sc.interactables.find((i) => i.id === this.emote!.id)
      if (n) this.drawEmote(sx(n.x), sy(n.y) - 32 * s)
    }

    if (this.nearby && !this.paused && !this.emote) {
      const n = this.nearby
      const x0 = sx(n.x)
      const yy = sy(n.y) - (n.kind === 'npc' ? 22 : 7) * s + (this.reducedMotion ? 0 : Math.round(Math.sin(this.time * 6)) * s)
      c.fillStyle = PAL.outline
      c.beginPath(); c.moveTo(x0 + 3 * s, yy); c.lineTo(x0 + 13 * s, yy); c.lineTo(x0 + 8 * s, yy + 6 * s); c.fill()
      c.fillStyle = '#F8F8F8'
      c.beginPath(); c.moveTo(x0 + 5 * s, yy + s); c.lineTo(x0 + 11 * s, yy + s); c.lineTo(x0 + 8 * s, yy + 4 * s); c.fill()
    }

    if (this.warp) {
      const a = this.warp.phase === 'out' ? this.warp.t : 1 - this.warp.t
      c.setTransform(1, 0, 0, 1, 0, 0)
      c.fillStyle = this.warp.sfx === 'travel' ? `rgba(248,248,248,${a})` : `rgba(16,16,24,${a})`
      c.fillRect(0, 0, this.canvas.width, this.canvas.height)
    }
  }

  private decalCache = new Map<string, Decal[]>()
  private decals(s: Scene) {
    let l = this.decalCache.get(s.id)
    if (!l) { l = sceneDecals(s); this.decalCache.set(s.id, l) }
    return l
  }

  /** Água: padrão repetido do quadro atual, deslizando devagar, por trás do chão. */
  private drawWater(camX: number, camY: number) {
    const c = this.ctx, s = this.scale
    const n = [0, 1, 2, 3, 4, 5, 6, 7].filter((i) => img(`textures/water${i}`)).length
    if (!n) return
    const pos = this.reducedMotion ? 0 : this.time * 3 // 3 quadros-chave por segundo, misturados a 60 fps
    const a = Math.floor(pos) % n, b = (a + 1) % n, mix = pos - Math.floor(pos)
    const drift = this.reducedMotion ? 0 : this.time * 3
    const w = this.canvas.width / this.dpr, h = this.canvas.height / this.dpr
    for (const [idx, alpha] of [[a, 1], [b, mix]] as const) {
      const im = img(`textures/water${idx}`)
      const pat = im && c.createPattern(im, 'repeat')
      if (!pat || alpha <= 0) continue
      pat.setTransform(new DOMMatrix().translate(camX + drift * s, camY).scale(s / D))
      c.globalAlpha = alpha
      c.fillStyle = pat
      c.fillRect(0, 0, w, h)
    }
    c.globalAlpha = 1
  }

  /** Flores, tufos e mato alto balançando (só os visíveis). */
  private drawDecals(sc: Scene, camX: number, camY: number) {
    const c = this.ctx, s = this.scale
    const vw = this.canvas.width / this.dpr, vh = this.canvas.height / this.dpr
    const rm = this.reducedMotion, pos = rm ? 0 : this.time * 0.9
    for (const d of this.decals(sc)) {
      const x = Math.round(camX + d.x * s), y = Math.round(camY + d.y * s), w = d.w * s, h = d.h * s
      if (x + w < 0 || y + h < 0 || x > vw || y > vh) continue
      const p = pos + d.phase, f = Math.floor(p) % d.frames, g = (f + 1) % d.frames, mix = rm ? 0 : p - Math.floor(p)
      const k = rm ? 0 : Math.sin(this.time * 0.9 + d.phase * 0.8) * (d.tall ? 0.016 : 0.011)
      c.save()
      c.transform(1, 0, -k, 1, k * (y + h), 0) // inclina a partir da base, contínuo
      c.drawImage(d.im, f * d.fw, 0, d.fw, d.im.height, x, y, w, h)
      if (mix > 0.02) { c.globalAlpha = mix; c.drawImage(d.im, g * d.fw, 0, d.fw, d.im.height, x, y, w, h) }
      c.restore()
    }
  }

  /** Etiqueta no estilo das caixas do jogo (borda escura, filete azul, fundo claro). */
  private drawTag(text: string, cx: number, cy: number) {
    const c = this.ctx, s = this.scale
    const w = c.measureText(text).width + 12 * s, h = 11 * s, x = cx - w / 2, y = cy - h / 2, r = 3 * s
    const rr = (x0: number, y0: number, w0: number, h0: number, r0: number, col: string) => {
      c.fillStyle = col; c.beginPath(); c.roundRect(x0, y0, w0, h0, r0); c.fill()
    }
    rr(x, y + s, w, h, r, 'rgba(0,0,0,0.25)')
    rr(x, y, w, h, r, PAL.outline)
    rr(x + s, y + s, w - 2 * s, h - 2 * s, r * 0.7, '#F8F8F4')
    c.strokeStyle = '#6890C8'; c.lineWidth = Math.max(1, s * 0.6)
    c.beginPath(); c.roundRect(x + 2 * s, y + 2 * s, w - 4 * s, h - 4 * s, r * 0.5); c.stroke()
    c.fillStyle = PAL.outline; c.fillText(text, cx, cy + s * 0.4)
  }

  private drawBottle(x: number, y: number) {
    const c = this.ctx, s = this.scale, T = TILE * s
    const bob = this.reducedMotion ? 0 : Math.round(Math.sin(this.time * 3)) * s
    const im = img('props/bottle')
    if (im) {
      const fw = TILE * D, frames = Math.max(1, Math.floor(im.width / fw))
      const h = (im.height / D) * s
      c.drawImage(im, (Math.floor(this.time * 4) % frames) * fw, 0, fw, im.height, x, y + T - h + bob, T, h)
      return
    }
    c.fillStyle = PAL.outline; c.fillRect(x + 5 * s, y + 5 * s + bob, 6 * s, 9 * s)
    c.fillStyle = '#88D0B0'; c.fillRect(x + 6 * s, y + 8 * s + bob, 4 * s, 5 * s)
    c.fillStyle = PAL.paper; c.fillRect(x + 7 * s, y + 9 * s + bob, 2 * s, 3 * s)
    c.fillStyle = PAL.wood; c.fillRect(x + 6 * s, y + 6 * s + bob, 4 * s, 2 * s)
    if (Math.floor(this.time * 2) % 2 === 0) {
      c.fillStyle = '#FFFFFF'; c.fillRect(x + 12 * s, y + 2 * s, s, 3 * s); c.fillRect(x + 11 * s, y + 3 * s, 3 * s, s)
    }
  }

  private drawEmote(x: number, y: number) {
    const c = this.ctx, s = this.scale
    const im = img('ui/emote')
    if (im) {
      const fw = TILE * D, frames = Math.max(1, Math.floor(im.width / fw))
      const f = Math.min(frames - 1, Math.floor((this.emote?.t ?? 1) * 14))
      c.drawImage(im, f * fw, 0, fw, im.height, x, y, (fw / D) * s, (im.height / D) * s)
      return
    }
    c.fillStyle = PAL.outline; c.fillRect(x + 2 * s, y, 12 * s, 13 * s); c.fillRect(x + 6 * s, y + 13 * s, 4 * s, 2 * s)
    c.fillStyle = '#F8F8F8'; c.fillRect(x + 3 * s, y + s, 10 * s, 11 * s)
    c.fillStyle = '#E04040'; c.fillRect(x + 7 * s, y + 3 * s, 2 * s, 5 * s); c.fillRect(x + 7 * s, y + 9 * s, 2 * s, 2 * s)
  }

  private loop = (now: number) => {
    const dt = Math.min(0.05, (now - (this.last || now)) / 1000)
    this.last = now
    this.update(dt)
    this.render()
    this.raf = requestAnimationFrame(this.loop)
  }
}

const T_TALL = T.TallGrass
