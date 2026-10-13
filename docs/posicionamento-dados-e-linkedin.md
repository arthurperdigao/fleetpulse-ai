# 📌 Guia de Posicionamento, Dados e Estratégia de Conteúdo (LinkedIn & Entrevistas)

> **Documento de Referência Estratégica · FleetPulse AI**  
> *Registrado em 13/10/2026 para suporte na criação de posts no LinkedIn, roteiros de demonstração e respostas em entrevistas técnicas.*

---

## 1. Origem Exata dos Dados do Projeto

Para responder com 100% de segurança a qualquer pessoa ou recrutador:

* **Os dados NÃO são oficiais:** Não existe convênio, parceria comercial ou API privada homologada com a Localiza, Movida ou Unidas.
* **Os dados NÃO são vazados nem de terceiros:** Você não utilizou dados vazados, planilhas de terceiros ou informações confidenciais.
* **De onde vieram os dados:**
  1. **Arquivo HAR (`fixtures/har/localiza-spike.har`):** Foi gerado no seu próprio computador pelo Playwright (`spike-localiza.ts`), gravando o tráfego de rede público da página inicial da Localiza (`localiza.com`). É apenas uma gravação legítima do navegador (HTML, fontes, scripts e telemetria).
  2. **Cotações no Banco de Dados (`cotacoes`):** Foram geradas pelo script de carga e semeadura do projeto (`apps/coletor/src/executavel-carga.ts`, executado via `npm run semear`). Os valores foram baseados nas faixas reais de preços públicos de mercado da Grande BH (ex: Econômico ~R$ 125-129, Intermediário ~R$ 160-169, SUV ~R$ 190-239), com anomalias induzidas de propósito (ex: SUV a R$ 299) para testar os motores de detecção estatística e os Evals de IA.

---

## 2. Por que o Projeto NÃO Atualiza Sozinho ao Vivo (e por que isso é bom)

No estado atual, o projeto opera sobre um **dataset fixo de referência (Modo Replay / Fixtures)**.

### Por que não fazemos scraping contínuo ao vivo?
1. **Proteção Perimetral (Akamai WAF):** Portais de locação de grande porte possuem defesas robustas (ThreatMetrix, Securiti.ai, Akamai) que bloqueiam requisições de navegadores headless (HTTP 403 Forbidden).
2. **Decisão Ética e de Compliance (ADR 0002):** Engenheiros seniores não tentam burlar CAPTCHAs nem utilizam técnicas invasivas de evasão que violem Termos de Uso.
3. **Determinismo em Testes e CI/CD:** Para validar 30 Golden Questions com 100% de acurácia no GitHub Actions, os testes não podem depender de oscilações da internet externa (*anti-padrão de testes frágeis / flaky tests*).

### Por que NÃO colocar um cron a cada 5 minutos?
* **Banimento Imediato de IP:** 288 execuções diárias disparam alertas imediatos de bot no WAF da Akamai, queimando o IP.
* **Desconexão com o Modelo de Negócio de Locadoras:** Aluguel de veículos não é bolsa de valores. Locadoras atualizam tarifas em lotes de Revenue Management (RMS) geralmente **1 a 2 vezes ao dia** (madrugada/tarde). Scraping a cada 5 minutos gera 99,9% de dados redundantes e consumo inútil de banda.
* **Risco à Contratação:** A engenharia da Localiza gasta milhões combatendo robôs invasivos. Dizer que você fez um bot batendo neles a cada 5 minutos passa imagem de amadorismo; dizer que você utilizou **fixtures HAR e respeitou as defesas da empresa** demonstra maturidade arquitetural e ética.

---

## 3. Matriz de Vocabulário para o LinkedIn

| ❌ Termos que Descredibilizam (Evitar) | ✅ Termos que Valorizam a Senioridade (Usar) |
|---|---|
| "Dados oficiais da Localiza" | "PoC com dados públicos de referência e fixtures determinísticas" |
| "Scraper que monitora o site ao vivo" | "Pipeline de observabilidade de preços com padrão Adapter (live / replay)" |
| "A IA calcula a melhor tarifa" | "Arquitetura *LLM interpreta, código calcula*: cálculos determinísticos auditados" |
| "Descobri os preços da concorrência" | "Detecção estatística de anomalias com Z-score modificado / MAD no TimescaleDB" |
| "Robô que raspa preços a cada 5 minutos" | "Gravações HAR e suíte de Evals contínuos no CI (GitHub Actions)" |

---

## 4. O que Destacar no Post e na Entrevista (O Verdadeiro Ouro)

O valor deste projeto está na **Engenharia de Qualidade Aplicada à IA (SDET)**:

1. **Garantia de Zero Alucinação Numérica:** LLMs são modelos de linguagem probabilísticos, não calculadoras. O FleetPulse AI calcula com código determinístico e audita cada número gerado pelo LLM através de um validador pós-resposta.
2. **Arquitetura de Dados Híbrida:** 
   * **TimescaleDB:** Agregações analíticas temporais em milissegundos para preços estruturados.
   * **pgvector + HNSW:** Embeddings de 1536 dimensões para memória semântica de anomalias passadas.
3. **Defesa em Profundidade:** Consultas do agente de IA restritas ao usuário de banco `leitor_agente` (apenas `SELECT`), imune a injeções DDL/DML.
4. **Evals de IA no CI:** 30 Golden Questions rodando no Vitest com 100% de acurácia numérica, escolha de ferramentas e resistência a prompt injection.
5. **Human-in-the-Loop (HITL):** Interface Next.js permitindo que analistas revisem, confirmem ou rejeitem anomalias, refinando a base continuamente.

---

## 5. Respostas Rápidas para Perguntas Desafiadoras

* **"Esses dados são em tempo real?"**  
  *"Não, esta PoC opera sobre fixtures de referência gravadas em formato HAR. Isso foi uma decisão arquitetural intencional (ADR 0002) para respeitar as defesas de borda (WAF) dos provedores e permitir que nossa suíte de 30 Golden Questions rode de forma 100% determinística no CI."*

* **"A Localiza autorizou essa coleta?"**  
  *"O FleetPulse AI é uma prova de conceito acadêmica e de engenharia de software independente. O sistema trabalha exclusivamente com estruturas públicas de tarifas para fins de demonstração, sem vínculo institucional ou acesso a dados confidenciais."*

* **"Por que você não colocou para rodar a cada 5 minutos em produção?"**  
  *"Porque no setor de mobilidade e locação (RAC), tarifas não oscilam em milissegundos como na bolsa; as revisões de precificação operam em janelas diárias. Além disso, bombardeios frequentes violam boas práticas de tráfego web e acionam WAFs. Priorizamos eficiência e respeito aos servidores de terceiros."*
