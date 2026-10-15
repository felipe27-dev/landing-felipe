> **Histórico.** Pedidos de assets das primeiras levas, mantidos como referência. As levas mais recentes estão em `LEVA_NPCS.md` e `LEVA_CONSTRUCOES.md`; os sprites atuais ficam em `public/assets/sprites/`, gerados por `scripts/build_sprites.py`.

# Assets — próxima leva

Os sprites atuais vêm da folha `art-source/Sprite Sheet RPG Pixel Art Organizado.png` (recortados por `scripts/`). Para o ambiente parecer de fato "um só mundo", estes são os que faltam. **Peça ao gerador uma grade rígida, fundo transparente (PNG RGBA de verdade, não quadriculado desenhado) e a mesma luz (de cima-esquerda) e paleta da folha atual.**

## Formato
- **48 px = 1 tile.** Tudo alinhado a múltiplos de 48 px, sem espaçamento entre células.
- Sem moldura/borda em volta de tiles de chão — eles precisam emendar uns nos outros.
- Personagens no mesmo tamanho dos atuais (~75 px de altura).

## Prioridade 1 — o que mais deixa "colado"
1. **Ciclo de caminhada** — uma folha por personagem, **3 colunas × 4 linhas**, célula **48×84**:
   - Colunas: parado · passo pé esquerdo · passo pé direito
   - Linhas: baixo · cima (costas de verdade) · esquerda · direita
   - Para: `player` (obrigatório). NPCs (`guide`, `scientist`, `librarian`, `artisan`, `clerk`, `keeper`): só a coluna "parado" nas 4 direções já basta.
2. **Transições de terreno (autotile 3×3 + 4 cantos internos = 13 tiles cada, 48×48)**:
   - grama → terra (caminho)
   - grama → areia
   - areia → água (linha da costa com espuma; 2–4 quadros se animada)
   - grama → pedra da praça
3. **Grama base sem borda**: 3 variações que emendam (48×48 cada).
4. **Flores e detalhes como sobreposição transparente** (sem chão atrás), 48×48, 2 quadros balançando: flor vermelha, flor branca, tufo de grama, pedrinhas.
5. **Mato alto em 2 camadas**: `tall_grass_base` (chão) e `tall_grass_top` (só as folhas da frente, transparente) para cobrir as pernas.

## Prioridade 2 — vida no cenário
- Árvore grande 2×2 tiles (96×~130) e arbusto 1×1
- Cerca de madeira (reta horizontal/vertical, cantos), poste de luz (dia/noite), banco de praça, fonte da praça (2×2, 3 quadros)
- Píer de madeira e barquinho para a praia; pedras na água
- Janelas acesas (sobreposição para a noite) para cada prédio
- Retratos para diálogo, **96×96**, de cada personagem (rosto neutro + feliz)

## Prioridade 3 — interiores
- Parede e piso próprios por prédio (laboratório, biblioteca, oficina, correio, farol), parede com 2 tiles de altura
- Janela de parede, quadro, relógio, tapete de saída (48×48)

## Sons (efeitos) — `public/assets/audio/sfx/` (.ogg ou .mp3)
`bump`, `interact`, `select`, `menu_open`, `menu_move`, `text` (~20 ms), `door`, `exit`, `travel`, `achievement` (~1 s), `secret`.
Dica: geradores como **jsfxr / sfxr** (gratuitos, no navegador) produzem esse tipo de som em segundos — exporte em .wav e coloque com o nome acima.

Arquivos colocados nas pastas aparecem sozinhos com `npm run dev` rodando. Se vierem em folha única de novo, eu recorto e ligo ao jogo.

---

# Leva 3 — mais quadros de animação

Hoje quase tudo tem 1 ou 2 quadros. A imagem **`docs/assets/referencia_frames.png`** mostra cada sprite com os quadros únicos que existem e o que queremos. Mande essa imagem para a IA como base de estilo.

**Regras:** 64 px = 1 tile · PNG com transparência real (sem quadriculado desenhado e sem brilho/halo em volta) · quadros lado a lado na horizontal, todos do mesmo tamanho · mesma luz (cima-esquerda) e paleta das folhas atuais · o último quadro deve emendar no primeiro (loop).

| Sprite | Hoje | Quero | Célula | Arquivo |
|---|---|---|---|---|
| Felipe (jogador) | 3 por direção | 4 direções × (2 parado + 4 andando + 4 correndo) | 64×96 | `characters/player.png` (linhas: baixo, cima, esquerda, direita) |
| NPCs (6) | 1 por direção | 4 direções × 2 parado (respirar/piscar) | 64×96 | `characters/<nome>.png` |
| Água do mar | 4 | 8, repetível nas 4 bordas | 128×128 | `textures/water0..7.png` |
| Espuma da costa | — | 4, faixa horizontal repetível | 128×32 | `textures/foam.png` |
| Flor vermelha / branca | 2 | 4 balançando | 64×64 | `decals/flower_red.png`, `flower_white.png` |
| Tufo de grama | 2 | 4 balançando | 64×64 | `decals/tuft.png` |
| Mato alto | 2 | 4 parado + 3 farfalhando ao pisar | 64×80 | `decals/tall_grass.png`, `tall_grass_rustle.png` |
| Fonte da praça | 3 | 6 de água jorrando, sem laje em volta | 128×128 | `decor/fountain.png` |
| Garrafa na praia | 5 | 6 brilho/boiar | 64×64 | `props/bottle.png` |
| Poste | 2 (apagado/aceso) | 4 de luz piscando (noite) | 32×112 | `decor/lamp_on.png` |
| Barco | 1 | 4 boiando | 48×96 | `decor/boat.png` |
| Árvore | 1 | 3 de copa balançando | 128×176 | `decor/tree.png` |
| Balão "!" | 1 | 4 de "pop" | 64×64 | `ui/emote.png` |
| Portas dos prédios | 0 | 4 de porta abrindo, por prédio | 64×64 | `doors/<prédio>.png` |
| Fumaça da chaminé | — | 6, sobe e some | 32×64 | `decor/smoke.png` |

Quando chegar, o motor passa a ler o número de quadros pela largura do arquivo (largura ÷ célula). O que precisar de código novo (corrida, farfalhar, portas abrindo, fumaça) entra junto.
