import type { Content, RegionId } from '../content'
import { overworld, regions, SHORTCUT_ORDER } from '../game/world'

const { w: W, h: H } = overworld
import { Minimap } from './Minimap'
import { Modal } from './Modal'

/** Mapa ampliado com viagem rápida para cada região. */
export function MapOverlay({ content, player, onTravel, onClose }: {
  content: Content; player: { x: number; y: number }; onTravel: (id: RegionId) => void; onClose: () => void
}) {
  return (
    <Modal title={content.ui.map} kicker={content.ui.travel} icon="map" onClose={onClose} closeLabel={content.ui.close}>
      <div className="relative mx-auto w-full max-w-xl">
        <Minimap player={player} cell={8} className="h-auto w-full rounded-lg border-4 border-[#283038]" />
        {regions.map((r) => (
          <button
            key={r.id}
            onClick={() => onTravel(r.id)}
            style={{ left: `${(((r.x0 + r.x1 + 1) / 2) / W) * 100}%`, top: `${(((r.y0 + r.y1 + 1) / 2) / H) * 100}%` }}
            className="gb-btn absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap px-2 py-0.5 text-sm hover:bg-[#FFD040] sm:text-lg"
          >
            {SHORTCUT_ORDER.includes(r.id) ? `${SHORTCUT_ORDER.indexOf(r.id) + 1} · ` : ''}{content.regions[r.id]}
          </button>
        ))}
      </div>
    </Modal>
  )
}
