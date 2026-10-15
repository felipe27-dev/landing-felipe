// Carregador de sprites opcionais. Cada arquivo presente em public/assets/
// substitui a arte desenhada em código; ausentes caem no fallback procedural.
// Os arquivos são gerados por scripts/build_sprites.py a partir de art-source/.
import available from 'virtual:asset-list'

export const CHARACTERS = ['player', 'guide', 'scientist', 'librarian', 'artisan', 'clerk', 'keeper'] as const
export const BUILDINGS = ['lab', 'biblioteca', 'oficina', 'correio', 'farol'] as const
export const PROPS = ['sign', 'mailbox', 'bottle'] as const
export const FURNITURE = ['terminal', 'shelf', 'table', 'plant', 'counter', 'pc', 'bench', 'stairs', 'plaque', 'crate', 'anvil', 'workbench', 'mailshelf'] as const

const base = `${import.meta.env.BASE_URL}assets/sprites/`

function paths(): string[] {
  return [
    ...CHARACTERS.map((c) => `characters/${c}.png`),
    ...BUILDINGS.map((b) => `buildings/${b}.png`),
    ...PROPS.map((p) => `props/${p}.png`),
    ...FURNITURE.map((f) => `furniture/${f}.png`),
    'ui/emote.png',
    ...['grass', 'sand', 'stone', 'water0', 'water1', 'water2', 'water3', 'water4', 'water5', 'water6', 'water7'].map((t) => `textures/${t}.png`),
    ...['flower_red', 'flower_white', 'tuft', 'tall_grass', 'rock', 'rock2'].map((t) => `decals/${t}.png`),
    ...['tree', 'bush', 'fence', 'lamp', 'bench', 'fountain', 'pier', 'boat', 'rock_big'].map((t) => `decor/${t}.png`),
    ...['window', 'picture', 'clock', 'rug'].map((t) => `interior/${t}.png`),
  ]
}

const images = new Map<string, HTMLImageElement>()

function loadOne(path: string) {
  return new Promise<void>((resolve) => {
    const img = new Image()
    img.onload = () => { if (img.naturalWidth > 0) images.set(path.replace(/\.png$/, ''), img); resolve() }
    img.onerror = () => resolve()
    img.src = base + path
  })
}

let loading: Promise<void> | null = null
const present = new Set(available)

export function loadAssets() {
  return (loading ??= Promise.all(paths().filter((p) => present.has(`sprites/${p}`)).map(loadOne)).then(() => undefined))
}

/** Ex.: img('tiles/grass'), img('characters/player'). */
export function img(key: string): HTMLImageElement | undefined {
  return images.get(key)
}

/** URL pública de um asset opcional (ex.: retratos), ou undefined se não existir. */
export function assetUrl(rel: string) {
  return present.has(rel) ? `${import.meta.env.BASE_URL}assets/${rel}` : undefined
}

export function loadedKeys() {
  return [...images.keys()]
}
