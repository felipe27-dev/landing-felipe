import type { Content, RegionId } from '../content'
import { Minimap } from './Minimap'
import { PixelIcon } from './PixelIcon'

export function Hud({ content, region, player, onMap, onMenu, onClassic, onContact }: {
  content: Content; region: RegionId; player: { x: number; y: number }
  onMap: () => void; onMenu: () => void; onClassic: () => void; onContact: () => void
}) {
  const ghost = 'gb-btn text-lg leading-none py-1.5'
  return (
    <>
      <header className="pointer-events-none fixed inset-x-0 top-0 z-20 flex items-start justify-between gap-2 p-3 pt-[max(.75rem,env(safe-area-inset-top))]">
        <div className="gb-box pointer-events-auto px-4 py-1.5">
          <p className="font-pixel text-xl leading-tight">{content.profile.name}</p>
          <p className="flex items-center gap-1.5 font-pixel text-base leading-tight text-[#3870D0]" aria-live="polite"><PixelIcon name="pin" size={14} />{content.regions[region]}</p>
        </div>
        <nav className="pointer-events-auto flex flex-wrap justify-end gap-2" aria-label="Navegação">
          <button onClick={onClassic} className={`${ghost} max-sm:hidden`}>{content.ui.classic}</button>
          <button onClick={onMenu} className={ghost} aria-keyshortcuts="Escape">{content.ui.menu}</button>
          <button onClick={onContact} className="gb-btn gb-btn-primary inline-flex items-center gap-2 text-lg leading-none py-1.5"><PixelIcon name="mail" size={14} />{content.ui.contactCta}</button>
        </nav>
      </header>
      <button
        onClick={onMap}
        aria-label={`${content.ui.map} (M)`}
        aria-keyshortcuts="M"
        className="gb-box fixed right-3 top-[5rem] z-20 p-1.5 max-sm:top-auto max-sm:bottom-48"
      >
        <Minimap player={player} cell={3} className="block w-24 sm:w-[120px]" />
      </button>
    </>
  )
}
