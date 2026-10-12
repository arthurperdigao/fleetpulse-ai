# 📱 Rascunho para Post no LinkedIn
## Posicionamento de Engenharia: SDET / QA Aplicado à IA Generativa

---

### Opção 1: Foco em Engenharia de Qualidade, Evals e "LLM Não Faz Conta" (Recomendada)

```markdown
Por que a maioria dos projetos de IA generativa em precificação falha em produção?

Porque colocam o LLM para fazer contas aritméticas. E LLMs são modelos probabilísticos de linguagem, não calculadoras. 

Se você pedir para um modelo tradicional analisar uma tabela de preços e calcular o desconto de uma locadora concorrente, há um risco real dele inventar números — o que em finanças e pricing significa prejuízo direto.

Para resolver esse problema de observabilidade de mercado no setor de locação de veículos (Localiza, Movida, Unidas no mercado de BH), construí o **FleetPulse AI** sob uma premissa arquitetural inegociável de SDET:

👉 **"LLM interpreta, código calcula."**

Em vez de usar frameworks por moda, estruturei um pipeline de engenharia em 7 etapas:

1️⃣ **Coleta Resiliente:** Playwright com adaptador dual (ao vivo ou replay via fixtures HAR), imune a bloqueios de WAF e 100% determinístico para CI.
2️⃣ **Contratos Estritos:** Schemas Zod em TypeScript (pt-BR) prevenindo schema drift.
3️⃣ **TimescaleDB & pgvector:** Hypertable para séries temporais e índice vetorial HNSW para recuperar memórias de anomalias passadas via similaridade de cosseno.
4️⃣ **Detecção Estatística Robusta:** Mediana e MAD com Z-score modificado (fator 1.4826), imune a outliers reais de mercado.
5️⃣ **Agente com 3 Ferramentas Especializadas:** 
   • Consulta SQL somente-leitura através do perfil restrito `leitor_agente` (bloqueio nativo de DDL/DML no Postgres contra injeção de prompt).
   • Busca semântica no banco vetorial.
   • Cálculo determinístico de gap e elasticidade tarifária.
6️⃣ **Auditoria Pós-Resposta de QA (Zero Alucinação):** Um validador pós-geração audita cada dígito da resposta contra as saídas das ferramentas. Se houver número não fundamentado, o sistema rejeita e aplica fallback determinístico.
7️⃣ **Evals Automatizados no CI (30 Golden Questions):** Benchmark automatizado no Vitest medindo acurácia numérica, escolha correta de ferramentas e resistência a prompt injection.

📊 **Resultados do Benchmark de Evals:**
• Acurácia Numérica Auditada: **100%** (Meta: >= 95%)
• Escolha Correta de Ferramentas: **100%** (Meta: >= 90%)
• Taxa de Recusa Sem Dado (Fora de Escopo): **100%**
• Imunidade contra Prompt Injection: **100%**
• 54 testes automatizados verdes no GitHub Actions 

Além disso, a interface em Next.js conta com um loop de **Human-in-the-Loop (HITL)** para analistas confirmarem ou corrigirem anomalias em tempo real.

O projeto é 100% open-source, construído em TypeScript e documentado com ADRs (Architecture Decision Records).

🔗 Confira o código, arquitetura e evals no GitHub: [link do repositório]

Gostaria de saber: como o seu time tem garantido a integridade numérica e evals contínuos em aplicações de IA generativa?

#EngenhariaDeSoftware #SDET #QA #InteligenciaArtificial #TypeScript #PostgreSQL #NextJS #TimescaleDB #QualityAssurance #AIQuality
```

---

### Opção 2: Foco em Arquitetura e Decisões de Trade-off (Mais Técnica)

```markdown
Não use banco vetorial para o que um banco relacional faz melhor (e vice-versa).

Ao projetar a arquitetura do **FleetPulse AI** — plataforma de observabilidade e inteligência de tarifas de locadoras de veículos —, a tentação de muitos seria jogar tudo em um banco vetorial ou passar planilhas para a janela de contexto de um LLM.

As decisões de engenharia foram diferentes:

1. **Preço é dado estruturado temporal:** Usamos PostgreSQL com a extensão **TimescaleDB** para agregações analíticas de alto desempenho (médias por praça, mínimas diárias e ordenação).
2. **Vetor serve às narrativas e contexto:** Usamos a extensão **pgvector** com índice HNSW para buscar anomalias passadas semelhantes ("quando um concorrente já baixou tarifas em feriados?").
3. **Defesa em Profundidade de Banco:** O Agente de IA roda consultas SQL limitadas estritamente a SELECT sob um usuário PostgreSQL restrito (`leitor_agente`). Mesmo se alguém tentar prompt injection com `DROP TABLE cotacoes;`, o banco recusa nativamente.
4. **Validação Matemática Pós-Resposta:** A IA nunca calcula. As ferramentas especializadas calculam, e uma suíte de validação criada com mentalidade SDET audita o texto gerado antes de exibir ao usuário.

Benchmark de qualidade (30 Golden Questions rodando no Vitest via CI):
✅ 100% de Acurácia Numérica (0 alucinações)
✅ 100% de Resistência a Injeções
✅ 54 Testes Automatizados verdes

Código limpo, monorepo em npm workspaces e documentação técnica completa.

Link do repositório no primeiro comentário! 👇

#SoftwareArchitecture #GenAI #SDET #QAEngineering #PostgreSQL #TypeScript #NextJS
```
