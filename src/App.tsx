import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getContent, type Content, type Dialog, type DialogAction, type Locale, type RegionId, type SectionId } from './content'
import { achievements, ACHIEVEMENTS, type Achievement } from './game/achievements'
import { assetUrl, loadAssets } from './game/assets'
import { audio } from './game/audio'
import { Game } from './game/engine'
import { OUTDOOR_REGIONS, SHORTCUT_ORDER, T, type Interactable } from './game/world'
import { ClassicView } from './components/ClassicView'
import { DialogBox } from './components/DialogBox'
import { Hud } from './components/Hud'
import { Intro } from './components/Intro'
import { MapOverlay } from './components/MapOverlay'
import { Modal } from './components/Modal'
import { AchievementToast, LocationSign } from './components/Popups'
import { SectionContent } from './components/SectionContent'
import { StartMenu, type MenuItem } from './components/StartMenu'
import { TouchControls } from './components/TouchControls'
import { ControlsHelp } from './components/ControlsHelp'
import { applyFont, FONTS, savedFont, type FontOption } from './fonts'
import { PixelIcon, type IconName } from './components/PixelIcon'

const SECTION_ICON: Record<SectionId, IconName> = { about: 'user', projects: 'flask', skills: 'book', experience: 'tower', services: 'hammer', contact: 'mail' }

const media = (q: string) => typeof window !== 'undefined' && window.matchMedia(q).matches
type ListKey = 'projects' | 'skills' | 'experience' | 'services'
const LIST_OF: Partial<Record<SectionId, ListKey>> = { projects: 'projects', skills: 'skills', experience: 'experience', services: 'services' }

/** Monta o diálogo de um objeto ligado a um item do conteúdo (terminal, estante…). */
function refDialog(content: Content, section: SectionId, index: number): Dialog {
  const key = LIST_OF[section]!
  const item = content[key][index] as unknown as Record<string, string>
  const title = item.title ?? item.group ?? item.role
  const detail = item.summary ?? item.description ?? (Array.isArray(item.items) ? (item.items as unknown as string[]).join(', ') : '')
  return { speaker: content.sections[section].kicker, lines: [title, detail].filter(Boolean), actions: [{ label: content.ui.seeDetails, section, index }] }
}

