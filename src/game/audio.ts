// Áudio: usa arquivos de public/assets/audio/ quando existem; senão, sintetiza
// chiptune original com WebAudio (ondas quadrada/triangular + ruído).
import available from 'virtual:asset-list'

export type Music = 'title' | 'overworld' | 'interior' | 'beach'
export type Sfx = 'bump' | 'interact' | 'select' | 'text' | 'door' | 'exit' | 'menu_open' | 'menu_move' | 'achievement' | 'travel' | 'secret'

export const MUSIC: Music[] = ['title', 'overworld', 'interior', 'beach']
export const SFX: Sfx[] = ['bump', 'interact', 'select', 'text', 'door', 'exit', 'menu_open', 'menu_move', 'achievement', 'travel', 'secret']

const base = `${import.meta.env.BASE_URL}assets/audio/`
const EXT = ['ogg', 'mp3', 'wav']
const midi = (n: number) => 440 * Math.pow(2, (n - 69) / 12)

// Composições originais: [melodia, baixo] em colcheias, 0 = pausa.
const SONGS: Record<Music, { bpm: number; lead: number[]; bass: number[]; wave: OscillatorType }> = {
  overworld: {
    bpm: 132, wave: 'square',
    lead: [76, 79, 84, 79, 81, 79, 76, 74, 72, 74, 76, 79, 76, 0, 74, 0, 77, 81, 84, 81, 79, 76, 72, 76, 74, 76, 77, 74, 72, 0, 0, 0],
    bass: [48, 0, 55, 0, 48, 0, 55, 0, 48, 0, 55, 0, 48, 0, 55, 0, 53, 0, 48, 0, 53, 0, 48, 0, 55, 0, 50, 0, 55, 0, 48, 0],
  },
  interior: {
    bpm: 100, wave: 'triangle',
    lead: [72, 0, 76, 0, 79, 0, 76, 0, 74, 0, 77, 0, 81, 0, 77, 0, 72, 0, 76, 0, 79, 81, 79, 76, 74, 0, 71, 0, 72, 0, 0, 0],
    bass: [48, 0, 0, 0, 55, 0, 0, 0, 50, 0, 0, 0, 57, 0, 0, 0, 48, 0, 0, 0, 52, 0, 0, 0, 43, 0, 0, 0, 48, 0, 0, 0],
  },
  beach: {
    bpm: 112, wave: 'triangle',
    lead: [79, 0, 76, 79, 81, 0, 79, 0, 76, 0, 74, 76, 72, 0, 0, 0, 77, 0, 76, 77, 79, 0, 77, 0, 76, 0, 74, 72, 74, 0, 0, 0],
    bass: [48, 0, 52, 0, 55, 0, 52, 0, 45, 0, 48, 0, 52, 0, 48, 0, 41, 0, 45, 0, 48, 0, 45, 0, 43, 0, 47, 0, 50, 0, 47, 0],
  },
  title: {
    bpm: 120, wave: 'square',
    lead: [72, 0, 72, 79, 0, 79, 84, 0, 83, 0, 79, 0, 76, 0, 79, 0, 77, 0, 77, 81, 0, 81, 84, 0, 86, 0, 84, 0, 83, 0, 0, 0],
    bass: [48, 48, 0, 48, 55, 0, 52, 0, 43, 43, 0, 43, 55, 0, 52, 0, 41, 41, 0, 41, 53, 0, 50, 0, 43, 43, 0, 43, 47, 0, 50, 0],
  },
}

class AudioManager {
  private ctx: AudioContext | null = null
  private master!: GainNode
  private musicGain!: GainNode
  private sfxGain!: GainNode
  private buffers = new Map<string, AudioBuffer>()
  private current: Music | null = null
  /** Vozes de música tocando (cada repetição da faixa é uma voz, para o crossfade). */
  private voices: { src: AudioBufferSourceNode; gain: GainNode }[] = []
  private loopTimer = 0
  /** Trecho útil de cada faixa (sem silêncio no começo/fim). */
  private trims = new Map<string, { start: number; end: number }>()
  private timer = 0
  private step = 0
  private nextTime = 0
  private noise: AudioBuffer | null = null
  private listeners = new Set<() => void>()
  muted = false
  volume = 0.7

  constructor() {
    try {
      this.muted = localStorage.getItem('ilha:muted') === '1'
      const v = Number(localStorage.getItem('ilha:volume'))
      if (v > 0 && v <= 1) this.volume = v
    } catch { /* armazenamento indisponível */ }
  }

