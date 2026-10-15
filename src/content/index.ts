import type { Content, Locale } from './types'
import { pt } from './pt'

// Para adicionar inglês: criar en.ts com o mesmo formato e registrá-lo aqui.
const locales: Partial<Record<Locale, Content>> = { pt }

export function getContent(locale: Locale): Content {
  return locales[locale] ?? pt
}

export * from './types'
