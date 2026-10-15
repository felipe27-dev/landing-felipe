import { useEffect, useMemo, useRef, useState } from 'react'
import type { Content, SectionId } from '../content'
import { assetUrl } from '../game/assets'
import { ControlsHelp } from './ControlsHelp'
import { PixelIcon, type IconName } from './PixelIcon'
import { ClassicProjects, ClassicServices, ClassicSkills } from './ClassicSections'
import { SectionContent } from './SectionContent'

const ORDER: SectionId[] = ['about', 'projects', 'skills', 'experience', 'services', 'contact']
const ICON: Record<SectionId, IconName> = { about: 'user', projects: 'flask', skills: 'book', experience: 'tower', services: 'hammer', contact: 'mail' }
type Theme = 'light' | 'dark'

function initialTheme(): Theme {
  try {
    const t = localStorage.getItem('ilha:theme')
    if (t === 'light' || t === 'dark') return t
  } catch { /* ignora */ }
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

/** Navegação convencional: todo o conteúdo em uma página, com tema claro/escuro e interações leves. */
export function ClassicView({ content, onPlay }: { content: Content; onPlay: () => void }) {
  const [theme, setTheme] = useState<Theme>(initialTheme)
  const [active, setActive] = useState<SectionId>('about')
  const [showTop, setShowTop] = useState(false)
  const root = useRef<HTMLDivElement>(null)

  useEffect(() => { try { localStorage.setItem('ilha:theme', theme) } catch { /* ignora */ } }, [theme])

  // Seção ativa no menu + revelar seções ao rolar.
  useEffect(() => {
    const el = root.current
    if (!el) return
    const io = new IntersectionObserver((entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue
        e.target.classList.add('reveal')
        const id = e.target.getAttribute('data-sec') as SectionId | null
        if (id && e.intersectionRatio > 0.2) setActive(id)
      }
    }, { root: el, threshold: [0.05, 0.25] })
    el.querySelectorAll('[data-sec]').forEach((s) => io.observe(s))
    const onScroll = () => setShowTop(el.scrollTop > 600)
    el.addEventListener('scroll', onScroll)
    return () => { io.disconnect(); el.removeEventListener('scroll', onScroll) }
  }, [])

  const stats = useMemo(() => {
    const techs = new Set(content.projects.flatMap((p) => p.stack))
    return {
      list: [
        { n: content.projects.length, l: 'projetos' },
        { n: techs.size, l: 'tecnologias' },
        { n: new Date().getFullYear() - 2021, l: 'anos programando' },
        { n: content.experience.length, l: 'experiências' },
      ],
    }
  }, [content])

  const go = (id: SectionId) => root.current?.querySelector(`#${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  const portrait = assetUrl('sprites/portraits/player.png')
  const P = content.profile

  return (
    <div ref={root} className={`theme-${theme} fixed inset-0 z-50 overflow-y-auto text-[var(--gb-fg)]`} style={{ background: 'var(--gb-page)' }}>
      <header className="sticky top-0 z-10 border-b-4 border-[var(--gb-line)] bg-[var(--gb-bg)]/95 backdrop-blur">
        <nav className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2.5" aria-label="Seções">
          <button onClick={() => go("about")} className="mr-auto truncate font-pixel text-2xl">{P.name}</button>
          <ul className="hidden items-center gap-1 lg:flex">
            {ORDER.map((id) => (
              <li key={id}>
                <button onClick={() => go(id)} aria-current={active === id ? 'true' : undefined}
                  className={`rounded-md px-3 py-1 font-pixel text-lg ${active === id ? 'bg-[var(--gb-card)] shadow-[0_3px_0_var(--gb-line)] ring-2 ring-[var(--gb-line)]' : 'hover:bg-[var(--gb-hover)]'}`}>
                  {content.sections[id].title}
                </button>
              </li>
            ))}
          </ul>
          <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="gb-btn shrink-0 whitespace-nowrap text-lg" aria-label={theme === 'dark' ? 'Usar tema claro' : 'Usar tema escuro'}>
            <span className="inline-flex items-center gap-2"><PixelIcon name={theme === 'dark' ? 'sun' : 'moon'} size={16} />{theme === 'dark' ? 'Claro' : 'Escuro'}</span>
          </button>
          <button onClick={onPlay} className="gb-btn gb-btn-primary inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-lg"><PixelIcon name="play" size={12} />{content.ui.backToGame}</button>
        </nav>
        {/* Navegação compacta para telas menores */}
        <div className="flex gap-1 overflow-x-auto px-3 pb-2 lg:hidden">
          {ORDER.map((id) => (
            <button key={id} onClick={() => go(id)} className={`gb-tag shrink-0 ${active === id ? '!bg-[var(--gb-red)] !text-white' : ''}`}>{content.sections[id].title}</button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-10">
        {/* Abertura */}
        <section className="gb-panel reveal grid items-center gap-6 p-6 sm:p-8 md:grid-cols-[auto_1fr]">
          {portrait && (
            <img src={portrait} alt="" className="mx-auto h-40 w-40 rounded-xl border-4 border-[var(--gb-line)] bg-[#DCEBFA] [image-rendering:pixelated] sm:h-48 sm:w-48" />
          )}
          <div>
            <p className="gb-blue font-pixel text-lg">Olá! Eu sou</p>
            <h1 className="font-pixel text-4xl leading-none [overflow-wrap:anywhere] sm:text-6xl">{P.name}</h1>
            <p className="gb-red mt-2 font-pixel text-xl sm:text-2xl">{P.role}</p>
            <p className="gb-muted mt-3 flex items-center gap-2 font-pixel text-lg"><PixelIcon name="pin" size={16} />{P.location}</p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => go('contact')} className="gb-btn gb-btn-primary inline-flex items-center gap-2 text-xl"><PixelIcon name="mail" size={16} />{content.ui.contactCta}</button>
              <button onClick={() => go('projects')} className="gb-btn inline-flex items-center gap-2 text-xl"><PixelIcon name="flask" size={18} />Ver projetos</button>
              <button onClick={onPlay} className="gb-btn inline-flex items-center gap-2 text-xl"><PixelIcon name="gamepad" size={16} />Explorar a ilha</button>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:col-span-2">
            {stats.list.map((s) => (
              <li key={s.l} className="gb-card px-4 py-3 text-center">
                <p className="font-pixel text-4xl leading-none">{s.n}</p>
                <p className="gb-muted font-pixel text-base">{s.l}</p>
              </li>
            ))}
          </ul>
        </section>

        {ORDER.map((id) => (
          <section key={id} id={id} data-sec={id} aria-labelledby={`h-${id}`} className="scroll-mt-28 opacity-0 [&.reveal]:opacity-100">
            <div className="mb-5 flex items-center gap-3">
              <span className="grid h-12 w-12 place-items-center rounded-lg border-3 border-[var(--gb-line)] bg-[#FFD040] text-2xl shadow-[0_4px_0_var(--gb-line)]" aria-hidden><PixelIcon name={ICON[id]} size={26} /></span>
              <div>
                <p className="gb-blue font-pixel text-lg leading-none">{content.sections[id].kicker}</p>
                <h2 id={`h-${id}`} className="font-pixel text-5xl leading-tight">{content.sections[id].title}</h2>
              </div>
            </div>
            {id === 'projects' ? <ClassicProjects projects={content.projects} />
              : id === 'skills' ? <ClassicSkills skills={content.skills} />
              : id === 'services' ? <ClassicServices services={content.services} />
              : <SectionContent id={id} content={content} />}
          </section>
        ))}

        <section className="gb-panel reveal p-6">
          <h2 className="mb-4 flex items-center gap-3 font-pixel text-3xl"><PixelIcon name="gamepad" size={22} />Prefere explorar?</h2>
          <p className="gb-muted mb-4">O mesmo portfólio existe como uma ilha para explorar, com interiores, conquistas e trilha sonora.</p>
          <ControlsHelp />
          <button onClick={onPlay} className="gb-btn gb-btn-primary mt-5 inline-flex items-center gap-2 text-xl"><PixelIcon name="play" size={14} />Entrar na ilha</button>
        </section>
      </main>

      {showTop && (
        <button onClick={() => root.current?.scrollTo({ top: 0, behavior: 'smooth' })} className="gb-btn fixed bottom-5 right-5 z-20 text-xl" aria-label="Voltar ao topo"><PixelIcon name="up" size={16} /></button>
      )}
    </div>
  )
}