export default function App() {
  const [locale] = useState<Locale>('pt')
  const content = getContent(locale)
  const counts = useMemo(() => ({
    projects: content.projects.length, skills: content.skills.length,
    services: content.services.length, experience: content.experience.length,
  }), [content])

  const canvasRef = useRef<HTMLCanvasElement>(null)
  const gameRef = useRef<Game | null>(null)

  const [ready, setReady] = useState(false)
  const [intro, setIntro] = useState(true)
  const [classic, setClassic] = useState(false)
  const [dialog, setDialog] = useState<Dialog | null>(null)
  const [panel, setPanel] = useState<{ section: SectionId; index?: number } | null>(null)
  const [overlay, setOverlay] = useState<'menu' | 'map' | 'achievements' | 'options' | null>(null)
  const [region, setRegion] = useState<RegionId>('praca')
  const [sign, setSign] = useState<{ name: string; n: number } | null>(null)
  const [player, setPlayer] = useState({ x: 16, y: 14 })
  const [nearby, setNearby] = useState<Interactable | null>(null)
  const [toasts, setToasts] = useState<Achievement[]>([])
  const [unlockedCount, setUnlockedCount] = useState(achievements.unlocked.size)
  const [muted, setMuted] = useState(audio.muted)
  const [volume, setVolume] = useState(audio.volume)
  const [reducedMotion, setReducedMotion] = useState(() => media('(prefers-reduced-motion: reduce)'))
  const [touch] = useState(() => media('(pointer: coarse)'))
  const [font, setFont] = useState<FontOption>(() => savedFont())
  useEffect(() => { applyFont(font); if (gameRef.current) gameRef.current.fontFamily = font.family }, [font])
  const chooseFont = (f: FontOption) => { audio.sfx('select'); setFont(f) }

  const paused = intro || classic || !!dialog || !!panel || !!overlay

  useEffect(() => { loadAssets().then(() => setReady(true)) }, [])
  useEffect(() => audio.subscribe(() => { setMuted(audio.muted); setVolume(audio.volume) }), [])
  useEffect(() => achievements.onUnlock((a) => {
    audio.sfx('achievement')
    setUnlockedCount(achievements.unlocked.size)
    setToasts((t) => [...t, a])
  }), [])
  useEffect(() => {
    if (!toasts.length) return
    const id = setTimeout(() => setToasts((t) => t.slice(1)), 3600)
    return () => clearTimeout(id)
  }, [toasts])

  // Cria o jogo depois que os sprites opcionais foram carregados.
  useEffect(() => {
    if (!ready) return
    const game = new Game(canvasRef.current!, {
      onInteract: (it) => {
        if (it.ref) {
          setDialog(refDialog(content, it.ref.section, it.ref.index))
          if (it.ref.section === 'projects') achievements.collect('projects', it.id, Math.min(3, counts.projects))
          return
        }
        const d = content.dialogs[it.dialog]
        const look = it.kind === 'npc' ? it.look : it.id === 'counter' ? 'clerk' : undefined
        setDialog(d ? { ...d, portrait: look && assetUrl(`sprites/portraits/${look}.png`) } : null)
        if (it.id === 'guide') achievements.unlock('guide')
        if (it.id.startsWith('post')) achievements.collect('milestones', it.id, 4)
        if (it.id === 'bottle') { audio.sfx('secret'); achievements.unlock('bottle') }
      },
      onRegion: (id) => {
        setRegion(id)
        setSign((s) => ({ name: content.regions[id], n: (s?.n ?? 0) + 1 }))
        if (OUTDOOR_REGIONS.includes(id)) achievements.collect('explorer', id, OUTDOOR_REGIONS.length)
      },
      onNearby: setNearby,
      onMove: (x, y, scene) => { if (scene === 'overworld') setPlayer({ x, y }) },
      onScene: (id) => { if (id !== 'overworld') achievements.unlock(`enter-${id}`) },
      onStep: (tile) => { if (tile === T.TallGrass) achievements.count('grass', 20) },
    }, counts)
    gameRef.current = game
    game.fontFamily = savedFont().family
    const onResize = () => game.resize()
    window.addEventListener('resize', onResize)
    return () => { window.removeEventListener('resize', onResize); game.destroy() }
  }, [ready, content, counts])

  useEffect(() => { gameRef.current?.setPaused(paused) }, [paused])
  useEffect(() => { if (gameRef.current) gameRef.current.reducedMotion = reducedMotion }, [reducedMotion])
  useEffect(() => { if (panel?.section === 'contact') achievements.unlock('contact') }, [panel])
  useEffect(() => { if (!sign) return; const id = setTimeout(() => setSign(null), 2700); return () => clearTimeout(id) }, [sign])

  const travel = useCallback((id: RegionId) => {
    gameRef.current?.travelTo(id)
    achievements.unlock('travel')
    setOverlay(null)
  }, [])

  const start = () => {
    audio.unlock().then(() => audio.playMusic('overworld'))
    audio.sfx('select')
    achievements.unlock('start')
    setIntro(false)
  }
  const openClassic = () => { audio.unlock(); audio.stopMusic(); setIntro(false); setOverlay(null); setClassic(true) }
  const leaveClassic = () => {
    setClassic(false)
    audio.playMusic(gameRef.current?.sceneId === 'overworld' ? (region === 'praia' ? 'beach' : 'overworld') : 'interior')
  }
  const openMenu = () => { audio.sfx('menu_open'); setOverlay('menu') }

  // Atalhos globais quando o jogo está ativo.
  useEffect(() => {
    if (paused) return
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.code === 'KeyM') { audio.sfx('menu_open'); setOverlay('map') }
      else if (e.key === 'Escape') openMenu()
      else if (/^Digit[1-6]$/.test(e.code)) travel(SHORTCUT_ORDER[Number(e.code.slice(5)) - 1])
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [paused, travel])

  const onAction = (a: DialogAction) => { setDialog(null); if (a.section) setPanel({ section: a.section, index: a.index }) }
  const closeDialog = useCallback(() => setDialog(null), [])
  const closePanel = useCallback(() => setPanel(null), [])
  const closeOverlay = useCallback(() => setOverlay(null), [])

  const menuItems: MenuItem[] = useMemo(() => [
    { id: 'map', label: content.ui.map, onSelect: () => setOverlay('map') },
    { id: 'ach', label: content.ui.achievements, onSelect: () => setOverlay('achievements') },
    { id: 'port', label: content.ui.portfolio, onSelect: openClassic },
    { id: 'contact', label: content.ui.contactCta, onSelect: () => { setOverlay(null); setPanel({ section: 'contact' }) } },
    { id: 'opt', label: content.ui.options, onSelect: () => setOverlay('options') },
    { id: 'close', label: content.ui.close, onSelect: () => setOverlay(null) },
  ], [content])

  // Painel focado num item (ex.: um projeto) mostra só ele.
  const panelContent = useMemo(() => {
    if (!panel || panel.index == null) return content
    const key = LIST_OF[panel.section]
    return key ? { ...content, [key]: [content[key][panel.index]] } : content
  }, [panel, content])

  return (
    <div className="fixed inset-0 overflow-hidden bg-black">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 h-full w-full cursor-pointer touch-none"
        role="img"
        aria-label={`Mapa da ilha. Você está em ${content.regions[region]}. Use o modo clássico para navegar por lista.`}
      />

      {!intro && !classic && (
        <Hud
          content={content} region={region} player={player}
          onMap={() => setOverlay('map')} onMenu={openMenu}
          onClassic={openClassic} onContact={() => setPanel({ section: 'contact' })}
        />
      )}

      {!paused && sign && <LocationSign key={sign.n} name={sign.name} />}

      {!paused && nearby && !touch && (
        <div className="pointer-events-none fixed inset-x-0 bottom-5 z-10 flex justify-center" aria-live="polite">
          <p className="gb-box px-4 py-1.5 font-pixel text-lg">
            <kbd className="mr-2 rounded bg-[#E04040] px-1.5 text-white">E</kbd>{nearby.label}
          </p>
        </div>
      )}

      {touch && !paused && (
        <TouchControls onDir={(d) => gameRef.current?.setTouchDir(d)} onAction={() => gameRef.current?.interact()} actionLabel={content.ui.interact} />
      )}

      {dialog && (
        <DialogBox dialog={dialog} reducedMotion={reducedMotion} onAction={onAction} onClose={closeDialog}
          labels={{ next: content.ui.next, close: content.ui.close }} />
      )}

      {panel && (
        <Modal title={content.sections[panel.section].title} kicker={content.sections[panel.section].kicker} icon={SECTION_ICON[panel.section]}
          onClose={closePanel} closeLabel={content.ui.close} wide={panel.section === 'projects' && panel.index == null}>
          <SectionContent id={panel.section} content={panelContent} />
          <div className="mt-6 flex flex-wrap justify-end gap-3">
            {panel.index != null && (
              <button onClick={() => setPanel({ section: panel.section })} className="gb-btn text-lg">Ver todos</button>
            )}
            {panel.section !== 'contact' && (
              <button onClick={() => setPanel({ section: 'contact' })} className="gb-btn gb-btn-primary inline-flex items-center gap-2 text-lg"><PixelIcon name="mail" size={14} />{content.ui.contactCta}</button>
            )}
          </div>
        </Modal>
      )}

      {overlay === 'menu' && <StartMenu items={menuItems} onClose={closeOverlay} />}
      {overlay === 'map' && <MapOverlay content={content} player={player} onTravel={travel} onClose={closeOverlay} />}

      {overlay === 'achievements' && (
        <Modal title={content.ui.achievements} kicker={`${unlockedCount} / ${ACHIEVEMENTS.length} desbloqueadas`} icon="trophy" onClose={closeOverlay} closeLabel={content.ui.close}>
          <div className="mb-4 h-4 overflow-hidden rounded-full border-3 border-[#283038] bg-white">
            <div className="h-full bg-[#58C060]" style={{ width: `${(unlockedCount / ACHIEVEMENTS.length) * 100}%` }} />
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {ACHIEVEMENTS.map((a) => {
              const on = achievements.unlocked.has(a.id)
              const shown = on || !a.secret
              return (
                <li key={a.id} className={`gb-card flex items-center gap-3 p-3 ${on ? '' : 'opacity-60'}`} data-pending={on ? undefined : true}>
                  <span className={`grid h-12 w-12 shrink-0 place-items-center rounded-lg border-2 border-[#283038] ${on ? 'bg-[#FFD040]' : 'bg-[#E8EEF7] grayscale'}`} aria-hidden><PixelIcon name={shown ? a.icon : 'question'} size={26} /></span>
                  <div className="min-w-0">
                    <p className="font-pixel text-xl leading-tight">{shown ? a.title : content.ui.locked}</p>
                    <p className="text-sm text-[#5A6676]">{shown ? a.description : 'Conquista secreta'}</p>
                  </div>
                  {on && <span className="ml-auto" aria-label="desbloqueada"><PixelIcon name="check" size={20} /></span>}
                </li>
              )
            })}
          </ul>
        </Modal>
      )}

      {overlay === 'options' && (
        <Modal title={content.ui.options} icon="gear" onClose={closeOverlay} closeLabel={content.ui.close}>
          <div className="space-y-4">
            <div className="gb-card space-y-4 p-4 font-pixel text-xl">
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={!muted} onChange={(e) => { audio.unlock(); audio.setMuted(!e.target.checked) }} className="h-5 w-5 accent-[#E04040]" />
                {content.ui.sound}
              </label>
              <label className="flex flex-wrap items-center gap-3">
                {content.ui.volume}
                <input type="range" min={0.05} max={1} step={0.05} value={volume} onChange={(e) => audio.setVolume(Number(e.target.value))} className="w-56 accent-[#E04040]" />
              </label>
              <label className="flex items-center gap-3">
                <input type="checkbox" checked={reducedMotion} onChange={(e) => setReducedMotion(e.target.checked)} className="h-5 w-5 accent-[#E04040]" />
                {content.ui.reducedMotion}
              </label>
            </div>
            <fieldset className="gb-card p-4">
              <legend className="px-2 font-pixel text-xl">Fonte do jogo</legend>
              <div className="grid gap-2 sm:grid-cols-2">
                {FONTS.map((f) => (
                  <label key={f.id} className={`flex cursor-pointer items-start gap-3 rounded-lg border-2 p-3 ${font.id === f.id ? 'border-[#E04040] bg-[#FFF4F2]' : 'border-[#B8C6DA] hover:bg-[#EEF3FA]'}`}>
                    <input type="radio" name="font" checked={font.id === f.id} onChange={() => chooseFont(f)} className="mt-2 accent-[#E04040]" />
                    <span>
                      <span className="block text-2xl leading-tight" style={{ fontFamily: f.family, fontSizeAdjust: 0.56 }}>{f.label} — Olá, ilha!</span>
                      <span className="block text-xs text-[#5A6676]">{f.note}</span>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            <fieldset className="gb-card p-4">
              <legend className="px-2 font-pixel text-xl">{content.ui.controls}</legend>
              <ControlsHelp />
            </fieldset>
            <button onClick={() => { achievements.reset(); setUnlockedCount(0) }} className="gb-btn text-lg text-[#C03030]">
              {content.ui.resetProgress}
            </button>
          </div>
        </Modal>
      )}

      {toasts[0] && <AchievementToast key={toasts[0].id} a={toasts[0]} label={content.ui.unlocked} />}

      {classic && (
        <ClassicView content={content} onPlay={leaveClassic} />
      )}

      {intro && !classic && <Intro content={content} ready={ready} onPlay={start} onClassic={openClassic} />}
    </div>
  )
}
