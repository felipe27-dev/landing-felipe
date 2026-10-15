import { PixelIcon } from './PixelIcon'
import { useEffect } from 'react'
import type { Content } from '../content'
import { audio } from '../game/audio'

/** Tela de título: "pressione Enter" para jogar, ou atalho para o portfólio clássico. */
export function Intro({ content, ready, onPlay, onClassic }: { content: Content; ready: boolean; onPlay: () => void; onClassic: () => void }) {
  // Navegadores só liberam áudio após um gesto: o primeiro toque/tecla inicia a música de título.
  useEffect(() => {
    const first = () => { audio.unlock().then(() => { if (!audio.music) audio.playMusic('title') }) }
    window.addEventListener('pointerdown', first, { once: true })
    window.addEventListener('keydown', first, { once: true })
    return () => { window.removeEventListener('pointerdown', first); window.removeEventListener('keydown', first) }
  }, [])

  useEffect(() => {
    if (!ready) return
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLButtonElement) return
      if (['Enter', 'Space', 'KeyE', 'KeyZ'].includes(e.code)) { e.preventDefault(); onPlay() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [ready, onPlay])

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-gradient-to-b from-[#3870D0]/85 via-[#58A8F0]/70 to-[#F8E8B0]/80 p-4">
      <div className="w-full max-w-xl text-center">
        <p className="font-pixel text-base tracking-[0.3em] text-white drop-shadow-[2px_2px_0_#283038]">PORTFÓLIO · EDIÇÃO ILHA</p>
        <h1 className="mt-2 font-pixel text-6xl leading-none text-[#FFD040] [-webkit-text-stroke:3px_#283038] [paint-order:stroke_fill] drop-shadow-[4px_4px_0_#283038] sm:text-8xl">
          {content.profile.name}
        </h1>
        <p className="mt-3 font-pixel text-lg text-white drop-shadow-[2px_2px_0_#283038]">{content.profile.role}</p>

        <div className="gb-box mx-auto mt-8 max-w-md px-5 py-4 text-left">
          <p className="font-pixel text-lg leading-snug">{content.ui.introText}</p>
        </div>

        <div className="mt-6 flex flex-col items-center gap-3">
          <button
            autoFocus
            disabled={!ready}
            onClick={onPlay}
            className="gb-box px-8 py-3 font-pixel text-2xl disabled:opacity-60"
          >
            {ready ? <span className="inline-flex items-center gap-3"><PixelIcon name="cursor" size={18} />{content.ui.explore}</span> : content.ui.loading}
          </button>
          <button onClick={onClassic} className="font-pixel text-lg text-white underline decoration-2 underline-offset-4 drop-shadow-[2px_2px_0_#283038]">
            {content.ui.skipToContent}
          </button>
          {ready && <p className="font-pixel text-white/90 motion-safe:animate-pulse drop-shadow-[2px_2px_0_#283038] max-sm:hidden">— PRESSIONE ENTER —</p>}
        </div>
      </div>
    </div>
  )
}
