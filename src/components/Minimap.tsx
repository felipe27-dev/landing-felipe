import { useEffect, useRef } from 'react'
import { buildings, overworld, T } from '../game/world'

const { w: W, h: H, tiles } = overworld

const COLORS: Record<number, string> = {
  [T.Water]: '#5890F0', [T.Sand]: '#F0E0A8', [T.Grass]: '#8CD070', [T.Flower]: '#8CD070',
  [T.Path]: '#E8D098', [T.Plaza]: '#E4DCC8', [T.Tree]: '#2E7A3A', [T.TallGrass]: '#48A040',
}

/** Miniatura do mapa com a posição do jogador. */
export function Minimap({ player, cell = 3, className = '' }: { player: { x: number; y: number }; cell?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const c = ref.current?.getContext('2d')
    if (!c) return
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      c.fillStyle = COLORS[tiles[y * W + x]]
      c.fillRect(x * cell, y * cell, cell, cell)
    }
    for (const b of buildings) { c.fillStyle = b.roof; c.fillRect(b.x * cell, b.y * cell, b.w * cell, b.h * cell) }
    c.fillStyle = '#1E1B2E'
    c.fillRect(player.x * cell - 1, player.y * cell - 1, cell + 2, cell + 2)
    c.fillStyle = '#FFB627'
    c.fillRect(player.x * cell, player.y * cell, cell, cell)
  }, [player.x, player.y, cell])
  return <canvas ref={ref} width={W * cell} height={H * cell} className={`[image-rendering:pixelated] ${className}`} aria-hidden />
}
