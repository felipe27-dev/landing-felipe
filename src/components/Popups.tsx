import { PixelIcon } from './PixelIcon'
import type { Achievement } from '../game/achievements'

/** Placa de localização que desce ao entrar numa região. */
export function LocationSign({ name }: { name: string }) {
  return (
    <div key={name} aria-hidden className="pointer-events-none fixed left-3 top-16 z-20 motion-safe:animate-[slide-sign_2.6s_ease-in-out_forwards] motion-reduce:hidden sm:left-5">
      <div className="rounded-md border-4 border-[#583818] bg-[#E8C890] px-5 py-2 shadow-[inset_0_0_0_3px_#C89858,0_4px_0_rgb(0_0_0/.3)]">
        <p className="font-pixel text-xl text-[#382008] sm:text-2xl">{name}</p>
      </div>
    </div>
  )
}

/** Aviso de conquista desbloqueada. */
export function AchievementToast({ a, label }: { a: Achievement; label: string }) {
  return (
    <div role="status" className="pointer-events-none fixed inset-x-0 top-2 z-[60] flex justify-center px-3 motion-safe:animate-[toast_3.5s_ease-in-out_forwards]">
      <div className="gb-box flex items-center gap-3 px-4 py-2">
        <span className="grid h-11 w-11 place-items-center rounded-lg border-2 border-[#283038] bg-[#FFD040]" aria-hidden><PixelIcon name={a.icon} size={24} /></span>
        <div>
          <p className="font-pixel text-sm text-[#3870D0]">{label}</p>
          <p className="font-pixel text-lg leading-tight">{a.title}</p>
        </div>
      </div>
    </div>
  )
}