  get music() { return this.current }

  subscribe(fn: () => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }
  private emit() { this.listeners.forEach((f) => f()) }

  /** Precisa ser chamado num gesto do usuário (clique/tecla). */
  async unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') await this.ctx.resume(); return }
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    if (!AC) return
    this.ctx = new AC()
    this.master = this.ctx.createGain()
    this.musicGain = this.ctx.createGain(); this.musicGain.gain.value = 0.5
    this.sfxGain = this.ctx.createGain(); this.sfxGain.gain.value = 0.8
    this.musicGain.connect(this.master); this.sfxGain.connect(this.master); this.master.connect(this.ctx.destination)
    this.applyVolume()
    const n = this.ctx.createBuffer(1, this.ctx.sampleRate * 0.3, this.ctx.sampleRate)
    const d = n.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1
    this.noise = n
    await Promise.all([...MUSIC.map((m) => `music/${m}`), ...SFX.map((s) => `sfx/${s}`)].map((k) => this.tryLoad(k)))
    const pending = this.current; this.current = null
    if (pending) this.playMusic(pending)
  }

  private async tryLoad(key: string) {
    for (const ext of EXT) {
      if (!available.includes(`audio/${key}.${ext}`)) continue
      try {
        const res = await fetch(`${base}${key}.${ext}`)
        if (!res.ok || (res.headers.get('content-type') ?? '').includes('text/html')) continue
        this.buffers.set(key, await this.ctx!.decodeAudioData(await res.arrayBuffer()))
        return
      } catch { /* tenta a próxima extensão */ }
    }
  }

  private applyVolume() { if (this.master) this.master.gain.value = this.muted ? 0 : this.volume }

  setMuted(m: boolean) {
    this.muted = m; this.applyVolume()
    try { localStorage.setItem('ilha:muted', m ? '1' : '0') } catch { /* ignora */ }
    this.emit()
  }

  setVolume(v: number) {
    this.volume = v; this.applyVolume()
    try { localStorage.setItem('ilha:volume', String(v)) } catch { /* ignora */ }
    this.emit()
  }

  playMusic(name: Music) {
    if (this.current === name) return
    this.stopMusic(0.8)
    this.current = name
    if (!this.ctx) return
    const buf = this.buffers.get(`music/${name}`)
    if (buf) { this.startVoice(name, buf, this.ctx.currentTime + 0.05, 0.8); return }
    this.step = 0
    this.nextTime = this.ctx.currentTime + 0.05
    this.timer = window.setInterval(() => this.schedule(), 25)
  }

  /** Inicia uma repetição da faixa e agenda a próxima com crossfade antes do fim. */
  private startVoice(name: Music, buf: AudioBuffer, at: number, fadeIn: number) {
    const ctx = this.ctx!
    const trim = this.trim(`music/${name}`, buf)
    const len = trim.end - trim.start
    const xf = Math.min(4, len * 0.12) // duração do crossfade entre repetições
    const src = ctx.createBufferSource(), gain = ctx.createGain()
    src.buffer = buf; src.connect(gain); gain.connect(this.musicGain)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(1, at + fadeIn)
    const fadeAt = at + len - xf
    gain.gain.setValueAtTime(1, fadeAt)
    gain.gain.linearRampToValueAtTime(0, at + len)
    src.start(at, trim.start, len)
    const voice = { src, gain }
    this.voices.push(voice)
    src.onended = () => { this.voices = this.voices.filter((v) => v !== voice) }
    // Agenda a próxima repetição um pouco antes do início do crossfade.
    window.clearTimeout(this.loopTimer)
    this.loopTimer = window.setTimeout(() => {
      if (this.current === name) this.startVoice(name, buf, fadeAt, xf)
    }, Math.max(0, (fadeAt - ctx.currentTime - 0.5) * 1000))
  }

  /** Detecta silêncio no início/fim para o loop não ter "buraco". */
  private trim(key: string, buf: AudioBuffer) {
    let t = this.trims.get(key)
    if (t) return t
    const d = buf.getChannelData(0), th = 0.004
    let a = 0, b = d.length - 1
    while (a < b && Math.abs(d[a]) < th) a++
    while (b > a && Math.abs(d[b]) < th) b--
    t = { start: a / buf.sampleRate, end: (b + 1) / buf.sampleRate }
    this.trims.set(key, t)
    return t
  }

  stopMusic(fade = 0.3) {
    window.clearInterval(this.timer)
    window.clearTimeout(this.loopTimer)
    if (this.ctx) {
      const now = this.ctx.currentTime
      for (const v of this.voices) {
        v.gain.gain.cancelScheduledValues(now)
        v.gain.gain.setValueAtTime(v.gain.gain.value, now)
        v.gain.gain.linearRampToValueAtTime(0, now + fade)
        try { v.src.stop(now + fade + 0.05) } catch { /* já parado */ }
      }
    }
    this.voices = []
    this.current = null
  }

  private schedule() {
    const ctx = this.ctx!, song = SONGS[this.current!]
    const dur = 60 / song.bpm / 2
    while (this.nextTime < ctx.currentTime + 0.12) {
      const i = this.step % song.lead.length
      if (song.lead[i]) this.tone(midi(song.lead[i]), this.nextTime, dur * 0.9, song.wave, 0.07, this.musicGain)
      if (song.bass[i]) this.tone(midi(song.bass[i]), this.nextTime, dur * 1.8, 'triangle', 0.16, this.musicGain)
      if (this.current === 'overworld' && i % 4 === 2) this.hit(this.nextTime, 0.03, 0.04, this.musicGain)
      this.nextTime += dur
      this.step++
    }
  }

  private tone(freq: number, at: number, dur: number, type: OscillatorType, vol: number, dest: AudioNode, slideTo?: number) {
    const ctx = this.ctx!
    const o = ctx.createOscillator(), g = ctx.createGain()
    o.type = type
    o.frequency.setValueAtTime(freq, at)
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, at + dur)
    g.gain.setValueAtTime(0, at)
    g.gain.linearRampToValueAtTime(vol, at + 0.008)
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    o.connect(g); g.connect(dest)
    o.start(at); o.stop(at + dur + 0.02)
  }

  private hit(at: number, dur: number, vol: number, dest: AudioNode) {
    const ctx = this.ctx!
    const s = ctx.createBufferSource(), g = ctx.createGain(), f = ctx.createBiquadFilter()
    s.buffer = this.noise; f.type = 'highpass'; f.frequency.value = 3000
    g.gain.setValueAtTime(vol, at); g.gain.exponentialRampToValueAtTime(0.0001, at + dur)
    s.connect(f); f.connect(g); g.connect(dest)
    s.start(at); s.stop(at + dur + 0.02)
  }

  sfx(name: Sfx) {
    const ctx = this.ctx
    if (!ctx || this.muted) return
    const buf = this.buffers.get(`sfx/${name}`)
    if (buf) {
      const src = ctx.createBufferSource(); src.buffer = buf; src.connect(this.sfxGain); src.start()
      return
    }
    const t = ctx.currentTime, d = this.sfxGain
    switch (name) {
      case 'bump': this.tone(140, t, 0.09, 'square', 0.12, d, 90); break
      case 'interact': this.tone(1046, t, 0.05, 'square', 0.08, d); this.tone(1568, t + 0.05, 0.07, 'square', 0.08, d); break
      case 'select': this.tone(1318, t, 0.06, 'square', 0.07, d); break
      case 'text': this.tone(1760, t, 0.018, 'square', 0.025, d); break
      case 'menu_open': this.tone(784, t, 0.05, 'square', 0.07, d); this.tone(1175, t + 0.05, 0.07, 'square', 0.07, d); break
      case 'menu_move': this.tone(1046, t, 0.03, 'square', 0.05, d); break
      case 'door': this.hit(t, 0.12, 0.12, d); this.tone(392, t, 0.18, 'triangle', 0.12, d, 196); break
      case 'exit': this.hit(t, 0.12, 0.12, d); this.tone(196, t, 0.18, 'triangle', 0.12, d, 392); break
      case 'travel': this.tone(392, t, 0.3, 'square', 0.06, d, 1568); break
      case 'achievement':
        [72, 76, 79, 84].forEach((n, i) => this.tone(midi(n + 12), t + i * 0.08, 0.12, 'square', 0.07, d))
        this.tone(midi(91), t + 0.32, 0.35, 'square', 0.07, d)
        break
      case 'secret':
        [79, 83, 86, 91].forEach((n, i) => this.tone(midi(n), t + i * 0.1, 0.2, 'triangle', 0.12, d))
        break
    }
  }
}

export const audio = new AudioManager()
