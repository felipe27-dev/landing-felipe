import { PixelIcon } from './PixelIcon'
import { useEffect, useRef, useState } from 'react'
import { audio } from '../game/audio'

export interface MenuItem { id: string; label: string; onSelect: () => void }

/** Menu de pausa no estilo clássico: lista à direita com cursor ▶. */
export function StartMenu({ items, onClose }: { items: MenuItem[]; onClose: () => void }) {
  const [sel, setSel] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])

  useEffect(() => { refs.current[sel]?.focus() }, [sel])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.code === 'KeyX') { e.preventDefault(); e.stopPropagation(); audio.sfx('menu_move'); onClose() }
      else if (e.code === 'ArrowDown' || e.code === 'KeyS') { e.preventDefault(); audio.sfx('menu_move'); setSel((s) => (s + 1) % items.length) }
      else if (e.code === 'ArrowUp' || e.code === 'KeyW') { e.preventDefault(); audio.sfx('menu_move'); setSel((s) => (s + items.length - 1) % items.length) }
      else if (e.code === 'KeyE' || e.code === 'KeyZ') { e.preventDefault(); audio.sfx('select'); items[sel].onSelect() }
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [items, sel, onClose])

  return (
    <div className="fixed inset-0 z-40" onClick={onClose}>
      <nav
        aria-label="Menu"
        onClick={(e) => e.stopPropagation()}
        className="gb-box absolute right-2 top-20 w-[min(22rem,calc(100vw-1rem))] py-4 sm:right-5 sm:top-20 motion-safe:animate-[pop_.12s_ease-out]"
      >
        <ul role="menu">
          {items.map((it, i) => (
            <li key={it.id} role="none">
              <button
                role="menuitem"
                ref={(el) => { refs.current[i] = el }}
                onMouseEnter={() => setSel(i)}
                onClick={() => { audio.sfx('select'); it.onSelect() }}
                className="flex w-full items-center gap-3 px-6 py-2.5 text-left font-pixel text-3xl uppercase tracking-wide text-[#283038] outline-none hover:bg-[#EEF3FA]"
              >
                <span className={`w-6 ${sel === i ? 'opacity-100' : 'opacity-0'}`}><PixelIcon name="cursor" size={18} /></span>{it.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  )
}
