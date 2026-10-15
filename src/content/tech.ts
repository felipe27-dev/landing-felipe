/** Categoria de cada tecnologia, para colorir os emblemas e agrupar filtros. */
export type TechCat = 'front' | 'back' | 'data' | 'ai' | 'infra' | 'game'

const RULES: [TechCat, RegExp][] = [
  ['ai', /openai|ocr|vision|tesseract|transformers|\bia\b|playwright|puppeteer|automa/i],
  ['game', /pixi|canvas|web audio|jogo/i],
  ['data', /postgres|mysql|mongo|sqlite|neon|typeorm|prisma|sqlalchemy|alembic|redis/i],
  ['infra', /docker|github actions|sentry|linux|vitest|eslint|husky|jest|ci\b|pnpm|git\b|vercel/i],
  ['front', /react|expo|tailwind|material|mui|tanstack|zustand|redux|vite|html|css|zod|hook form/i],
  ['back', /node|express|fastapi|flask|python|spring|java|\bgo\b|jwt|socket|nodemailer|weasy|typescript|api/i],
]

export function techCat(name: string): TechCat {
  return RULES.find(([, re]) => re.test(name))?.[0] ?? 'back'
}

export const CAT_LABEL: Record<TechCat, string> = {
  front: 'Front & mobile', back: 'Back-end', data: 'Dados', ai: 'IA & automação', infra: 'Infra & qualidade', game: 'Jogos',
}
