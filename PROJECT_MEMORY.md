# PROJECT_MEMORY.md: FleetPulse AI

> Memória viva do projeto. Anexar no início de cada conversa nova com o Claude.
> Regras do arquivo: máx. ~200 linhas · tudo datado · separar FATO de HIPÓTESE · nunca colocar chaves, senhas ou dados pessoais.
> Última atualização: 12/10/2026

---

## 1. Objetivo e posicionamento

- **Quem:** Arthur Perdigão, SDET / QA Architect (Playwright, TypeScript, Node; RAG e LLMs), Belo Horizonte.
- **Meta:** projeto de portfólio (GitHub + LinkedIn) para chamar a atenção de times de Engenharia de Qualidade / SDET / IA / Plataforma de uma grande empresa de mobilidade sediada em BH (alvo: Localiza).
- **O que é:** PoC de "observabilidade de preço de mercado": coleta cotações públicas de aluguel de carros, detecta anomalias, explica com LLM e responde perguntas com números verificados.
- **O que NÃO é:** não é scraper agressivo, não é framework de teste E2E, não tem vínculo oficial com nenhuma empresa. Só dados públicos.
- **Assinatura técnica (diferencial):** o mesmo ciclo da Paytrack (scraping contínuo → pipeline → RAG → feedback loop humano), aplicado a pricing, com QA aplicado à IA (evals).
- **Frase de posicionamento:** "monitor de saúde de preços": observa o mercado, avisa quando algo muda, explica por quê e responde com números verificados.

## 2. Escopo do MVP (FATO, decidido em 12/10/2026)

- 2 fontes (Localiza + 1 concorrente) · 3 praças (ex.: Confins, Pampulha, Rodoviária) · 3 categorias · 3 antecedências · 2 rodadas/dia ≈ 50 cotações por rodada.
- **Fora de escopo (por enquanto):** mais de 2 fontes, mobile, autenticação de usuários, Kubernetes/microserviços, ML sofisticado, dados pessoais.

## 3. Pipeline (7 etapas)

1. **Collect:** workers Playwright rodam a matriz de cotações (praça × categoria × antecedência).
2. **Validate:** schema Zod por resposta + detecção de schema drift + checagem de qualidade (preço zero, outlier, moeda).
3. **Store:** Postgres/TimescaleDB (série temporal).
4. **Detect:** job estatístico de anomalias.
5. **Explain:** só anomalias vão ao LLM, que gera a narrativa.
6. **Index:** narrativas viram embeddings no pgvector com metadados.
7. **Ask/Alert:** chat com agente + alertas proativos (Telegram/Slack).

**Loop de feedback:** analista marca insight como útil/errado ou corrige → correção indexada como "verificada por humano" com peso maior no retrieval.

## 4. Decisões de arquitetura (ADR enxuto)

| Data | Decisão | Motivo | Alternativa descartada |
|---|---|---|---|
| 12/10 | Playwright para coleta | Projeto é de coleta, não de teste; interceptação de rede e contextos isolados; Arthur domina | Cypress (feito para testar a própria app, restrições de origem/abas) |
| 12/10 | Capturar JSON via `page.on('response')` | Mais estável e rápido que parsear HTML | Parsing de HTML (fallback: `getByRole`) |
| 12/10 | Banco híbrido: Postgres/Timescale + pgvector | Preço é dado numérico (SQL); vetor só para narrativas | Vetorial para tudo |
| 12/10 | "LLM interpreta, código calcula" | Evita alucinação numérica | LLM calculando |
| 12/10 | Z-score robusto (mediana + MAD) + calendário de feriados | Simples, defensável, resistente a outliers | Modelos de ML |
| 12/10 | LLM só em anomalias | Custo e ruído | LLM em cada ponto de dado |
| 12/10 | Adapters plugáveis (live \| replay) com HAR (`page.routeFromHAR`) | Demo reproduzível sem bater em site; testes determinísticos | Dependência de sites ao vivo |
| 12/10 | `docker-compose` | Suficiente para PoC | Kubernetes |
| 12/10 | Agente com 3 tools: SQL somente leitura (schema restrito), busca semântica de insights, cálculo determinístico de gap | Separar número de narrativa | Text-to-SQL irrestrito |
| 12/10 | Validador pós-resposta: números citados conferidos contra o SQL | Garantia contra alucinação | Confiar na resposta do LLM |

