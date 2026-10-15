import { isWalkable, type Scene } from './world'

type P = { x: number; y: number }

/** BFS em grade 4-direções. Retorna os passos (sem o ponto inicial) ou null. */
export function findPath(s: Scene, from: P, to: P): P[] | null {
  if (from.x === to.x && from.y === to.y) return []
  if (!isWalkable(s, to.x, to.y)) return null
  const W = s.w, H = s.h
  const prev = new Int32Array(W * H).fill(-1)
  const start = from.y * W + from.x, goal = to.y * W + to.x
  prev[start] = start
  const queue = [start]
  for (let qi = 0; qi < queue.length; qi++) {
    const cur = queue[qi]
    if (cur === goal) break
    const cx = cur % W, cy = (cur / W) | 0
    for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
      const nx = cx + dx, ny = cy + dy, n = ny * W + nx
      if (nx < 0 || ny < 0 || nx >= W || ny >= H || prev[n] !== -1 || !isWalkable(s, nx, ny)) continue
      prev[n] = cur
      queue.push(n)
    }
  }
  if (prev[goal] === -1) return null
  const steps: P[] = []
  for (let c = goal; c !== start; c = prev[c]) steps.push({ x: c % W, y: (c / W) | 0 })
  return steps.reverse()
}

/** Caminho até o vizinho caminhável mais próximo de um alvo sólido. */
export function pathToAdjacent(s: Scene, from: P, target: P): P[] | null {
  let best: P[] | null = null
  for (const [dx, dy] of [[0, 1], [0, -1], [-1, 0], [1, 0]]) {
    const steps = findPath(s, from, { x: target.x + dx, y: target.y + dy })
    if (steps && (!best || steps.length < best.length)) best = steps
  }
  return best
}
