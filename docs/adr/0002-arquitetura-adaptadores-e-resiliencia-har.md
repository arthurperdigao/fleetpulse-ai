# ADR 0002: Arquitetura de Adaptadores Plugáveis e Resiliência via Replay HAR

## Status
Aprovado (12/10/2026)

## Contexto
Durante a execução do **Spike do Dia 1**, inspecionamos o portal público da Localiza (`localiza.com/brasil/pt-br`) via Playwright para avaliar a interceptação de cotações em JSON.

### Constatações Técnicas do Spike
1. **Stack do Portal:** Frontend em Angular SPA (Angular Material MDC) com chamadas para a API de canais digitais (`https://canaisdigitais-api.localiza.com/sitelocaliza-api-netcore/v1/`).
2. **Camada de Proteção de Borda:** O portal implementa ThreatMetrix (LexisNexis), Securiti.ai e Akamai WAF.
3. **Comportamento em Coleta Automatizada:** Requisições automatizadas disparadas por navegadores headless recebem **HTTP 403 Forbidden ("Access Denied")** da proteção perimetral do WAF.

### Princípios Éticos e de QA
Conforme a Seção 6 do [PROJECT_MEMORY.md](../../PROJECT_MEMORY.md), assumimos o compromisso explícito de:
- **Nunca tentar burlar CAPTCHA ou proteções anti-bot.** Tentativas de evasão violam termos de uso, degradam a ética profissional do engenheiro e geram testes instáveis e frágeis.
- O objetivo deste projeto é demonstrar excelência em **Arquitetura de Qualidade de Software, Observabilidade de Preços e IA Confiável**, e não construir um scraper predatório.

## Decisão
Implementar o **Padrão Adaptador (Adapter Pattern)** com alternância configurável entre dois modos de execução:

1. **Modo Replay (`AdaptadorReplayHar`):**
   - Utiliza `page.routeFromHAR` do Playwright para servir payloads capturados e higienizados.
   - Fornece execuções 100% determinísticas, ultra-rápidas e com zero dependência de conexão de rede ou variações externas.
   - É a base oficial para os **Evals de CI** (~30 Golden Questions) e pipelines de testes automatizados.

2. **Modo Ao Vivo (`AdaptadorLocalizaAoVivo`):**
   - Encapsula a navegação real e detecção de drift de contrato.
   - Opera com delays humanizados (jitter) e respeito a limites de taxa.
   - Quando encontra bloqueio ou erro 403, faz fallback suave informando o status de observabilidade sem quebrar o pipeline.

## Consequências
### Positivas
- Testes de regressão e evals de IA rodam em segundos no GitHub Actions sem falsos-positivos.
- Demos ao vivo funcionam perfeitamente mesmo em ambientes offline ou protegidos.
- Postura técnica madura para apresentar à liderança de engenharia da Localiza.

### Conformidade
- Todo o código, contratos e adaptadores seguem a padronização 100% em Português do Brasil estabelecida no [ADR 0001](0001-padronizacao-idioma-e-principios-sdet.md).
