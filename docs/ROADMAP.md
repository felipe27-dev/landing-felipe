# Roadmap — Ilha Felipe

Prioridade de cima para baixo. Cada item tem o critério de "pronto".

## Fase A — Base para publicar (conteúdo e confiança)
| # | Item | Pronto quando |
|---|---|---|
| A1 | **Conteúdo real** em `src/content/pt.ts` (bio, 3–6 projetos com imagem/links, habilidades, experiência, serviços, contato, CV) | nenhum `[PREENCHER]` visível; terminais/estantes/placas mostram dados reais |
| A2 | **SEO e compartilhamento**: título, descrição, Open Graph/Twitter card com imagem da ilha, `sitemap.xml`, `robots.txt` | preview correto ao colar o link no LinkedIn/WhatsApp |
| A3 | **Formulário de contato no Correio** (Formspree/Resend/EmailJS) além do e-mail | mensagem enviada chega na caixa do Felipe, com validação e estado de sucesso |
| A4 | **Deploy simples** (Netlify/Vercel/GitHub Pages) + domínio | URL pública com HTTPS; `npm run build` no CI |
| A5 | **Inglês** (`en.ts`) + seletor PT/EN no menu e no modo clássico | todos os textos trocam; idioma lembrado |

## Fase B — Ambiente "vivo" (depende dos assets da seção abaixo)
| # | Item | Pronto quando |
|---|---|---|
| B1 | Ciclo de caminhada real (3 quadros × 4 direções) | sem o "pulinho" substituto |
| B2 | Autotiles de transição (grama↔terra, grama↔areia, areia↔água) | sem bordas quadradas entre terrenos |
| B3 | NPCs com rotina leve (olhar em volta, andar 1–2 tiles) | NPCs não ficam estáticos |
| B4 | Partículas e ambiente: folhas, ondas na costa, luz do farol girando, borboletas | cena tem movimento sem input |
| B5 | Ciclo dia/noite pela hora local (tint + luzes das janelas) | à noite as janelas acendem |
| B6 | Retratos nos diálogos (rosto do NPC ao lado do texto) | todos os NPCs com retrato |
| B7 | Efeitos sonoros reais (ver lista) | sem sons sintetizados |

## Fase C — Engajamento e conversão
| # | Item | Pronto quando |
|---|---|---|
| C1 | **Missão guiada** do Guia: "visite Laboratório, Biblioteca e Correio" com checklist no HUD | ao completar, abre o contato com mensagem de agradecimento |
| C2 | **"Techdex"**: coleção de tecnologias — cada estante/terminal registra as stacks vistas | tela de coleção no menu com % completo |
| C3 | Cartas de projeto colecionáveis (visual de carta com métricas) | projeto aberto vira carta na coleção |
| C4 | Compartilhar conquista / "Mestre da Ilha" (imagem gerada + link) | botão compartilha card com link |
| C5 | Depoimentos como NPCs (clientes/colegas na praça) | 2–3 NPCs com citações reais autorizadas |
| C6 | Agenda (Calendly/Cal.com) no Correio | botão "agendar conversa" funcional |

## Fase D — Qualidade e manutenção
| # | Item | Pronto quando |
|---|---|---|
| D1 | Testes (Vitest) de pathfinding, colisão, warps e conquistas | `npm test` verde no CI |
| D2 | Auditoria de acessibilidade (teclado, leitor de tela, contraste) e modo clássico como entrada para leitores | checklist WCAG AA |
| D3 | Desempenho: carregar interiores sob demanda, comprimir músicas (ogg ~96 kbps), PWA offline | LCP < 2,5 s em 4G; build < 3 MB sem músicas |
| D4 | Analytics respeitando privacidade (Plausible/Umami): cliques em contato, projetos abertos, conquistas | painel com funil "entrou → viu projeto → contato" |
| D5 | Editor de mapa (Tiled `.tmj`) em vez de mapa em código | mapa editável sem programar |

## Ordem sugerida
A1 → A2 → A4 → A3 → B1/B2 (assim que os assets chegarem) → C1 → A5 → B3–B7 → C2–C6 → D.