**Stack alvo:** TypeScript, Node, Playwright, Zod, Fastify (ou NestJS), Postgres + TimescaleDB, pgvector, Next.js (chat + painel), vitest, GitHub Actions.

## 5. Princípios anti-artificial

1. Só adicionar uma peça se resolve um problema que já aconteceu ou que a demo exige.
2. Cada componente precisa ter resposta para "por que isso aqui?" em entrevista.
3. Preferir o simples e defensável ao sofisticado e impressionante.
4. O valor está no pipeline + avaliação. A UI não pode consumir mais tempo que eles.
5. Sem framework de IA por moda: lógica do agente em TypeScript próprio; framework só onde ajuda de verdade.
6. Prometer apenas o que o projeto faz (README honesto).
7. **Código 100% em Português do Brasil (pt-BR):** Variáveis, funções, esquemas, comentários, tipos e testes devem ser sempre escritos em português brasileiro.


## 6. Regras de coleta e ética

- Só dados públicos; respeitar robots.txt e termos de uso; volume mínimo; delays com jitter; rate limiting.
- **Nunca** tentar burlar CAPTCHA ou proteção anti-bot. Se bloquear, trocar a fonte ou usar replay.
- Nenhum dado pessoal. Seção "Ética e conformidade" obrigatória no README.
- Aviso explícito: PoC independente, sem relação oficial com as empresas observadas.

## 7. Modelo de dados (rascunho)

- `quotes` (hypertable): `captured_at, source, praca, categoria, pickup_date, duracao_dias, lead_time_dias, preco_diaria, preco_total, disponivel, raw_ref`
- `insights`: `tipo, severidade, praca, categoria, periodo, metricas (jsonb), narrativa, embedding, status`
- `feedback`: avaliação e correção do analista por insight
- Tipos de evento: `price_spike`, `competitor_undercut`, `availability_drop`, `schema_drift`

## 8. Avaliação e qualidade (o diferencial de QA)

- ~30 perguntas douradas com resposta esperada, rodando no CI sobre fixtures HAR.
- Métricas: acurácia numérica, escolha correta de tool, taxa de recusa sem dado, fundamentação (cita insights reais).
- Teste de prompt injection (texto malicioso em campo coletado).
- Badge de resultado no README. **Registrar evolução na seção 12.**

## 9. Hipóteses NÃO verificadas (não tratar como fato)

- [ ] A Localiza usa Cypress (Arthur acha que sim). Busca em 12/10 não encontrou evidência; checar vagas e perfis de QAs de lá.
- [x] **[FATO 12/10]** A API da Localiza (`canaisdigitais-api.localiza.com`) é protegida por Akamai WAF (retorna 403 em headless). Decisão ética e técnica: adotado Padrão Adaptador Plugável com `AdaptadorReplay` (HAR/Fixtures) para CI e Evals determinísticos, sem tentar burlar WAF (ADR 0002).
- [ ] Qual concorrente é mais viável (Movida? Unidas?).
- [ ] Termos de uso de cada site permitem a coleta em volume baixo.
- [ ] Existe API pública/endpoint estável de cotação sem login.

## 10. Erros que não podem se repetir

- 12/10/2026 · Playwright timeout ao clicar em input com Angular Material MDC · Floating label intercepta pointer events no input · Usar `getByLabel()`, `click({ force: true })` ou focar antes de digitar.
- 12/10/2026 · `networkidle` trava em páginas com Datadog RUM / ThreatMetrix · Telemetria contínua nunca deixa a rede ociosa · Usar `domcontentloaded` + locators explícitos com timeout definido.

