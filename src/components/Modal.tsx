import { useEffect, useRef } from 'react'
import { audio } from '../game/audio'
import { PixelIcon, type IconName } from './PixelIcon'

/** Painel no estilo das caixas do jogo: foco preso, Esc fecha, foco restaurado ao fechar. */
export function Modal({ title, kicker, icon, onClose, children, closeLabel, wide }: {
  title: string; kicker?: string; icon?: IconName; onClose: () => void; children: React.ReactNode; closeLabel: string; wide?: boolean
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null
    ref.current?.querySelector<HTMLElement>('[data-autofocus]')?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'KeyX') { e.stopPropagation(); audio.sfx('menu_move'); onClose() }
      if (e.key !== 'Tab' || !ref.current) return
      const f = ref.current.querySelectorAll<HTMLElement>('a[href],button,input,[tabindex]:not([tabindex="-1"])')
      const first = f[0], last = f[f.length - 1]
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus() }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => { window.removeEventListener('keydown', onKey, true); prev?.focus() }
  }, [onClose])

  return (
    <div className="fixed inset-0 z-40 flex items-end justify-center bg-[#101828]/55 p-0 sm:items-center sm:p-6" onClick={onClose}>
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        onClick={(e) => e.stopPropagation()}
        className={`gb-panel flex max-h-[90dvh] w-full flex-col ${wide ? 'max-w-4xl' : 'max-w-3xl'} motion-safe:animate-[pop_.16s_ease-out]`}
      >
        <header className="flex items-center gap-3 border-b-4 border-[#283038]/10 px-5 pb-3 pt-5 sm:px-7">
          {icon && <span className="grid h-12 w-12 place-items-center rounded-lg border-3 border-[var(--gb-line)] bg-[#FFD040] shadow-[0_3px_0_var(--gb-line)]" aria-hidden><PixelIcon name={icon} size={26} /></span>}
          <div className="min-w-0 flex-1">
            {kicker && <p className="font-pixel text-base leading-none text-[#3870D0]">{kicker}</p>}
            <h2 id="modal-title" className="truncate font-pixel text-3xl leading-tight sm:text-4xl">{title}</h2>
          </div>
          <button data-autofocus onClick={onClose} className="gb-btn inline-flex items-center gap-2 text-lg" aria-label={closeLabel}><PixelIcon name="close" size={14} /><span className="max-sm:hidden">{closeLabel}</span></button>
        </header>
        <div className="gb-scroll overflow-y-auto px-5 py-5 sm:px-7">{children}</div>
      </div>
    </div>
  )
}
