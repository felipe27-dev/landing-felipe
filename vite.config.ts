import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { pt } from './src/content/pt'

const SITE = 'https://felipe-souza-rosa.web.app/'

/** SEO: o jogo roda em <canvas>, então o Google não enxerga o conteúdo.
 *  Este plugin gera, a partir de src/content/pt.ts, um HTML real dentro de
 *  #root (o React substitui ao montar) e o JSON-LD da pessoa no <head>. */
function seoContent(): Plugin {
  const esc = (t: string) => t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  const { profile, projects, skills, experience, services, contact } = pt
  const a = (l: { label: string; href: string }) => `<a href="${esc(l.href)}" rel="me">${esc(l.label)}</a>`
  const body = `
<main style="max-width:760px;margin:0 auto;padding:24px 16px;font-family:Inter,system-ui,sans-serif;color:#e8e6f0;background:#1E1B2E;line-height:1.5">
  <header>
    <h1>${esc(profile.name)}</h1>
    <p><strong>${esc(profile.role)}</strong> — ${esc(profile.location)}</p>
  </header>
  <section><h2>Sobre</h2>${profile.bio.map((b) => `<p>${esc(b)}</p>`).join('')}</section>
  <section><h2>Projetos</h2>${projects.map((p) => `
    <article><h3>${esc(p.title)}</h3><p>${esc(p.summary)}</p><p>${esc(p.role)}</p><p>${esc(p.result)}</p>
    <p>Tecnologias: ${p.stack.map(esc).join(', ')}</p>${p.links.length ? `<p>${p.links.map(a).join(' · ')}</p>` : ''}</article>`).join('')}
  </section>
  <section><h2>Experiência</h2><ul>${experience.map((e) => `<li><strong>${esc(e.role)}</strong> — ${esc(e.org)} (${esc(e.period)}): ${esc(e.description)}</li>`).join('')}</ul></section>
  <section><h2>Habilidades</h2><ul>${skills.map((g) => `<li><strong>${esc(g.group)}:</strong> ${g.items.map(esc).join(', ')}</li>`).join('')}</ul></section>
  <section><h2>Serviços</h2><ul>${services.map((s) => `<li><strong>${esc(s.title)}:</strong> ${esc(s.description)}</li>`).join('')}</ul></section>
  <section><h2>Contato</h2><p><a href="mailto:${esc(contact.email)}">${esc(contact.email)}</a> · ${contact.links.map(a).join(' · ')}</p></section>
</main>`
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: profile.name,
    url: SITE,
    image: SITE + 'icons/android-chrome-512x512.png',
    jobTitle: 'Desenvolvedor Full-Stack',
    description: profile.bio[0],
    email: 'mailto:' + contact.email,
    worksFor: { '@type': 'Organization', name: 'Cyber Castle', url: 'https://cybercastle.dev' },
    alumniOf: { '@type': 'CollegeOrUniversity', name: 'Universidade Federal de Mato Grosso do Sul' },
    address: { '@type': 'PostalAddress', addressLocality: 'Campo Grande', addressRegion: 'MS', addressCountry: 'BR' },
    knowsAbout: ['TypeScript', 'Node.js', 'React', 'React Native', 'Python', 'PostgreSQL'],
    sameAs: contact.links.map((l) => l.href),
  }
  return {
    name: 'seo-content',
    transformIndexHtml: (html) =>
      html
        .replace('<!--seo-content-->', body)
        .replace('</head>', `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>\n  </head>`),
  }
}

/** Expõe a lista de arquivos de public/assets como `virtual:asset-list`,
 *  para o jogo carregar só sprites/sons que existem (sem 404). */
function assetList(): Plugin {
  const id = 'virtual:asset-list', resolved = '\0' + id
  const root = join(__dirname, 'public', 'assets')
  const walk = (dir: string): string[] => {
    try {
      return readdirSync(dir).flatMap((f) => {
        const p = join(dir, f)
        return statSync(p).isDirectory() ? walk(p) : [relative(root, p).split(sep).join('/')]
      })
    } catch { return [] }
  }
  return {
    name: 'asset-list',
    resolveId: (s) => (s === id ? resolved : undefined),
    load: (s) => (s === resolved ? `export default ${JSON.stringify(walk(root))}` : undefined),
    configureServer(server) {
      server.watcher.add(root)
      const reload = (f: string) => {
        if (!f.startsWith(root)) return
        const m = server.moduleGraph.getModuleById(resolved)
        if (m) server.moduleGraph.invalidateModule(m)
        server.ws.send({ type: 'full-reload' })
      }
      server.watcher.on('add', reload)
      server.watcher.on('unlink', reload)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), assetList(), seoContent()],
  base: './',
})
