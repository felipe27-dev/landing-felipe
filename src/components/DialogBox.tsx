import { PixelIcon } from './PixelIcon'
import { useEffect, useRef, useState } from 'react'
import type { Dialog, DialogAction } from '../content'
import { audio } from '../game/audio'

/** Caixa de diálogo estilo RPG portátil: texto digitado, ▼ para avançar e menu de escolha com cursor. */
export function DialogBox({ dialog, reducedMotion, onAction, onClose, labels }: {
  dialog: Dialog; reducedMotion: boolean
  onAction: (a: DialogAction) => void; onClose: () => void
  labels: { next: string; close: string }
}) {
  const [line, setLine] = useState(0)
  const [chars, setChars] = useState(0)
  const [sel, setSel] = useState(0)
  const text = dialog.lines[line]
  const done = reducedMotion || chars >= text.length
  const last = line === dialog.lines.length - 1
  const choices: DialogAction[] = [...(dialog.actions ?? []), { label: labels.close }]
  const showChoices = last && done && (dialog.actions?.length ?? 0) > 0
  const choiceRefs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => { setLine(0); setChars(0); setSel(0) }, [dialog])
  useEffect(() => { setChars(0) }, [line])
  useEffect(() => {
    if (done) return
    const id = setTimeout(() => { setChars((c) => c + 2); if (chars % 6 === 0) audio.sfx('text') }, 14)
    return () => clearTimeout(id)
  }, [chars, done])
  useEffect(() => { if (showChoices) choiceRefs.current[sel]?.focus() }, [showChoices, sel])

  const choose = (a: DialogAction) => {
    audio.sfx('select')
    if (a.section) onAction(a)
    else onClose()
  }

  const advance = () => {
    if (!done) return setChars(text.length)
    if (!last) { audio.sfx('menu_move'); setLine((l) => l + 1) }
    else if (!showChoices) onClose()
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.repeat) return
      if (e.key === 'Escape' || e.code === 'KeyX') { e.preventDefault(); onClose(); return }
      if (showChoices) {
        if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); audio.sfx('menu_move'); setSel((s) => (s + choices.length - 1) % choices.length) }
        if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); audio.sfx('menu_move'); setSel((s) => (s + 1) % choices.length) }
        if (['KeyE', 'Space', 'Enter', 'KeyZ'].includes(e.code)) { e.preventDefault(); choose(choices[sel]) }
        return
      }
      if (['KeyE', 'Space', 'Enter', 'KeyZ'].includes(e.code)) { e.preventDefault(); advance() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  })

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 flex flex-col items-center p-2 pb-[max(.5rem,env(safe-area-inset-bottom))] sm:p-5">
      <div className="relative w-full max-w-3xl">
        {showChoices && (
          <ul role="menu" className="gb-box absolute bottom-full right-0 mb-2 min-w-56 py-2">
            {choices.map((c, i) => (
              <li key={c.label} role="none">
                <button
                  role="menuitem"
                  ref={(el) => { choiceRefs.current[i] = el }}
                  onMouseEnter={() => setSel(i)}
                  onClick={() => choose(c)}
                  className="flex w-full items-center gap-2 px-4 py-1.5 text-left font-pixel text-lg text-[#283038] outline-none sm:text-xl"
                >
                  <span className={`w-5 ${sel === i ? 'opacity-100' : 'opacity-0'}`}><PixelIcon name="cursor" size={14} /></span>{c.label}
                </button>
              </li>
            ))}
          </ul>
        )}
        {dialog.portrait && (
          <img src={dialog.portrait} alt="" aria-hidden
            className="gb-box absolute bottom-full left-0 mb-2 h-24 w-24 p-1 [image-rendering:pixelated] sm:h-28 sm:w-28" />
        )}
        <div className="gb-box w-full cursor-pointer px-5 py-4 sm:px-7 sm:py-5" role="dialog" aria-label={dialog.speaker ?? 'Mensagem'} onClick={advance}>
          {dialog.speaker && <p className="mb-1 font-pixel text-base text-[#3870D0] sm:text-lg">{dialog.speaker}</p>}
          <p aria-live="polite" className="sr-only">{text}</p>
          <p aria-hidden className="min-h-[3.6rem] font-pixel text-xl leading-snug text-[#283038] sm:min-h-[4.2rem] sm:text-2xl">
            {done ? text : text.slice(0, chars)}
          </p>
          {done && !showChoices && (
            <span aria-hidden className="absolute bottom-3 right-5 motion-safe:animate-bounce"><PixelIcon name="more" size={12} /></span>
          )}
          <button className="sr-only" onClick={(e) => { e.stopPropagation(); advance() }}>{labels.next}</button>
        </div>
      </div>
    </div>
  )
}
