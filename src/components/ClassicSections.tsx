import { useMemo, useState } from 'react'
import type { Project, Service, SkillGroup } from '../content'
import { PixelIcon, type IconName } from './PixelIcon'
import { Tag } from './SectionContent'

/** Projetos no modo clássico: destaques grandes + lista compacta expansível, com filtro. */
export function ClassicProjects({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<string | null>(null)
  const [open, setOpen] = useState<number | null>(null)
  const top = useMemo(() => {
    const count = new Map<string, number>()
    projects.forEach((p) => p.stack.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)))
    return [...count.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t)
  }, [projects])
  const items = projects.map((p, i) => ({ p, i })).filter(({ p }) => !filter || p.stack.includes(filter))
  const featured = filter ? [] : items.slice(0, 3)
  const rest = filter ? items : items.slice(3)

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por tecnologia">
        <span className="gb-muted font-pixel text-base">Filtrar:</span>
        <button type="button" className="gb-tag" aria-pressed={!filter} onClick={() => setFilter(null)}>Todos ({projects.length})</button>
        {top.map((t) => <Tag key={t} name={t} active={filter === t} onClick={() => setFilter(filter === t ? null : t)} />)}
      </div>

      {featured.map(({ p, i }, k) => (
        <article key={i} className={`gb-panel grid gap-5 p-5 sm:p-7 ${k % 2 ? 'md:grid-cols-[minmax(0,1fr)_150px]' : 'md:grid-cols-[150px_minmax(0,1fr)]'}`}>
          <div className={`flex flex-col items-center justify-center rounded-xl border-4 border-[var(--gb-line)] py-4 ${['bg-[#FFD040]', 'bg-[#8DB4FF]', 'bg-[#A8F0A0]'][k]} ${k % 2 ? 'md:order-2' : ''}`}>
            <span className="font-pixel text-6xl leading-none text-[#283038]">{String(i + 1).padStart(2, '0')}</span>
            <span className="font-pixel text-base text-[#283038]">DESTAQUE</span>
          </div>
          <div className={k % 2 ? 'md:order-1' : ''}>
            <h3 className="font-pixel text-4xl leading-tight">{p.title}</h3>
            <p className="gb-muted mt-2 leading-relaxed">{p.summary}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="gb-card p-3"><p className="gb-blue font-pixel text-sm">PAPEL</p><p className="text-sm">{p.role}</p></div>
              <div className="gb-card p-3"><p className="gb-blue font-pixel text-sm">RESULTADO</p><p className="text-sm">{p.result}</p></div>
            </div>
            <ul className="mt-4 flex flex-wrap gap-2">{p.stack.map((s) => <li key={s}><Tag name={s} /></li>)}</ul>
            {p.links.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {p.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="gb-btn inline-flex items-center gap-2 text-lg">{l.label}<PixelIcon name="link" size={12} /></a>)}
              </div>
            )}
          </div>
        </article>
      ))}

      {rest.length > 0 && (
        <div>
          {!filter && <h3 className="gb-muted mb-3 font-pixel text-2xl">Mais projetos</h3>}
          <ul className="gb-card divide-y-2 divide-[var(--gb-line)]/15 overflow-hidden p-0">
            {rest.map(({ p, i }) => {
              const isOpen = open === i
              return (
                <li key={i}>
                  <button type="button" onClick={() => setOpen(isOpen ? null : i)} aria-expanded={isOpen}
                    className="flex w-full items-center gap-4 px-4 py-3 text-left hover:bg-[var(--gb-hover)]">
                    <span className="gb-muted w-8 font-pixel text-lg">{String(i + 1).padStart(2, '0')}</span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-pixel text-2xl leading-tight">{p.title}</span>
                      <span className="gb-muted block truncate text-sm">{p.summary}</span>
                    </span>
                    <PixelIcon name={isOpen ? 'up' : 'down'} size={12} />
                  </button>
                  {isOpen && (
                    <div className="space-y-3 px-4 pb-4 pl-16 text-sm motion-safe:animate-[rise_.25s_ease-out]">
                      <p className="gb-muted leading-relaxed">{p.summary}</p>
                      <p><span className="gb-blue font-pixel">PAPEL · </span>{p.role}</p>
                      <p><span className="gb-blue font-pixel">RESULTADO · </span>{p.result}</p>
                      <ul className="flex flex-wrap gap-2">{p.stack.map((s) => <li key={s}><Tag name={s} /></li>)}</ul>
                    </div>
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}

const GROUP_ICON: IconName[] = ['computer', 'gamepad', 'sparkle', 'gear', 'hammer', 'chat']

/** Habilidades como inventário de RPG: abas por área e itens em "espaços". */
export function ClassicSkills({ skills }: { skills: SkillGroup[] }) {
  const [tab, setTab] = useState(0)
  const g = skills[tab]
  return (
    <div className="gb-panel grid overflow-hidden md:grid-cols-[260px_1fr]">
      <div role="tablist" aria-label="Áreas" className="flex gap-1 overflow-x-auto border-b-4 border-[var(--gb-line)]/15 p-3 md:flex-col md:border-b-0 md:border-r-4">
        {skills.map((s, i) => (
          <button key={s.group} role="tab" aria-selected={tab === i} onClick={() => setTab(i)}
            className={`flex shrink-0 items-center gap-3 rounded-lg px-3 py-2 text-left font-pixel text-lg ${tab === i ? 'bg-[var(--gb-card)] shadow-[0_3px_0_var(--gb-line)] ring-2 ring-[var(--gb-line)]' : 'hover:bg-[var(--gb-hover)]'}`}>
            <PixelIcon name={tab === i ? 'cursor' : GROUP_ICON[i % GROUP_ICON.length]} size={18} />
            <span className="whitespace-nowrap">{s.group}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" className="p-5">
        <div className="mb-4 flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center rounded-lg border-3 border-[var(--gb-line)] bg-[#FFD040]"><PixelIcon name={GROUP_ICON[tab % GROUP_ICON.length]} size={26} /></span>
          <div>
            <p className="font-pixel text-3xl leading-none">{g.group}</p>
            <p className="gb-muted font-pixel text-base">{g.items.length} itens no inventário</p>
          </div>
        </div>
        <ul key={tab} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {g.items.map((it, i) => (
            <li key={it} className="gb-card flex min-h-16 items-center justify-center px-3 py-3 text-center font-pixel text-lg leading-tight motion-safe:animate-[rise_.3s_ease-out_both]"
              style={{ animationDelay: `${i * 30}ms` }}>
              {it}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}

const SERVICE_ICON: IconName[] = ['flask', 'sparkle', 'computer', 'hammer']

/** Serviços como faixa numerada. */
export function ClassicServices({ services }: { services: Service[] }) {
  return (
    <ol className="grid gap-4 md:grid-cols-4">
      {services.map((s, i) => (
        <li key={i} className="relative rounded-xl border-4 border-dashed border-[var(--gb-accent)] p-5">
          <span className="absolute -top-4 left-4 rounded-md border-3 border-[var(--gb-line)] bg-[var(--gb-red)] px-2 font-pixel text-lg text-white">{String(i + 1).padStart(2, '0')}</span>
          <PixelIcon name={SERVICE_ICON[i % SERVICE_ICON.length]} size={30} />
          <h3 className="mt-3 font-pixel text-2xl leading-tight">{s.title}</h3>
          <p className="gb-muted mt-2 text-sm leading-relaxed">{s.description}</p>
        </li>
      ))}
    </ol>
  )
}
