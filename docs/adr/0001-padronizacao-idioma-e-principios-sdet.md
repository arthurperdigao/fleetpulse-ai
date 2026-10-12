# ADR 0001: Padronização em Português do Brasil e Posicionamento SDET

## Status
Aprovado (12/10/2026)

## Contexto
O **FleetPulse AI** é um projeto concebido por Arthur Perdigão (SDET / Arquiteto de QA) com objetivo explícito de atrair o interesse técnico e demonstrar competências sênior para times de Engenharia de Qualidade, SDET, Plataforma e Inteligência Artificial da **Localiza** (sediada em Belo Horizonte).

Para garantir alinhamento total com a cultura de engenharia, clareza semântica do domínio de negócio (locação de veículos no Brasil, grupos de carros, diárias, praças de BH) e evitar ambiguidades conceituais:
1. Todo o código-fonte (variáveis, funções, esquemas Zod, comentários, tipos TypeScript, asserções e testes) deve ser **100% em Português do Brasil (pt-BR)**.
2. A terminologia adotada reflete a linguagem de domínio real do setor de mobilidade e locação nacional (ex.: *praça*, *agência*, *grupo*, *diária*, *antecedência*, *mudança de esquema*).

## Decisão
- Fica estabelecido como regra inegociável que qualquer novo módulo, arquivo, teste, esquema ou documentação interna utilize estritamente o Português do Brasil.
- O pipeline segue a premissa de arquitetura de qualidade: **"LLM interpreta, código calcula"**, assegurando zero alucinação numérica através de contratos estritos e testes determinísticos.

## Consequências
### Positivas
- Comunicação direta e empática com recrutadores e líderes técnicos de Belo Horizonte/Localiza.
- Semântica de negócio rica e expressiva, eliminando más traduções (ex.: evitar termos genéricos em inglês que não refletem a operação de locação no Brasil).
- Código legível como especificação viva de QA e engenharia.

### Mitigações
- Para bibliotecas externas ou frameworks que exigem termos padrão (ex.: hooks de lifecycle, métodos nativos de Node.js ou Playwright), os wrappers e contratos da aplicação traduzem e encapsulam a interface em pt-BR.
