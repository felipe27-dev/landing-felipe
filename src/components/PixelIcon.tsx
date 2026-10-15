/** Ícones em pixel art (SVG em grade), no lugar de emojis que destoam do visual do jogo. */
type Icon = { rows: string[]; colors?: Record<string, string> }

const C: Record<string, string> = {
  o: '#283038', W: '#F8F8F4', w: '#DDE8F2', R: '#E04040', r: '#F08080', Y: '#FFD040', y: '#FFF0A0',
  G: '#58C060', g: '#A8F0A0', B: '#3870D0', b: '#8DB4FF', S: '#F2C49B', N: '#9C6A3A', n: '#C8925A',
  K: '#A8B0BC', k: '#D8DEE6', P: '#B070E0', d: '#6A4122',
}

const ICONS = {
  pin: { rows: ['..ooooo..', '.oRRRRRo.', 'oRRWWRRRo', 'oRRWRRRRo', 'oRRRRRRRo', 'oRRRRRRRo', '.oRRRRRo.', '..oRRRo..', '...oRo...', '....o....'] },
  user: { rows: ['...oooo...', '..oSSSSo..', '..oSoSoS..', '..oSSSSo..', '...oooo...', '..oBBBBo..', '.oBBbBBBo.', 'oBBBbBBBBo', 'oBBBBBBBBo', 'oooooooooo'] },
  flask: { rows: ['..oooooo..', '...owwo...', '...owwo...', '..owwwwo..', '.owwwwwwo.', 'oGGGGGGGGo', 'oGgGGGGgGo', 'oGGGGgGGGo', '.oGGGGGGo.', '..oooooo..'] },
  book: { rows: ['oooooooooo', 'oRRRRRRRWo', 'oRYYYYRRWo', 'oRRRRRRRWo', 'oRYYYRRRWo', 'oRRRRRRRWo', 'oRRRRRRRWo', 'oRRRRRRRWo', 'oWWWWWWWWo', 'oooooooooo'] },
  tower: { rows: ['...oo...', '..oYYo..', '.oooooo.', '..oRRo..', '..oWWo..', '..oRRo..', '.oWWWWo.', '.oRRRRo.', '.oWWWWo.', '.oRRRRo.', 'oWWddWWo', 'oooooooo'] },
  hammer: { rows: ['.oooooo...', 'oKKKKKKo..', 'okkkkKKo..', '.ooooNoo..', '....oNo...', '....oNo...', '....oNo...', '....oNo...', '....oNo...', '....ooo...'] },
  mail: { rows: ['oooooooooooo', 'oWoWWWWWWoWo', 'oWWoWWWWoWWo', 'oWWWoWWoWWWo', 'oWWWWooWWWWo', 'oWWWWWWWWWWo', 'oWWWWWWWRRWo', 'oWWWWWWWRRWo', 'oooooooooooo'] },
  map: { rows: ['oooooooooooo', 'oyyGGGbbbbbo', 'oyGGGGGbbbbo', 'oGGGRGGGbbbo', 'oGGRRRGGGbbo', 'oGGGRGGGGGbo', 'oGGGGGGyyGGo', 'obGGGGyyyyGo', 'obbGGGGyyGGo', 'oooooooooooo'] },
  gear: { rows: ['...oooo...', '.oooKKooo.', '.oKKKKKKo.', 'ooKKooKKoo', 'oKKo..oKKo', 'oKKo..oKKo', 'ooKKooKKoo', '.oKKKKKKo.', '.oooKKooo.', '...oooo...'] },
  trophy: { rows: ['oooooooooo', 'oYYYYYYYYo', 'oYoYyYYoYo', 'ooYyYYYYoo', '.oYYYYYYo.', '..oYYYYo..', '...oYYo...', '...oYYo...', '..oYYYYo..', '..oooooo..'] },
  sparkle: { rows: ['....o....', '...oYo...', '...oYo...', '.ooYYYoo.', 'oYYYWYYYo', '.ooYYYoo.', '...oYo...', '...oYo...', '....o....'] },
  shoe: { rows: ['..oooo....', '..oRRo....', '..oRRo....', '..oRRoooo.', '.oRRRRRRRo', 'oRRRRRRRRo', 'oWWWWWWWWo', 'oooooooooo'] },
  chat: { rows: ['.oooooooo.', 'oWWWWWWWWo', 'oWWWWWWWWo', 'oWoWWoWWoo', 'oWWWWWWWWo', '.ooWWoooo.', '..oWo.....', '..oo......'] },
  computer: { rows: ['oooooooooo', 'oBBBBBBBBo', 'oBbBBBBBBo', 'oBBbBBBBBo', 'oBBBBBBBBo', 'oooooooooo', '....oo....', '..oooooo..', '.okkkkkko.', '.oooooooo.'] },
  sign: { rows: ['oooooooooo', 'onnnnnnnno', 'onddddnnno', 'onnnnnnnno', 'onddnnnnno', 'oooooooooo', '....oo....', '....oo....', '....oo....', '...oooo...'] },
  leaf: { rows: ['....o.....', '...oGo..o.', '.o.oGo.oGo', 'oGooGooGo.', 'oGGoGoGGo.', '.oGGGGGo..', '..oGGGo...', '...oGo....', '...ooo....'] },
  bottle: { rows: ['..oo..', '.oNNo.', '..oo..', '.owwo.', '.oGGo.', 'oGGGGo', 'oGWGGo', 'oGWGGo', 'oGGGGo', 'oGGGGo', 'oGGGGo', '.oooo.'] },
  question: { rows: ['.oooooo.', 'oWWWWWWo', 'oWooooWo', '.o...oWo', '....oWo.', '...oWo..', '...oWo..', '...ooo..', '...oWo..', '...ooo..'] },
  sun: { rows: ['.....o.....', '..o..o..o..', '...ooooo...', '..oYYYYYo..', '.oYYyYYYYo.', 'oooYYYYYooo', '.oYYYYYYYo.', '..oYYYYYo..', '...ooooo...', '..o..o..o..', '.....o.....'] },
  moon: { rows: ['..ooooo..', '.oYYYYo..', 'oYYYYo...', 'oYYYo....', 'oYYYo....', 'oYYYYo...', 'oYYYYYoo.', '.oYYYYYYo', '..oooooo.'] },
  gamepad: { rows: ['.oooooooooo.', 'oKKKKKKKKKKo', 'oKoKKKKKKRKo', 'oooooKKKRKRo', 'oKoKKKKKKRKo', 'oKKKKooKKKKo', 'oKKKo..oKKKo', '.ooo....ooo.'] },
  mouse: { rows: ['.ooooo.', 'oWWoWWo', 'oWWoWWo', 'ooooooo', 'oWWWWWo', 'oWWWWWo', 'oWWWWWo', 'oWWWWWo', '.oWWWo.', '..ooo..'] },
  close: { rows: ['oo....oo', 'oRo..oRo', '.oRooRo.', '..oRRo..', '..oRRo..', '.oRooRo.', 'oRo..oRo', 'oo....oo'] },
  cursor: { rows: ['oo.....', 'oRoo...', 'oRRRoo.', 'oRRRRRo', 'oRRRoo.', 'oRoo...', 'oo.....'] },
  more: { rows: ['ooooooo', 'oRRRRRo', '.oRRRo.', '..oRo..', '...o...'] },
  left: { rows: ['...oo', '.ooWo', 'oWWWo', '.ooWo', '...oo'] },
  right: { rows: ['oo...', 'oWoo.', 'oWWWo', 'oWoo.', 'oo...'] },
  play: { rows: ['oo.....', 'oWoo...', 'oWWWoo.', 'oWWWWWo', 'oWWWoo.', 'oWoo...', 'oo.....'] },
  up: { rows: ['...oo...', '..oWWo..', '.oWWWWo.', 'oWWWWWWo', 'oooWWooo', '..oWWo..', '..oooo..'] },
  down: { rows: ['..oooo..', '..oWWo..', 'oooWWooo', 'oWWWWWWo', '.oWWWWo.', '..oWWo..', '...oo...'] },
  link: { rows: ['...ooooo', '....oWWo', '...oWWWo', '..oWWooo', '.oWWo...', 'oWWo....', '.oo.....'] },
  check: { rows: ['.......oo', '......oGo', '.....oGo.', 'oo..oGo..', 'oGooGo...', '.oGGo....', '..oo.....'] },
} satisfies Record<string, Icon>

export type IconName = keyof typeof ICONS

export function PixelIcon({ name, size = 16, className = '' }: { name: IconName; size?: number; className?: string }) {
  const icon: Icon = ICONS[name]
  const h = icon.rows.length, w = Math.max(...icon.rows.map((r) => r.length))
  const colors = { ...C, ...icon.colors }
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={(size * w) / h} height={size} className={`inline-block shrink-0 align-[-0.15em] ${className}`}
      shapeRendering="crispEdges" aria-hidden>
      {icon.rows.flatMap((row, y) => [...row].map((ch, x) => (colors[ch]
        ? <rect key={`${x}-${y}`} x={x} y={y} width={1.02} height={1.02} fill={colors[ch]} />
        : null)))}
    </svg>
  )
}
