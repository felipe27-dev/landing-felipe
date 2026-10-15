import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readdirSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'

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
  plugins: [react(), tailwindcss(), assetList()],
  base: './',
})
