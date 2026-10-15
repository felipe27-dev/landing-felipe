# Leva Construções — alta qualidade e detalhes

**Anexe à IA:** `docs/assets/leva_construcoes_referencia.png` (os 5 prédios de hoje).
**Gere um prédio por vez.** O primeiro aprovado vira referência de estilo dos seguintes, anexado junto.

## Regras para todos
- Vista **3/4 de cima** (frente e telhado visíveis), estilo RPG de portátil (GBA), **64 px = 1 tile**.
- **Fundo 100% transparente**, **sem grama, calçada ou chão na base**. O jogo já desenha o chão.
- **Porta centralizada na base**, com 64 px de largura, encostando na borda inferior da imagem.
- Contorno escuro limpo (`#283038`), luz de cima-esquerda, sombras internas sob o beiral e nas janelas.
- Detalhe nas texturas: telhas, tijolos ou tábuas, vidro com reflexo, placa com o emblema do prédio.
- Pixels nítidos: sem desfoque, sem anti-aliasing e sem brilho em volta.

Arquivos: `public/assets/sprites/buildings/<nome>.png`.

**Opcional, por prédio:**
- `<nome>_noite.png`: mesma imagem com as janelas acesas, para o ciclo dia/noite.
- `doors/<nome>.png`: 4 quadros de 64×64 da porta abrindo.

## Prompt base
```
Pixel art building, Game Boy Advance / Pokémon FireRed town style, top-down 3/4 view (front facade and roof visible).
Scale: 64 px per tile. Image size <LARGURA>x<ALTURA> px. The entrance door is centered at the bottom edge, 64 px wide.
High detail: textured roof tiles, wall material, window glass with reflections, emblem sign above the door, soft inner shadows under the eaves.
Clean 1 px dark outline (#283038), light from top-left, crisp pixels, no anti-aliasing, no blur, no glow.
Transparent background (real alpha), NO grass, NO ground, NO path under the building, no text, no people.
Building: <BLOCO DO PRÉDIO>
Keep the same silhouette and color scheme as the attached reference.
```

## Blocos de prédio
| Arquivo | Tamanho | Bloco para colar |
|---|---|---|
| `lab.png` | 288×256 | modern research laboratory, white walls with blue glass roof panels, satellite dish and antenna on the roof, circular emblem above automatic glass sliding door, large windows showing monitors |
| `biblioteca.png` | 256×256 | cozy library, warm wooden walls, red clay tile roof, open book emblem above the door, windows showing bookshelves, small potted plants |
| `oficina.png` | 288×256 | craftsman workshop, grey slate roof, gear emblem on the gable, wooden wide workshop door, tools hanging on the facade, small chimney |
| `correio.png` | 320×256 | post office, red tile roof, envelope emblem above the door, red awning, blue-framed windows, little red mailbox beside the door |
| `farol.png` | 128×320 | coastal lighthouse, red and white horizontal stripes, glass lantern room with golden light on top, stone base, rounded wooden door at the bottom |

## Checklist
- [ ] A porta está centralizada e encostada na base?
- [ ] O fundo é transparente e não tem chão nem grama?
- [ ] O tamanho bate com a tabela? (Se vier maior, mantenha a proporção; eu ajusto.)
- [ ] O estilo e a luz combinam com o prédio aprovado anterior?
