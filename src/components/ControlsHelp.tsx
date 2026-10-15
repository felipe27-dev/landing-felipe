import { PixelIcon } from './PixelIcon'
/** Ajuda de controles com teclas desenhadas no estilo do jogo. */
const ROWS: { keys: (string | string[])[]; label: string }[] = [
  { keys: [['W', 'A', 'S', 'D'], ['↑', '←', '↓', '→']], label: 'Andar' },
  { keys: ['Shift'], label: 'Correr' },
  { keys: ['E', 'Espaço', 'Enter'], label: 'Interagir / avançar' },
  { keys: ['M'], label: 'Mapa' },
  { keys: ['Esc'], label: 'Menu' },
  { keys: ['1–6'], label: 'Viagem rápida' },
]

export function ControlsHelp({ compact = false }: { compact?: boolean }) {
  return (
    <div className="space-y-3">
      <ul className={`grid gap-x-6 gap-y-3 ${compact ? '' : 'sm:grid-cols-2'}`}>
        {ROWS.map((r) => (
          <li key={r.label} className="flex flex-wrap items-center gap-2">
            <span className="flex flex-wrap items-center gap-1.5">
              {r.keys.map((k, i) => (
                <span key={i} className="flex items-center gap-1.5">
                  {i > 0 && <span className="gb-muted font-pixel text-sm">ou</span>}
                  {(Array.isArray(k) ? k : [k]).map((kk) => <kbd key={kk} className="gb-key">{kk}</kbd>)}
                </span>
              ))}
            </span>
            <span className="font-pixel text-lg">{r.label}</span>
          </li>
        ))}
      </ul>
      <div className="flex items-start gap-3 rounded-lg border-2 border-dashed border-[var(--gb-accent)] p-3">
        <span className="gb-key" aria-hidden><PixelIcon name="mouse" size={18} /></span>
        <p className="font-pixel text-lg leading-snug">
          Clique ou toque no destino: o personagem caminha até lá e interage sozinho.
          <span className="gb-muted block text-base">No celular também há direcional e botão A.</span>
        </p>
      </div>
    </div>
  )
}
