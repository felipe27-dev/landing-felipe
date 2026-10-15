# Perfil do Felipe — análise e ideias

Fontes lidas: currículo (`docs/Curriculo_Felipe_de_Souza_Rosa.pdf`), README do perfil do GitHub (`felipe27-dev`), site da Cyber Castle (`Projeto_Landing_Page_Cyber/src/constants/content.ts`) e os 23 projetos em `Projetos/` (READMEs, documentação, `package.json`, `pyproject`, `go.mod`, histórico git). `node_modules`, `.env` e builds foram ignorados.

Fatos estão marcados com a fonte. Opiniões estão na seção **Leitura**.

---

## 1. Quem é (fatos)

| Item | Dado | Fonte |
|---|---|---|
| Nome | Felipe de Souza Rosa | CV |
| Base | Campo Grande, MS | CV, GitHub |
| Formação | Técnico em Informática — FATEC-MS (2022–2024) · Bacharelado em Sistemas de Informação — UFMS (2025–2028) | CV |
| Papel atual | Fundador técnico da **Cyber Castle** (estúdio de software para PMEs do Centro-Oeste) | GitHub |
| Trabalho | Estágio temporário na Zflint Store (nov/2025–atual): hardware, montagem, diagnóstico, formatação | CV |
| Robótica | FLL (jun/2021–dez/2024) e OBR (jan/2022–dez/2024) pelo Sesi · Ararabots/UFMS — SSL-VICE (RoboCup SSL) | CV, GitHub |
| Certificações | Metodologia de Pesquisa — Fiocruz (2024) · TOEIC — Mastertest (2024) · Microsoft Office Specialist (2024) | CV |
| Cursos | Python avançado (2024) · Desenvolvimento Web (2024) · Suporte técnico (2025) · React (2025) | CV |
| Idiomas | Português nativo · Inglês avançado · Espanhol intermediário | CV |
| Foco declarado | Backend em TypeScript, mobile com React Native, modelagem de dados, produtos que rodam sozinhos | GitHub |

**Contato público usado no site:** e-mail, GitHub, LinkedIn e cybercastle.dev.
**Fora do site de propósito:** telefone e endereço, que constam no CV. O CV em PDF também não foi publicado. Se quiser, basta pôr o PDF em `public/` e preencher `contact.cv`.

> **Divergência para corrigir:** o CV aponta o LinkedIn para `/in/felipe-de-souza-rosa-352257340`, enquanto o README do GitHub usa `/in/felipe-de-souza-rosa/`. No site usei o do CV. Vale confirmar qual está ativo e unificar.

## 2. Repertório técnico (evidência no código)

| Área | Tecnologias com uso real | Onde aparece |
|---|---|---|
| Backend TS/JS | Node, Express, TypeORM, Prisma, Zod, JWT, Swagger, Sentry | Tenda, Mylofy, TaskMaster, Leads |
| Backend Python | FastAPI, SQLAlchemy async, Alembic, Pydantic, uv, Flask, Socket.IO, WeasyPrint | Estagia+, Seleção, BingoNow |
| Outras linguagens | Java/Spring Boot, Go (JWT, pq) | Imóveis Bretas v1/v2 |
| Front web | React 18/19, Vite, Tailwind, MUI, TanStack Query/Table, RHF+Zod, Zustand, Framer Motion, Recharts | quase todos |
| Mobile | React Native, Expo Router, EAS, notificações, câmera, SecureStore, mapas | Tenda, Vârcolac, Game Night, TESTES_APP |
| Jogos | PixiJS, Canvas 2D, motores próprios testados, editores de fase | RhythmAnimal, BDJ, Vârcolac, Ilha |
| IA / automação | OpenAI, Google Cloud Vision e Tesseract (OCR), Transformers.js no navegador, Playwright, Puppeteer | Leads, Tenda, Landing Cyber |
| Dados | PostgreSQL (principal), Neon, MySQL, MongoDB, SQLite | — |
| Infra e qualidade | Docker multi-stage, docker-compose com healthcheck, GitHub Actions, Vitest, ESLint, Prettier, Husky, commitlint, ADRs | Estagia+, RhythmAnimal, OrçaAI, BDJ, Werewolf |
| Processo | Scrum, documentação de requisitos (RN, RF, RNF), "documentação viva", revisão de PR com IA (Repomix + prompts mestres) | Tenda, OrçaAI |

