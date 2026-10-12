# 🎬 Roteiro de Demonstração em Vídeo (60 Segundos)
## FleetPulse AI: Observabilidade de Preços & QA de IA de Ponta a Ponta

> **Objetivo:** Demonstrar em 1 minuto o valor de negócio do FleetPulse AI, o diferencial técnico de SDET aplicado à IA ("LLM interpreta, código calcula") e o pipeline de CI 100% verde com evals automatizados.

---

### ⏱️ Cronograma Segundo a Segundo (StoryBoard)

| Janela de Tempo | Cena / Tela | Ação Visual | Narração Sugerida (Áudio / Voz) | Texto na Tela (Lower Third) |
|---|---|---|---|---|
| **00:00 - 00:10** | **Painel Principal** (`localhost:3000`) | O cursor passa pelos KPIs (162 cotações, Menor diária R$ 89.90, 5 Anomalias ativas). | *"Como analista de pricing de locadoras de veículos, monitorar centenas de variações de diárias da concorrência em planilhas gera reação tardia e perda de receita."* | 🚗 **FleetPulse AI**<br>Observabilidade de Preços para Locadoras |
| **00:10 - 00:25** | **Radar de Anomalias & Human-in-the-Loop** | Foco na tabela de anomalias. Destaque para o alerta vermelho: `CRÍTICA - pico_preco em aeroporto_confins (SUV)`. O usuário clica no botão "Confirmar Anomalia" de feedback humano. | *"O FleetPulse AI aplica estatística não-paramétrica imune a outliers para detectar saltos anômalos em tempo real, integrando feedback humano direto no PostgreSQL."* | 📊 **Z-Score Robusto & MAD**<br>Sem falsos alertas estatísticos |
| **00:25 - 00:45** | **Chat do Agente & Zero Alucinação** | O usuário abre o chat e envia: *"Qual o gap entre as diárias de 150 e 120 e histórico em Confins?"*. O agente responde instantaneamente: exibe a gaveta com as ferramentas (`calculo_gap_mercado` e `busca_semantica_insights`) e o selo verde: `AUDITORIA NUMÉRICA APROVADA: 0 ALUCINAÇÕES`. | *"Nosso agente utiliza 3 ferramentas especializadas em TypeScript. O LLM nunca faz contas aritméticas: as ferramentas calculam e o validador pós-resposta audita cada dígito citado."* | 🛡️ **Zero Alucinação Numérica**<br>"LLM interpreta, código calcula" |
| **00:45 - 00:55** | **Evals Automatizados no Terminal** | Transição rápida para o terminal executando `npm run evals`. O relatório exibe 30 perguntas com 100% de acurácia numérica e 100% de resistência a Prompt Injection em 2ms. | *"Garantia contínua de qualidade: uma suíte de evals automatizados no CI roda 30 Golden Questions com 100% de acurácia numérica e bloqueio total de injeções de prompt."* | 🧪 **Evals Automatizados (SDET)**<br>30 Golden Questions · 100% Aprovado |
| **00:55 - 01:00** | **Encerramento & Repositório** | Tela com o `README.md` no GitHub com o badge verde de CI e links para o código open-source. | *"FleetPulse AI: inteligência de dados, IA generativa auditada e engenharia de qualidade de software de ponta a ponta."* | 💻 **GitHub:** arthurperdigao/fleetpulse-ai<br>Código 100% em pt-BR |

---

### 💡 Dicas de Gravação
- **Resolução:** 1080p ou 4K, proporção 16:9.
- **Ferramentas Recomendadas:** OBS Studio ou Loom (para captura de tela e áudio limpo).
- **Trilha Sonora de Fundo:** Música instrumental sutil, estilo eletrônico corporativo minimalista em volume baixo (10-15%).
- **Cores do Cursor:** Usar destaque suave no ponteiro do mouse para guiar a atenção do recrutador.
