# Animação: como ter movimento fluido (≥ 16 fps) sem desenhar centenas de quadros

## O problema
Gerar cada quadro com IA é lento e pouco intuitivo: cada imagem sai um pouco diferente (cor, proporção, direção), os quadros não emendam e a resolução varia entre folhas. Quanto mais quadros pedimos, mais inconsistência aparece.

## Opções avaliadas

| Abordagem | Como funciona | Serve para pixel art? | Custo |
|---|---|---|---|
| **Movimento procedural no motor** *(adotado)* | Poucos quadros-chave + o código move, inclina, estica e balança a 60 fps | Sim: não cria pixels borrados, só transforma | Baixo, já implementado |
| **Avanço por distância** *(adotado)* | O quadro da caminhada depende de quanto o personagem andou, não de um relógio | Sim | Baixo |
| **Mistura entre quadros** *(adotado só na água)* | Desenha o quadro seguinte por cima com transparência crescente | Só em texturas "líquidas"; em personagens gera fantasma | Baixo |
| Interpolação por IA (RIFE, FILM e similares) | Rede neural inventa quadros intermediários de vídeo | Não: borra o contorno e cria cores novas, o oposto de pixel art | Médio |
| Animação por ossos (Spine, DragonBones) | Personagem recortado em partes giradas por um esqueleto | Parcial: fica com cara de recorte, foge do estilo RPG portátil | Alto |
| **Editor de pixel art com camadas e onion skin** (ex.: Aseprite) | Desenhar/ajustar quadros vendo o anterior e o seguinte por transparência | Sim, é o padrão da indústria | Médio (manual) |
| **Geradores de pixel art com animação** (ex.: PixelLab, extensão Retro Diffusion para Aseprite) | Geram personagem em 4/8 direções e ciclos de caminhada a partir de uma referência | Sim, e mais consistentes que pedir quadro a quadro | Médio — vale testar com 1 personagem |

## O que foi implementado agora
- **Felipe:** o quadro avança pela distância (≈3,4 quadros por tile, ≈16 fps andando e ≈29 fps correndo), com um sobe-e-desce suave a cada passada.
- **NPCs:** respiração contínua, uma leve variação de altura a 60 fps.
- **Flores, tufos e mato:** troca de quadros a 8 fps mais balanço contínuo pela base. O mato balança mais quando o personagem pisa nele.
- **Árvores:** copa balançando ao vento, inclinando a partir do tronco.
- **Barco:** boia de forma contínua; a fonte troca de quadro a 12 fps.
- **Água:** 3 quadros-chave por segundo misturados a 60 fps, com deriva lenta, sem saltos visíveis.
- **"Reduzir movimento":** em Opções, desliga tudo isso.

## Fluxo recomendado para os próximos sprites
1. **Gerar só os quadros-chave:** para caminhar, 4 por direção (contato, passagem, contato, passagem). Para objetos, 2 a 4.
2. **Usar uma ferramenta que mantém o personagem consistente** (um gerador com referência, como os citados acima, ou o Aseprite com onion skin), em vez de pedir uma folha inteira de uma vez.
3. **Exportar na grade certa:** 64 px por tile, célula fixa, quadros lado a lado, fundo transparente real e sem brilho.
4. **Deixar a fluidez com o motor:** balanço, respiração, sobe-e-desce e boiar já existem e se aplicam a qualquer sprite novo.