## 3. Projetos — inventário e classificação

| Projeto | O que é | Estado | Vitrine? |
|---|---|---|---|
| **Tenda Solar** | Energy-as-a-Service: OCR de fatura, contrato digital, cobrança e créditos de energia | Em produção (cliente) | ★ principal |
| **Estagia+** | Análise de currículos com IA (FastAPI + React) | No ar (Vercel) | ★ |
| **Prospecção B2B** | Scraper do Maps + IA que escreve a abordagem + supressão tripla | Interno | ★ (mostra produto e ética) |
| **Vârcolac** | Lobisomem presencial pass-and-play (Expo, monorepo) | Open source | ★ |
| **Imóveis Bretas** | Portfólio imobiliário com painel administrativo (React + Spring/Go) | Protótipo para cliente | ★ |
| **RhythmAnimal** | Jogo rítmico 2.5D (PixiJS) com editor, PWA e acessibilidade | Jogável | ★ |
| **OrçaAI Agent** | IA de atendimento e orçamentos via WhatsApp | Em desenvolvimento | ★ (quando tiver demo) |
| **BingoNow** | Bingo com PDF e sorteio em tempo real | Completo | secundário |
| **TaskMaster** | Kanban full-stack | Completo | secundário |
| **Ilha Felipe** | Este portfólio | Beta | meta |
| TrackReader · CyberPass | Produtos da Cyber Castle (TrackReader na Play Store) | No ar (segundo o site da Cyber Castle) | podem entrar quando houver mais detalhe |
| Landing Cyber Castle | Site da empresa com "tradutor de ideias" por IA no navegador | No ar | pode virar case de produto |
| Projeto BDJ | Jogo de batalha de rimas (domínio puro e testado) | Vertical slice | laboratório |
| Calculadoras UFMS e Passe · Restaurante · Votação · Seleção · Game Night · Mylofy · TESTES_APP | Estudos e projetos pessoais | Variado | fora da vitrine |

Critério da vitrine: cliente real ou produto no ar, primeiro; depois profundidade técnica (arquitetura, testes, IA); por último, projetos que mostram amplitude (jogos). Projetos de estudo inicial ficam de fora, para não diluir.

## 4. Leitura (opinião)

**Pontos fortes**
- **Perfil raro para a idade e o período do curso:** combina produto (escreve SRS e regras de negócio), gestão (Scrum Master de 6 devs) e execução full-stack com mobile.
- **Ponte entre negócio e tecnologia:** o site da Cyber Castle fala a língua do dono do negócio, e a prospecção usa dores reais tiradas das avaliações. É um diferencial forte para freelas e PMEs.
- **Maturidade de engenharia acima da média de júnior:** ADRs, motores testados, Docker com healthcheck, CI, lint obrigatório e "domínio puro sem navegador".
- **Robótica desde 2021:** histórico competitivo longo, ótimo para vagas de sistemas embarcados e visão computacional, e para bolsas e iniciação científica.
- **Hardware no dia a dia:** credibilidade em suporte e infraestrutura, um nicho em que muitos devs são fracos.

**Lacunas e riscos**
- **Repositórios privados ou sem link:** muitos projetos bons não estão públicos (Tenda, Leads, RhythmAnimal, BDJ, Imóveis). Quem recruta só vê o que está no GitHub.
- **Falta de métricas:** nenhum projeto declara números (usuários, faturas processadas, tempo economizado). O site da Cyber Castle já tem campos de métrica comentados.
- **Duas identidades:** "Felipe dev" e "Cyber Castle". O portfólio precisa deixar claro o papel pessoal em cada entrega da empresa.
- **CV desatualizado frente ao GitHub:** o CV ainda lista React/Redux e Python como foco e cita TaskMaster/Bingo, mas não menciona Cyber Castle, Tenda, Estagia+ nem Ararabots.
- **Muitos projetos começados:** é bom sinal de curiosidade, mas convém fechar e publicar 2 ou 3 com demo antes de abrir novos.

