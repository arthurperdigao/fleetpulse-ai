'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ExternalLink } from 'lucide-react';

export default function PaginaComoFunciona() {
  return (
    <div className="conteiner-app">
      {/* Botão de Retorno */}
      <nav style={{ marginBottom: '20px' }}>
        <Link href="/" className="link-como-funciona">
          <ArrowLeft size={14} aria-hidden="true" />
          <span>Voltar ao painel principal</span>
        </Link>
      </nav>

      <header className="cabecalho-principal">
        <h1 className="produto-titulo">Como funciona o FleetPulse AI</h1>
        <p className="produto-subtitulo">
          Arquitetura técnica, decisões de engenharia, métricas de avaliação e limites do projeto.
        </p>
      </header>

      {/* 1. Fluxo em 4 Passos */}
      <section className="bloco-resumo" aria-labelledby="titulo-fluxo">
        <h2 id="titulo-fluxo" className="grafico-titulo" style={{ marginBottom: '16px' }}>
          Fluxo do pipeline em 4 etapas
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '16px' }}>
          <div style={{ padding: '14px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--cor-superficie-subtil)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cor-acento)', marginBottom: '4px' }}>
              1. Coleta e Normalização
            </div>
            <p style={{ fontSize: '13px', color: 'var(--cor-texto-secundario)', lineHeight: 1.5 }}>
              Captura cotações públicas de tarifas em Belo Horizonte via adaptadores determinísticos (Playwright e modo replay de arquivos HAR para testes).
            </p>
          </div>

          <div style={{ padding: '14px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--cor-superficie-subtil)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cor-acento)', marginBottom: '4px' }}>
              2. Validação e Persistência
            </div>
            <p style={{ fontSize: '13px', color: 'var(--cor-texto-secundario)', lineHeight: 1.5 }}>
              Esquemas estritos em Zod (pt-BR) impedem deriva estrutural. Os dados são armazenados no PostgreSQL com a extensão TimescaleDB para séries temporais.
            </p>
          </div>

          <div style={{ padding: '14px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--cor-superficie-subtil)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cor-acento)', marginBottom: '4px' }}>
              3. Detecção Estatística
            </div>
            <p style={{ fontSize: '13px', color: 'var(--cor-texto-secundario)', lineHeight: 1.5 }}>
              Calcula mediana e desvio absoluto da mediana (MAD) com Z-score modificado (fator 1,4826). Identifica picos atípicos e gaps comerciais sem ser enganado por outliers.
            </p>
          </div>

          <div style={{ padding: '14px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)', backgroundColor: 'var(--cor-superficie-subtil)' }}>
            <div style={{ fontWeight: 600, fontSize: '13px', color: 'var(--cor-acento)', marginBottom: '4px' }}>
              4. Explicação e Perguntas
            </div>
            <p style={{ fontSize: '13px', color: 'var(--cor-texto-secundario)', lineHeight: 1.5 }}>
              O modelo de linguagem sintetiza narrativas explicativas e o agente responde perguntas. Um validador pós-resposta audita cada dígito citado contra o banco.
            </p>
          </div>
        </div>
      </section>

      {/* 2. Decisões de Arquitetura */}
      <section className="bloco-resumo" aria-labelledby="titulo-decisoes">
        <h2 id="titulo-decisoes" className="grafico-titulo" style={{ marginBottom: '12px' }}>
          Decisões de arquitetura
        </h2>

        <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <li style={{ fontSize: '13px', color: 'var(--cor-texto)', lineHeight: 1.6 }}>
            <strong>«LLM interpreta, código calcula»:</strong> O modelo de linguagem nunca realiza operações aritméticas ou cálculos de diferença. As contas são feitas por funções determinísticas em TypeScript e passadas como contexto auditado.
          </li>
          <li style={{ fontSize: '13px', color: 'var(--cor-texto)', lineHeight: 1.6 }}>
            <strong>Validador pós-resposta de integridade:</strong> Toda resposta que cita valores financeiros ou percentuais é inspecionada. Se o modelo inventar qualquer número ausente nas ferramentas, a resposta é reprovada e substituída por fallback determinístico.
          </li>
          <li style={{ fontSize: '13px', color: 'var(--cor-texto)', lineHeight: 1.6 }}>
            <strong>Defesa em profundidade no banco de dados:</strong> O agente executa consultas através do perfil restrito <code>leitor_agente</code> (permissão exclusiva de SELECT). Comandos como <code>DROP TABLE</code> ou injeções DDL/DML são bloqueados nativamente pelo PostgreSQL.
          </li>
          <li style={{ fontSize: '13px', color: 'var(--cor-texto)', lineHeight: 1.6 }}>
            <strong>Índice vetorial HNSW para memória de anomalias:</strong> Embeddings de 1536 dimensões no <code>pgvector</code> permitem recuperar eventos históricos semelhantes através de similaridade de cosseno.
          </li>
          <li style={{ fontSize: '13px', color: 'var(--cor-texto)', lineHeight: 1.6 }}>
            <strong>Monorepo em português do Brasil:</strong> Variáveis, funções, contratos e testes foram padronizados 100% em pt-BR (ADR 0001) para manter coerência semântica com o domínio de negócio local.
          </li>
        </ul>
      </section>

      {/* 3. Resultados Reais da Suíte de Avaliação (Evals) */}
      <section className="bloco-resumo" aria-labelledby="titulo-evals">
        <h2 id="titulo-evals" className="grafico-titulo" style={{ marginBottom: '8px' }}>
          Resultados da suíte de avaliação (Evals automatizados)
        </h2>
        <p style={{ fontSize: '13px', color: 'var(--cor-texto-secundario)', marginBottom: '16px' }}>
          Benchmark contínuo com 30 perguntas douradas (Golden Questions) executadas no Vitest (<code>npm run evals</code>) cobrindo consultas SQL, busca semântica, cálculo de gap e resistência a ataques de injeção.
        </p>

        <div style={{ overflowX: 'auto', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: 'var(--cor-superficie-subtil)', textAlign: 'left', borderBottom: '1px solid var(--cor-borda)' }}>
                <th style={{ padding: '8px 12px' }}>Métrica de Qualidade</th>
                <th style={{ padding: '8px 12px' }}>Meta</th>
                <th style={{ padding: '8px 12px' }}>Resultado Aferido</th>
                <th style={{ padding: '8px 12px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr style={{ borderBottom: '1px solid var(--cor-borda)' }}>
                <td style={{ padding: '8px 12px' }}>Acurácia numérica pós-resposta (Zero alucinação)</td>
                <td style={{ padding: '8px 12px' }} className="tabular">≥ 95%</td>
                <td style={{ padding: '8px 12px', fontWeight: 600 }} className="tabular">100% (30 de 30)</td>
                <td style={{ padding: '8px 12px', color: 'var(--cor-ok)' }}>Aprovado</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cor-borda)' }}>
                <td style={{ padding: '8px 12px' }}>Escolha correta de ferramentas</td>
                <td style={{ padding: '8px 12px' }} className="tabular">≥ 90%</td>
                <td style={{ padding: '8px 12px', fontWeight: 600 }} className="tabular">100% (30 de 30)</td>
                <td style={{ padding: '8px 12px', color: 'var(--cor-ok)' }}>Aprovado</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cor-borda)' }}>
                <td style={{ padding: '8px 12px' }}>Recusa de perguntas fora de escopo (sem dados)</td>
                <td style={{ padding: '8px 12px' }} className="tabular">100%</td>
                <td style={{ padding: '8px 12px', fontWeight: 600 }} className="tabular">100% (5 de 5)</td>
                <td style={{ padding: '8px 12px', color: 'var(--cor-ok)' }}>Aprovado</td>
              </tr>
              <tr style={{ borderBottom: '1px solid var(--cor-borda)' }}>
                <td style={{ padding: '8px 12px' }}>Resistência a Prompt Injection e mutações DDL/DML</td>
                <td style={{ padding: '8px 12px' }} className="tabular">100%</td>
                <td style={{ padding: '8px 12px', fontWeight: 600 }} className="tabular">100% (5 de 5)</td>
                <td style={{ padding: '8px 12px', color: 'var(--cor-ok)' }}>Aprovado</td>
              </tr>
              <tr>
                <td style={{ padding: '8px 12px' }}>Latência média por pergunta avaliada</td>
                <td style={{ padding: '8px 12px' }} className="tabular">&lt; 500 ms</td>
                <td style={{ padding: '8px 12px', fontWeight: 600 }} className="tabular">3 ms (determinístico)</td>
                <td style={{ padding: '8px 12px', color: 'var(--cor-ok)' }}>Aprovado</td>
              </tr>
            </tbody>
          </table>
        </div>

        <p style={{ fontSize: '12px', color: 'var(--cor-texto-mutado)', marginTop: '8px' }}>
          Total de 54 testes automatizados em todo o repositório executados e aprovados via CI.
        </p>
      </section>

      {/* 4. Limites do Projeto e Ética */}
      <section className="bloco-resumo" aria-labelledby="titulo-limites">
        <h2 id="titulo-limites" className="grafico-titulo" style={{ marginBottom: '12px' }}>
          Limites do projeto e ética de coleta
        </h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '13px', color: 'var(--cor-texto-secundario)', lineHeight: 1.6 }}>
          <p>
            <strong>Escopo geográfico e temporal:</strong> Esta Prova de Conceito (PoC) restringe-se exclusivamente a tarifas de locação na Região Metropolitana de Belo Horizonte (Confins, Pampulha e Savassi) para três grupos de veículos (Econômico, Sedan e SUV).
          </p>
          <p>
            <strong>Dados públicos e modo replay:</strong> Não realizamos tentativas de quebra forçada de proteções de borda (WAF). Para garantir reprodutibilidade nos testes contínuos sem sobrecarregar servidores de terceiros, utilizamos gravações legítimas em formato HAR capturadas previamente.
          </p>
          <p>
            <strong>Isenção de vínculo:</strong> O FleetPulse AI é um projeto acadêmico e de portfólio de engenharia independente, sem qualquer afiliação comercial ou institucional com a Localiza Rent a Car S.A., Movida Locação de Veículos S.A. ou Unidas Locadora.
          </p>
        </div>
      </section>

      {/* 5. Detalhes de Infraestrutura e Código */}
      <section className="bloco-resumo" aria-labelledby="titulo-infra">
        <h2 id="titulo-infra" className="grafico-titulo" style={{ marginBottom: '12px' }}>
          Infraestrutura e tecnologias
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px', fontSize: '13px' }}>
          <div style={{ padding: '10px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)' }}>
            <span style={{ color: 'var(--cor-texto-mutado)', display: 'block', fontSize: '11px' }}>Banco Relacional & Séries Temporais</span>
            <strong>PostgreSQL 16 + TimescaleDB</strong>
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)' }}>
            <span style={{ color: 'var(--cor-texto-mutado)', display: 'block', fontSize: '11px' }}>Memória Semântica</span>
            <strong>pgvector com índice HNSW</strong>
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)' }}>
            <span style={{ color: 'var(--cor-texto-mutado)', display: 'block', fontSize: '11px' }}>Servidor da API</span>
            <strong>Fastify 5 (TypeScript nativo)</strong>
          </div>
          <div style={{ padding: '10px', border: '1px solid var(--cor-borda)', borderRadius: 'var(--raio-sm)' }}>
            <span style={{ color: 'var(--cor-texto-mutado)', display: 'block', fontSize: '11px' }}>Interface Web</span>
            <strong>Next.js 16 (Vanilla CSS sóbrio)</strong>
          </div>
        </div>

        <div style={{ marginTop: '16px', display: 'flex', gap: '16px' }}>
          <a
            href="https://github.com/arthurperdigao/fleetpulse-ai"
            target="_blank"
            rel="noopener noreferrer"
            className="link-como-funciona"
          >
            <span>Ver repositório completo no GitHub</span>
            <ExternalLink size={13} aria-hidden="true" />
          </a>
        </div>
      </section>
    </div>
  );
}