## 11. Roadmap e status

- [/] **Semana 1:** spike de viabilidade (concluído) · adapter de coleta (concluído) · gravação de HAR / fixtures (concluído) · schema Zod pt-BR (concluído) · Postgres (próximo)
- [ ] **Semana 2:** validação de qualidade · detecção de anomalias · testes unitários · geração de narrativas
- [ ] **Semana 3:** pgvector · agente com tools · validador de números · loop de feedback
- [ ] **Semana 4:** UI Next.js (chat + painel) · evals no CI · README · vídeo 60s · post LinkedIn

**Próximo passo:** Configurar `docker-compose.yml` com Postgres/TimescaleDB e criar a camada de persistência para armazenar as cotações coletadas.


## 12. Diário de métricas

| Data | Acurácia numérica | Tool correta | Recusa sem dado | Obs. |
|---|---|---|---|---|
| _(sem medições ainda)_ | | | | |

## 13. Perguntas prováveis de entrevista

- Por que não usar só banco vetorial? → Preço é dado numérico estruturado; vetor serve às narrativas.
- Como evita alucinação de números? → LLM não calcula; tools + validador pós-resposta.
- Por que z-score robusto e não ML? → Simples, explicável, resistente a outliers; suficiente para o problema.
- Como lida com mudança de layout/API? → Contratos Zod + alerta de schema drift.
- Como testa um agente de IA? → Golden questions, métricas por tipo de erro, prompt injection, CI.
- Como lida com a ética da coleta? → Dados públicos, volume mínimo, robots.txt, modo replay.

## 14. Divulgação (rascunhos a evoluir)

- **README:** problema → demo (GIF/vídeo 60s) → diagrama → decisões e trade-offs (ADRs) → métricas reais → ética.
- **Roteiro do vídeo (60s):** alerta no painel → pergunta no chat ("já aconteceu em outros feriados?") → resposta com números + validador → badge de CI verde.
- **Post LinkedIn:** _(a escrever)_

## 15. Estrutura do repositório (alvo)

```
fleetpulse/
├── apps/
│   ├── collector/     # Playwright + adapters (live | replay)
│   ├── api/           # Fastify: agente, tools, validador
│   └── web/           # Next.js: chat + painel
├── packages/
│   ├── schemas/       # Zod compartilhado
│   └── detection/     # z-score robusto, eventos
├── evals/             # golden questions + runner
├── fixtures/har/      # respostas gravadas
├── docs/adr/          # decisões e trade-offs
├── PROJECT_MEMORY.md
└── docker-compose.yml
```

## 16. Glossário

- **Praça:** local de retirada (ex.: aeroporto, centro).
- **Categoria / grupo:** classe do carro (econômico, SUV compacto, etc.).
- **Antecedência (lead time):** dias entre a cotação e a retirada.
- **Schema drift:** mudança no formato da resposta da fonte.

- **12/10/2026 (Sessão 1):** Escolhida a ideia FleetPulse AI; definidos pipeline, escopo do MVP, decisão por Playwright; criado este arquivo.
- **12/10/2026 (Sessão 2):** Inicialização do Git; configuração do monorepo com npm workspaces (`apps/coletor`, `pacotes/esquemas`); regra mandatória de código 100% em pt-BR (ADR 0001); execução do Spike Playwright da Localiza: descoberta da arquitetura Angular MDC, ThreatMetrix, Securiti e endpoint `canaisdigitais-api.localiza.com` bloqueado com 403 pelo Akamai WAF; formalização do ADR 0002 (Adaptador Replay com HAR/Fixtures vs Ao Vivo); implementação do `AdaptadorReplay` com validação Zod e 100% de cobertura nos testes unitários com Vitest.

