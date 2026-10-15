# Leva NPCs — alta qualidade e consistência

**Anexe à IA:** `docs/assets/leva_npcs_referencia.png` (os 6 NPCs de hoje, com retrato).
**Gere um NPC por vez**, sempre anexando a referência e a imagem do NPC anterior já aprovado. Assim os 6 saem com o mesmo traço.

## Entrega por NPC
- **1 PNG de 256×96 px** com **4 poses** de 64×96 lado a lado, nesta ordem: **FRENTE · COSTAS · ESQUERDA · FALANDO** (de frente, boca aberta ou gesto de mão).
- Personagem com **~84 px de altura**, centralizado na célula, **pés na mesma linha** (2 px acima da base) nas 4 poses.
- **Fundo 100% transparente** (PNG com canal alfa), sem quadriculado desenhado, sem brilho e sem sombra no chão (o jogo desenha a sombra).
- Contorno escuro de 1 px (`#283038`), luz vindo de cima-esquerda, sombreamento em 2–3 tons por cor.
- A direita é o espelho da esquerda: não precisa gerar.
- **Opcional:** retrato 128×128 do mesmo personagem (busto, fundo liso claro) para a caixa de diálogo.

Arquivos: `public/assets/sprites/characters/<nome>.png` e `public/assets/sprites/portraits/<nome>.png`.

## Prompt base (cole e troque só o bloco do personagem)
```
Pixel art sprite sheet, Game Boy Advance / Pokémon FireRed overworld style, top-down 3/4 view.
ONE character, 4 poses side by side on a single row, each pose in a 64x96 px cell, total 256x96 px:
1) facing front (down), 2) facing back (up), 3) facing left (side profile), 4) facing front talking (mouth open, one hand raised).
Same character, same proportions, same colors and same outline in all 4 poses. Chibi proportions: head about 1/3 of the height.
Character ~84 px tall, centered, feet on the same baseline in every cell.
Clean 1 px dark outline (#283038), light from top-left, 2–3 shade cel shading, crisp pixels, no anti-aliasing, no blur.
Transparent background (real alpha), no checkerboard, no glow, no ground shadow, no text, no extra characters.
Character: <BLOCO DO PERSONAGEM>
Match the attached reference image exactly in style and identity.
```

## Blocos de personagem
| Arquivo | Bloco para colar |
|---|---|
| `guide.png` | friendly young explorer guide, khaki safari hat with green band, olive green shirt with pockets, small brown backpack, brown boots |
| `scientist.png` | young lab assistant, short messy brown hair, round glasses, white lab coat, light blue shirt, red tie, dark trousers |
| `librarian.png` | young librarian woman, long wavy dark brown hair, round glasses, purple sweater, holding a closed book, dark skirt |
| `artisan.png` | workshop artisan, red bandana, white t-shirt, blue denim work apron with tool pocket, brown boots |
| `clerk.png` | post office clerk, blue mail carrier cap with gold emblem, blue uniform jacket with gold buttons, dark trousers |
| `keeper.png` | old lighthouse keeper, short white beard, navy blue captain cap with gold anchor, navy peacoat, dark boots |

## Checklist antes de mandar para o projeto
- [ ] As 4 poses têm a mesma altura e os pés na mesma linha?
- [ ] O fundo é transparente de verdade? Abra num editor e veja se o xadrez é do programa, não da imagem.
- [ ] Não tem contorno branco ou brilho em volta?
- [ ] Cores e acessórios batem com a referência?

Quando chegar, o motor passa a usar a pose **FALANDO** durante o diálogo. Mando junto o ajuste de leitura do formato de 4 poses.
