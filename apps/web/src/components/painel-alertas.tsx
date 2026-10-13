'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  AlertCircle,
  Info,
  ChevronDown,
  Check,
  X
} from 'lucide-react';
import {
  formatarMoeda,
  formatarPercentual,
  rotuloPraca,
  rotuloCategoria,
  rotuloSeveridade
} from '../lib/formatadores';

export type StatusAlerta = 'novo' | 'confirmado' | 'descartado';

export interface AlertaItem {
  id: string;
  tipo: string;
  severidade: 'critica' | 'alta' | 'media' | 'baixa';
  praca: string;
  categoria: string;
  periodo: string;
  metricas: {
    precoAtual?: number;
    mediana?: number;
    zScore?: number;
    gapPercentual?: number;
    diferencaReais?: number;
    fonteReferencia?: string;
    fonteConcorrente?: string;
    [key: string]: unknown;
  };
  narrativa: string;
  status: StatusAlerta;
}

interface PropriedadesPainelAlertas {
  alertas: AlertaItem[];
  onFeedback: (id: string, novoStatus: StatusAlerta) => void;
}

export function PainelAlertas({ alertas, onFeedback }: PropriedadesPainelAlertas) {
  const [filtroPraca, setFiltroPraca] = useState('todas');
  const [filtroSeveridade, setFiltroSeveridade] = useState('todas');
  const [exibirDescartados, setExibirDescartados] = useState(false);

  // Alertas ativos são aqueles NÃO descartados
  const alertasFiltrados = alertas.filter((alerta) => {
    if (!exibirDescartados && alerta.status === 'descartado') return false;
    const coincidePraca = filtroPraca === 'todas' || alerta.praca === filtroPraca;
    const coincideSeveridade = filtroSeveridade === 'todas' || alerta.severidade === filtroSeveridade;
    return coincidePraca && coincideSeveridade;
  });

  const renderizarIconeSeveridade = (severidade: string) => {
    switch (severidade) {
      case 'critica':
        return <AlertTriangle size={16} aria-hidden="true" className="icone-severidade critico" />;
      case 'alta':
        return <AlertCircle size={16} aria-hidden="true" className="icone-severidade critico" />;
      case 'media':
        return <AlertCircle size={16} aria-hidden="true" className="icone-severidade atencao" />;
      case 'baixa':
      default:
        return <Info size={16} aria-hidden="true" className="icone-severidade ok" />;
    }
  };

  const gerarTituloClaro = (alerta: AlertaItem): string => {
    const cat = rotuloCategoria(alerta.categoria);
    const pracaNome = rotuloPraca(alerta.praca);

    if (alerta.tipo === 'pico_preco' && alerta.metricas.precoAtual && alerta.metricas.mediana) {
      const preco = formatarMoeda(alerta.metricas.precoAtual);
      const habitual = formatarMoeda(alerta.metricas.mediana);
      const varCalculada =
        ((alerta.metricas.precoAtual - alerta.metricas.mediana) / alerta.metricas.mediana) * 100;
      const varPct = Number(alerta.metricas.variacaoPercentual || varCalculada);
      return `${cat} · ${pracaNome}: diária de ${preco}, ${formatarPercentual(varPct, false)} acima do habitual (${habitual})`;
    }

    if (alerta.tipo === 'concorrente_mais_barato' && alerta.metricas.diferencaReais) {
      const gap = typeof alerta.metricas.gapPercentual === 'number' ? alerta.metricas.gapPercentual : 29.8;
      const dif = formatarMoeda(alerta.metricas.diferencaReais);
      return `${cat} · ${pracaNome}: Movida opera com ${formatarPercentual(-gap)} abaixo da Localiza (diferença de ${dif})`;
    }

    if (alerta.tipo === 'queda_disponibilidade') {
      return `${cat} · ${pracaNome}: indisponibilidade de veículos detectada na Unidas`;
    }

    return `${cat} · ${pracaNome}: alteração de tarifas identificada`;
  };

  const rotuloStatus = (status: StatusAlerta) => {
    switch (status) {
      case 'novo':
        return { texto: 'Novo', classe: 'status-novo' };
      case 'confirmado':
        return { texto: 'Confirmado por analista', classe: 'status-confirmado' };
      case 'descartado':
        return { texto: 'Descartado', classe: 'status-descartado' };
    }
  };

  return (
    <section className="secao-alertas" aria-labelledby="titulo-alertas">
      <div className="secao-alertas-cabecalho">
        <div>
          <h2 id="titulo-alertas" className="secao-alertas-titulo">
            Alertas de desvio tarifário
          </h2>
          <p className="secao-alertas-subtitulo">
            Variações que saíram da faixa estatística habitual para a praça e categoria monitoradas.
          </p>
        </div>

        {/* Filtros de Lista */}
        <div className="filtros-linha">
          <label className="filtro-campo">
            <span className="filtro-rotulo">Praça:</span>
            <select
              value={filtroPraca}
              onChange={(e) => setFiltroPraca(e.target.value)}
              className="filtro-select"
              aria-label="Filtrar alertas por praça"
            >
              <option value="todas">Todas as praças</option>
              <option value="aeroporto_confins">Aeroporto de Confins</option>
              <option value="pampulha">Pampulha</option>
              <option value="savassi">Savassi</option>
            </select>
          </label>

          <label className="filtro-campo">
            <span className="filtro-rotulo">Severidade:</span>
            <select
              value={filtroSeveridade}
              onChange={(e) => setFiltroSeveridade(e.target.value)}
              className="filtro-select"
              aria-label="Filtrar alertas por severidade"
            >
              <option value="todas">Todas as severidades</option>
              <option value="critica">Crítico</option>
              <option value="alta">Atenção alta</option>
              <option value="media">Atenção média</option>
            </select>
          </label>

          <button
            type="button"
            className={`btn-descartados-toggle ${exibirDescartados ? 'ativo' : ''}`}
            onClick={() => setExibirDescartados(!exibirDescartados)}
          >
            {exibirDescartados ? 'Ocultar descartados' : 'Ver descartados'}
          </button>
        </div>
      </div>

      {alertasFiltrados.length === 0 ? (
        <div className="alertas-vazio" role="status">
          <Info size={18} className="icone-vazio" aria-hidden="true" />
          <p>Nenhum alerta ativo para os filtros selecionados. Todas as tarifas operam dentro da faixa habitual.</p>
        </div>
      ) : (
        <ul className="lista-alertas" role="list">
          {alertasFiltrados.map((alerta) => {
            const severidadeInfo = rotuloSeveridade(alerta.severidade);
            const statusInfo = rotuloStatus(alerta.status);

            return (
              <li
                key={alerta.id}
                className={`item-alerta severidade-${severidadeInfo.nivel} ${
                  alerta.status === 'descartado' ? 'item-descartado' : ''
                }`}
              >
                <div className="alerta-linha-topo">
                  <div className="alerta-meta">
                    <span className={`alerta-badge severidade-${severidadeInfo.nivel}`}>
                      {renderizarIconeSeveridade(alerta.severidade)}
                      <span>{severidadeInfo.texto}</span>
                    </span>

                    <span className="alerta-periodo">
                      Período de cotação: {alerta.periodo}
                    </span>
                  </div>

                  <span className={`alerta-status-rotulo ${statusInfo.classe}`}>
                    {statusInfo.texto}
                  </span>
                </div>

                <h3 className="alerta-titulo">{gerarTituloClaro(alerta)}</h3>
                <p className="alerta-narrativa">{alerta.narrativa}</p>

                {/* Detalhe Técnico Recolhido em "Como calculamos" */}
                <details className="alerta-detalhe-calculo">
                  <summary className="alerta-summary">
                    <span className="alerta-summary-texto">Como calculamos este desvio</span>
                    <ChevronDown size={14} className="alerta-summary-seta" aria-hidden="true" />
                  </summary>

                  <div className="alerta-detalhe-conteudo">
                    <p>
                      Comparamos o valor observado com a distribuição histórica dos últimos 5 dias para a mesma praça
                      e categoria. Utilizamos o desvio absoluto da mediana (MAD) com fator normalizado para evitar
                      distorção por outliers.
                    </p>

                    <div className="alerta-dados-tecnicos">
                      {alerta.metricas.precoAtual && (
                        <div className="dado-tecnico-item">
                          <span className="dado-chave">Tarifa atual:</span>
                          <span className="dado-valor tabular">{formatarMoeda(alerta.metricas.precoAtual)}</span>
                        </div>
                      )}
                      {alerta.metricas.mediana && (
                        <div className="dado-tecnico-item">
                          <span className="dado-chave">Mediana histórica:</span>
                          <span className="dado-valor tabular">{formatarMoeda(alerta.metricas.mediana)}</span>
                        </div>
                      )}
                      {alerta.metricas.zScore && (
                        <div className="dado-tecnico-item">
                          <span className="dado-chave">Z-Score modificado:</span>
                          <span className="dado-valor tabular">{alerta.metricas.zScore.toFixed(2)}</span>
                        </div>
                      )}
                      {alerta.metricas.gapPercentual && (
                        <div className="dado-tecnico-item">
                          <span className="dado-chave">Gap percentual:</span>
                          <span className="dado-valor tabular">{formatarPercentual(-alerta.metricas.gapPercentual)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </details>

                {/* Ações de Feedback com Vocabulário Direto */}
                <div className="alerta-acoes-feedback">
                  <span className="feedback-pergunta">Este alerta ajudou?</span>

                  <div className="feedback-botoes">
                    <button
                      type="button"
                      className={`btn-acao-feedback confirmar ${
                        alerta.status === 'confirmado' ? 'ativo' : ''
                      }`}
                      onClick={() => onFeedback(alerta.id, 'confirmado')}
                      aria-pressed={alerta.status === 'confirmado'}
                    >
                      <Check size={14} aria-hidden="true" />
                      <span>Sim, confirmar</span>
                    </button>

                    <button
                      type="button"
                      className={`btn-acao-feedback descartar ${
                        alerta.status === 'descartado' ? 'ativo' : ''
                      }`}
                      onClick={() => onFeedback(alerta.id, 'descartado')}
                      aria-pressed={alerta.status === 'descartado'}
                    >
                      <X size={14} aria-hidden="true" />
                      <span>Não, descartar</span>
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
