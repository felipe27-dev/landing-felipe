# Ilha Felipe — portfólio explorável

Portfólio de **Felipe de Souza Rosa** (dev full-stack · fundador técnico da Cyber Castle) em forma de jogo: uma ilha em pixel art, no estilo dos RPGs de portátil, onde cada construção guarda uma parte do currículo. Para quem tem pressa, o **modo clássico** mostra tudo numa página comum, com tema claro e escuro.

## Destaques
- **Mundo explorável:** movimento em grade, colisão, profundidade (o personagem passa atrás de árvores e prédios), câmera, mato alto e água animada.
- **Interiores:** Laboratório (projetos), Biblioteca (habilidades), Oficina (serviços), Correio (contato) e Farol de dois andares (trajetória).
- **Conteúdo real:** projetos, habilidades, experiência e serviços ficam em [`src/content/pt.ts`](src/content/pt.ts).
- **Diálogos** com retrato e pose "falando", menu Iniciar, mapa com viagem rápida e 15 conquistas salvas no navegador.
- **Áudio:** 4 músicas em loop com crossfade e efeitos sonoros gerados por script.
- **Acessibilidade:** teclado, mouse e toque, modo clássico semântico, "reduzir movimento" e 6 fontes à escolha.
- **Arte:** sprites recortados de folhas geradas por IA, com um pipeline próprio em Python (remoção de fundo, limpeza de halo, densidade de 64 px por tile).

## Rodar

Requer **Node 20+**.

```bash
npm install
npm run dev        # http://localhost:5173
```

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Checagem de tipos + build de produção em `dist/` (site estático) |
| `npm run preview` | Serve o build localmente |
| `npm run typecheck` | Só a checagem de tipos |
| `npm run sprites` | Regera os sprites a partir de `art-source/` (Python) |
| `npm run sfx` | Regera os efeitos sonoros (Python) |

## Controles
- **Teclado:** WASD ou setas para andar, Shift para correr, E/Espaço/Enter para interagir, M para o mapa, Esc para o menu e 1–6 para a viagem rápida.
- **Mouse ou toque:** clique no destino ou num objeto; o personagem caminha até lá e interage.
- **Celular:** direcional virtual e botão A.

## Estrutura

```
src/
  content/       textos do site (pt.ts) e tipos — editar aqui o portfólio
  game/          motor: mundo e cenas (world), render (art, terrain), loop (engine),
                 pathfinding, áudio, conquistas, carregador de sprites
  components/    HUD, diálogos, modais, menu, mapa, modo clássico, ícones em pixel
public/assets/   sprites (64 px/tile), músicas e efeitos usados pelo jogo
art-source/      folhas de sprites originais (não vão para o site)
scripts/         pipeline de sprites e geração de efeitos sonoros (Python)
docs/            roadmap, perfil/ideias, animação e pedidos de assets (docs/assets/)
```

## Pipeline de arte (opcional)
Só é necessário para alterar a arte. Os sprites prontos já estão em `public/assets/`.

```bash
pip install -r scripts/requirements.txt
npm run sprites
```

`scripts/build_sprites.py` roda as etapas em ordem:
1. `sprites_segment` e `sprites_extract`: primeira folha (móveis, objetos e placas).
2. `sprites_v2`: terreno, cenário, retratos e interiores.
3. `sprites_v3`: animações.
4. `sprites_v4`: NPCs, prédios e caminhada do Felipe.

As escolhas de cada peça e de cada pose ficam nos próprios scripts.

## Publicar
O build é estático. Basta servir `dist/` (Vercel, Netlify, GitHub Pages ou qualquer hospedagem). O `vite.config.ts` usa `base: './'`, então funciona também em subpastas, como no GitHub Pages.

## Créditos e aviso
Projeto pessoal, sem fins comerciais, **inspirado** na estética dos RPGs de portátil. Não tem afiliação com Nintendo, Game Freak ou The Pokémon Company. Código e conteúdo: Felipe de Souza Rosa. Sprites e músicas gerados para o projeto (sprites tratados pelos scripts deste repositório).
