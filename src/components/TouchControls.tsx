import { PixelIcon } from './PixelIcon'
import type { Dir } from '../game/types'

/** Direcional virtual + botão de ação para telas de toque. */
export function TouchControls({ onDir, onAction, actionLabel }: { onDir: (d: Dir | null) => void; onAction: () => void; actionLabel: string }) {
  const btn = (d: Dir, cls: string, label: string, glyph: React.ReactNode) => (
    <button
      aria-label={label}
      className={`absolute grid h-12 w-12 place-items-center rounded-md bg-ink/75 text-xl text-paper ring-2 ring-paper/30 active:bg-amber active:text-ink ${cls}`}
      onPointerDown={(e) => { e.preventDefault(); (e.target as HTMLElement).setPointerCapture(e.pointerId); onDir(d) }}
      onPointerUp={() => onDir(null)}
      onPointerCancel={() => onDir(null)}
      onContextMenu={(e) => e.preventDefault()}
    >{glyph}</button>
  )
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between p-4 pb-[max(1rem,env(safe-area-inset-bottom))] select-none touch-none">
      <div className="pointer-events-auto relative h-36 w-36">
        {btn('up', 'left-12 top-0', 'Cima', <PixelIcon name="up" size={18} />)}
        {btn('left', 'left-0 top-12', 'Esquerda', <PixelIcon name="left" size={14} />)}
        {btn('right', 'right-0 top-12', 'Direita', <PixelIcon name="right" size={14} />)}
        {btn('down', 'left-12 bottom-0', 'Baixo', <PixelIcon name="down" size={18} />)}
      </div>
      <button
        aria-label={actionLabel}
        onPointerDown={(e) => { e.preventDefault(); onAction() }}
        className="pointer-events-auto mb-6 grid h-16 w-16 place-items-center rounded-full bg-amber font-pixel text-2xl text-ink ring-4 ring-ink/60 active:brightness-90"
      >A</button>
    </div>
  )
}