## 5. Ideias para a landing (priorizadas)

### Conteúdo e conversão
1. **Métricas reais nos cases:** número de faturas lidas por OCR no Tenda, currículos analisados no Estagia+, leads qualificados na prospecção. Pedem só uma linha cada em `pt.ts` (`result`).
2. **Imagens dos projetos:** prints ou GIFs curtos no campo `image` de cada projeto. O painel já tem o espaço.
3. **CV em PDF atualizado:** uma versão sem endereço e telefone, ligada em `contact.cv`.
4. **Botão "Contratar a Cyber Castle"** separado de "Falar comigo (vaga)". São dois públicos e duas intenções.
5. **Versão em inglês:** ele tem TOEIC e o formato de portfólio-jogo viraliza bem fora do Brasil.

### Novas áreas da ilha (cada uma liga conteúdo real a uma mecânica)
| Ideia | Mecânica | Conteúdo |
|---|---|---|
| **Castelo Cyber Castle** (prédio novo) | Interior com "sala de reuniões": NPC sócio explica o estúdio; quadro com os produtos (CyberPass, TrackReader, Estagia+) | Empresa, serviços, formulário de orçamento |
| **Arena de Robótica** | Mini-arena com robôs FLL/OBR/SSL; um "desafio" curto de seguir linha | Trajetória de robótica + Ararabots |
| **Fliperama** | Máquinas que abrem demos dos jogos (Vârcolac web, RhythmAnimal, BDJ) | Projetos de jogos jogáveis no navegador |
| **Usina solar** perto do farol | Painéis solares animados; NPC conta o case Tenda | Case principal com métricas |
| **Oficina de hardware** | Bancada de montagem de PC (minigame de encaixar peças) | Zflint + suporte técnico |

### Mecânicas de engajamento
- **Missão do Guia:** "Visite 3 prédios e fale com o Faroleiro". Ao completar, abre o contato com uma mensagem pronta.
- **Techdex:** cada terminal ou estante registra as tecnologias vistas, com uma tela de coleção (aproveita `skills` e `stack`).
- **Cartas de projeto:** cada projeto aberto vira uma carta colecionável, com stack e resultado.
- **Assistente com IA:** um NPC "Oráculo" que responde perguntas sobre o Felipe usando o conteúdo do site. O Felipe já fez um tradutor com Transformers.js rodando no navegador, então dá para reaproveitar a ideia.
- **Dia e noite** pela hora local, com janelas acesas (a Prancha já tem esses sprites).

### Carreira (fora da landing)
- Publicar 2 ou 3 repositórios "vitrine" com README, demo e GIF: Estagia+, RhythmAnimal, Vârcolac.
- Atualizar o CV com Cyber Castle, Tenda (como Scrum Master), Estagia+, Ararabots e a stack atual (TypeScript, React Native, FastAPI, Docker).
- Escrever 1 ou 2 posts técnicos: "Revisão de PR com IA numa equipe de 6" e "Prospecção que cita a dor real do cliente".
- Iniciação científica ou extensão na UFMS ligada à robótica ou à visão computacional (SSL-VICE).

## 6. O que foi preenchido no site
- **Sobre:** nome, cargo, 3 parágrafos de bio e localização.
- **Projetos:** 10 projetos, os 9 primeiros com terminal no Laboratório.
- **Habilidades:** 6 grupos, com 6 estantes na Biblioteca.
- **Experiência:** 6 itens, com 6 placas no Farol e 4 marcos na Trilha.
- **Serviços:** 4, com 4 bancadas na Oficina.
- **Contato:** e-mail, GitHub, LinkedIn e Cyber Castle.
- **Datas sem confirmação:** "2025 – atual" para a Cyber Castle e "UFMS · atual" para a Ararabots foram inferidas (não há data explícita). Confirme.
