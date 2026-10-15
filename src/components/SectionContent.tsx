import { useMemo, useState } from 'react'
import type { Content, Project, SectionId } from '../content'
import { techCat } from '../content/tech'
import { PixelIcon } from './PixelIcon'

function Card({ placeholder, children, className = '' }: { placeholder?: boolean; children: React.ReactNode; className?: string }) {
  return <div className={`gb-card p-4 ${className}`} data-pending={placeholder || undefined}>{children}</div>
}

export const Tag = ({ name, onClick, active }: { name: string; onClick?: () => void; active?: boolean }) =>
  onClick
    ? <button type="button" className="gb-tag" data-cat={techCat(name)} aria-pressed={active} onClick={onClick}>{name}</button>
    : <span className="gb-tag" data-cat={techCat(name)}>{name}</span>

const Tags = ({ items }: { items: string[] }) => (
  <ul className="flex flex-wrap gap-2">{items.map((s) => <li key={s}><Tag name={s} /></li>)}</ul>
)

const Label = ({ children }: { children: React.ReactNode }) => (
  <span className="gb-blue font-pixel text-sm uppercase tracking-wide">{children}</span>
)

function ProjectCard({ p, i, open, onToggle }: { p: Project; i: number; open: boolean; onToggle: () => void }) {
  return (
    <Card placeholder={p.placeholder} className="flex flex-col">
      {p.image && <img src={p.image} alt="" className="mb-3 aspect-video w-full rounded-md border-2 border-[var(--gb-line)] object-cover" />}
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-pixel text-2xl leading-tight">{p.title}</h3>
        <span className="gb-muted font-pixel text-sm">#{String(i + 1).padStart(2, '0')}</span>
      </div>
      <p className="gb-muted mt-2 text-sm leading-relaxed">{p.summary}</p>
      <div className="mt-3"><Tags items={p.stack} /></div>
      {open && (
        <div className="mt-3 space-y-2 text-sm motion-safe:animate-[rise_.25s_ease-out]">
          <p><Label>Papel</Label><br />{p.role}</p>
          <p><Label>Resultado</Label><br />{p.result}</p>
        </div>
      )}
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-4">
        <button type="button" onClick={onToggle} className="gb-btn text-base" aria-expanded={open}><span className="inline-flex items-center gap-2"><PixelIcon name={open ? 'up' : 'down'} size={12} />{open ? 'Menos' : 'Papel e resultado'}</span></button>
        {p.links.map((l) => <a key={l.href} href={l.href} target="_blank" rel="noreferrer" className="gb-btn inline-flex items-center gap-2 text-base">{l.label}<PixelIcon name="link" size={12} /></a>)}
      </div>
    </Card>
  )
}

function Projects({ projects }: { projects: Project[] }) {
  const [filter, setFilter] = useState<string | null>(null)
  const [open, setOpen] = useState<Set<number>>(() => new Set(projects.length === 1 ? [0] : []))
  // Tecnologias mais usadas viram filtros.
  const top = useMemo(() => {
    const count = new Map<string, number>()
    projects.forEach((p) => p.stack.forEach((t) => count.set(t, (count.get(t) ?? 0) + 1)))
    return [...count.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([t]) => t)
  }, [projects])
  const shown = projects.map((p, i) => ({ p, i })).filter(({ p }) => !filter || p.stack.includes(filter))
  const toggle = (i: number) => setOpen((s) => { const n = new Set(s); n.has(i) ? n.delete(i) : n.add(i); return n })
  return (
    <div>
      {projects.length > 2 && (
        <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Filtrar por tecnologia">
          <span className="gb-muted font-pixel text-base">Filtrar:</span>
          <button type="button" className="gb-tag" aria-pressed={!filter} onClick={() => setFilter(null)}>Todos ({projects.length})</button>
          {top.map((t) => <Tag key={t} name={t} active={filter === t} onClick={() => setFilter(filter === t ? null : t)} />)}
        </div>
      )}
      <div className="grid gap-4 sm:grid-cols-2">
        {shown.map(({ p, i }) => <ProjectCard key={i} p={p} i={i} open={open.has(i)} onToggle={() => toggle(i)} />)}
      </div>
    </div>
  )
}

/** Conteúdo de uma seção — usado no painel do jogo e no modo clássico. */
export function SectionContent({ id, content }: { id: SectionId; content: Content }) {
  const c = content
  switch (id) {
    case 'about':
      return (
        <Card placeholder={c.profile.placeholder}>
          <p className="font-pixel text-3xl leading-tight">{c.profile.name}</p>
          <p className="gb-red mt-1 font-pixel text-lg">{c.profile.role}</p>
          {c.profile.bio.map((b, i) => <p key={i} className="gb-muted mt-3 leading-relaxed">{b}</p>)}
          <p className="gb-muted mt-4 flex items-center gap-2 font-pixel text-base"><PixelIcon name="pin" size={16} />{c.profile.location}</p>
        </Card>
      )
    case 'projects':
      return <Projects projects={c.projects} />
    case 'skills':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {c.skills.map((g) => (
            <Card key={g.group} placeholder={g.placeholder}>
              <h3 className="mb-3 font-pixel text-xl">{g.group}</h3>
              <Tags items={g.items} />
            </Card>
          ))}
        </div>
      )
    case 'experience':
      return (
        <ol className="relative space-y-4 border-l-4 border-[var(--gb-accent)]/50 pl-6">
          {c.experience.map((e, i) => (
            <li key={i} className="relative">
              <span aria-hidden className="absolute -left-[35px] top-5 h-5 w-5 rounded-full border-3 border-[var(--gb-line)] bg-[#FFD040]" />
              <Card placeholder={e.placeholder}>
                <p className="gb-blue font-pixel text-base">{e.period}</p>
                <h3 className="font-pixel text-2xl leading-tight">{e.role}</h3>
                <p className="gb-red font-pixel text-base">{e.org}</p>
                <p className="gb-muted mt-2 text-sm leading-relaxed">{e.description}</p>
              </Card>
            </li>
          ))}
        </ol>
      )
    case 'services':
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          {c.services.map((s, i) => (
            <Card key={i} placeholder={s.placeholder}>
              <h3 className="font-pixel text-xl">{s.title}</h3>
              <p className="gb-muted mt-2 text-sm leading-relaxed">{s.description}</p>
            </Card>
          ))}
        </div>
      )
    case 'contact':
      return (
        <Card placeholder={c.contact.placeholder}>
          <p className="gb-muted">Vamos conversar sobre um projeto, uma vaga ou uma ideia.</p>
          <a href={c.contact.placeholder ? undefined : `mailto:${c.contact.email}`} className="gb-btn gb-btn-primary mt-4 inline-block text-xl">
            <span className="inline-flex items-center gap-2"><PixelIcon name="mail" size={16} />{c.contact.email}</span>
          </a>
          {c.contact.links.length > 0 && (
            <ul className="mt-4 flex flex-wrap gap-2">
              {c.contact.links.map((l) => <li key={l.href}><a href={l.href} target="_blank" rel="noreferrer" className="gb-btn inline-flex items-center gap-2 text-base">{l.label}<PixelIcon name="link" size={12} /></a></li>)}
            </ul>
          )}
          {c.contact.cv && <a href={c.contact.cv} download className="gb-btn mt-4 inline-block">Baixar CV</a>}
        </Card>
      )
  }
}
