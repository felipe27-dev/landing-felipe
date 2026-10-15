// Conquistas: definidas aqui, progresso salvo no navegador do visitante.

import type { IconName } from '../components/PixelIcon'

export interface Achievement { id: string; title: string; description: string; icon: IconName; secret?: boolean }

export const ACHIEVEMENTS: Achievement[] = [
  { id: 'start', title: 'Primeiros passos', description: 'Começou a explorar a ilha.', icon: 'shoe' },
  { id: 'guide', title: 'Bom ouvinte', description: 'Conversou com o Guia na praça.', icon: 'chat' },
  { id: 'enter-lab', title: 'Cientista', description: 'Entrou no Laboratório.', icon: 'flask' },
  { id: 'enter-biblioteca', title: 'Leitor', description: 'Entrou na Biblioteca.', icon: 'book' },
  { id: 'enter-oficina', title: 'Mão na massa', description: 'Entrou na Oficina.', icon: 'hammer' },
  { id: 'enter-correio', title: 'Remetente', description: 'Entrou no Correio.', icon: 'mail' },
  { id: 'enter-farol', title: 'Faroleiro', description: 'Subiu no Farol.', icon: 'tower' },
  { id: 'projects', title: 'Curioso', description: 'Ligou os três terminais do Laboratório.', icon: 'computer' },
  { id: 'milestones', title: 'Historiador', description: 'Leu os quatro marcos no topo do Farol.', icon: 'sign' },
  { id: 'explorer', title: 'Explorador', description: 'Visitou todas as regiões da ilha.', icon: 'map' },
  { id: 'travel', title: 'Viajante', description: 'Usou a viagem rápida.', icon: 'sparkle' },
  { id: 'grass', title: 'Mato alto', description: 'Andou 20 passos pelo mato alto.', icon: 'leaf' },
  { id: 'contact', title: 'Vamos conversar', description: 'Abriu a seção de contato.', icon: 'mail' },
  { id: 'bottle', title: 'Mensagem na garrafa', description: 'Encontrou o segredo da praia.', icon: 'bottle', secret: true },
  { id: 'all', title: 'Mestre da Ilha', description: 'Desbloqueou todas as outras conquistas.', icon: 'trophy', secret: true },
]

const KEY = 'ilha:achievements'

function load(): Set<string> {
  try { return new Set(JSON.parse(localStorage.getItem(KEY) ?? '[]')) } catch { return new Set() }
}

class Tracker {
  unlocked = load()
  private counters: Record<string, Set<string> | number> = {}
  private listeners = new Set<(a: Achievement) => void>()

  onUnlock(fn: (a: Achievement) => void) { this.listeners.add(fn); return () => { this.listeners.delete(fn) } }

  unlock(id: string) {
    if (this.unlocked.has(id)) return
    const a = ACHIEVEMENTS.find((x) => x.id === id)
    if (!a) return
    this.unlocked.add(id)
    try { localStorage.setItem(KEY, JSON.stringify([...this.unlocked])) } catch { /* ignora */ }
    this.listeners.forEach((f) => f(a))
    if (id !== 'all' && ACHIEVEMENTS.every((x) => x.id === 'all' || this.unlocked.has(x.id))) this.unlock('all')
  }

  /** Conta itens distintos; desbloqueia quando atingir o total. */
  collect(id: string, item: string, total: number) {
    const s = (this.counters[id] ??= new Set<string>()) as Set<string>
    s.add(item)
    if (s.size >= total) this.unlock(id)
  }

  count(id: string, total: number) {
    const n = ((this.counters[id] as number) ?? 0) + 1
    this.counters[id] = n
    if (n >= total) this.unlock(id)
  }

  reset() {
    this.unlocked.clear(); this.counters = {}
    try { localStorage.removeItem(KEY) } catch { /* ignora */ }
  }
}

export const achievements = new Tracker()
