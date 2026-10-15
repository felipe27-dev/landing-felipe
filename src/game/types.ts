export type Dir = 'up' | 'down' | 'left' | 'right'

export const DELTA: Record<Dir, [number, number]> = { up: [0, -1], down: [0, 1], left: [-1, 0], right: [1, 0] }
