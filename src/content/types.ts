export type SectionId = 'about' | 'projects' | 'skills' | 'experience' | 'services' | 'contact'
export type RegionId = 'praca' | 'lab' | 'biblioteca' | 'trilha' | 'oficina' | 'correio' | 'praia' | 'farol' | 'ilha'
export type Locale = 'pt' | 'en'

/** Conteúdo marcado como placeholder é exibido com estilo de "a preencher". */
export interface Placeholder { placeholder?: boolean }

export interface Project extends Placeholder {
  title: string
  summary: string
  role: string
  stack: string[]
  result: string
  image?: string
  links: { label: string; href: string }[]
}

export interface Experience extends Placeholder { period: string; role: string; org: string; description: string }
export interface Service extends Placeholder { title: string; description: string }
export interface SkillGroup extends Placeholder { group: string; items: string[] }

export interface DialogAction { label: string; section?: SectionId; index?: number }
export interface Dialog { speaker?: string; lines: string[]; actions?: DialogAction[]; portrait?: string }

export interface Content {
  profile: Placeholder & { name: string; role: string; bio: string[]; location: string; photo?: string }
  projects: Project[]
  skills: SkillGroup[]
  experience: Experience[]
  services: Service[]
  contact: Placeholder & { email: string; links: { label: string; href: string }[]; cv?: string }
  sections: Record<SectionId, { title: string; kicker: string }>
  regions: Record<RegionId, string>
  dialogs: Record<string, Dialog>
  ui: Record<string, string>
}
