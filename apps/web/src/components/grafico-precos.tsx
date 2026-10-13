'use client';

import React, { useState } from 'react';
import { formatarMoeda, rotuloPraca, rotuloCategoria } from '../lib/formatadores';

export interface PontoCotacao {
  data: string; // "10/10", "11/10", etc.
  localiza: number;
  movida: number;
  unidas?: number;
  valorHabitualMin: number;
  valorHabitualMax: number;
  anomalia?: {
    fonte: 'localiza' | 'movida' | 'unidas';
    valor: number;
    variacao: number;
    motivo: string;
  };
}

// Séries temporais realistas dos dados de replay em Belo Horizonte
const DADOS_GRAFICO: Record<string, Record<string, PontoCotacao[]>> = {
  aeroporto_confins: {
    economico: [
      { data: '08/10', localiza: 122, movida: 118, unidas: 120, valorHabitualMin: 115, valorHabitualMax: 130 },
      { data: '09/10', localiza: 125, movida: 115, unidas: 122, valorHabitualMin: 115, valorHabitualMax: 130 },
      { data: '10/10', localiza: 128, movida: 112, unidas: 125, valorHabitualMin: 115, valorHabitualMax: 130 },
      { data: '11/10', localiza: 130, movida: 108, unidas: 124, valorHabitualMin: 115, valorHabitualMax: 130 },
      {
        data: '12/10',
        localiza: 195,
        movida: 89.9,
        unidas: 126,
        valorHabitualMin: 115,
        valorHabitualMax: 130,
        anomalia: {
          fonte: 'localiza',
          valor: 195,
          variacao: 62.5,
          motivo: '62,5% acima do habitual'
        }
      }
    ],
    suv: [
      { data: '08/10', localiza: 185, movida: 180, unidas: 182, valorHabitualMin: 170, valorHabitualMax: 200 },
      { data: '09/10', localiza: 190, movida: 182, unidas: 185, valorHabitualMin: 170, valorHabitualMax: 200 },
      { data: '10/10', localiza: 195, movida: 188, unidas: 190, valorHabitualMin: 170, valorHabitualMax: 200 },
      { data: '11/10', localiza: 210, movida: 195, unidas: 192, valorHabitualMin: 170, valorHabitualMax: 200 },
      {
        data: '12/10',
        localiza: 299,
        movida: 198,
        unidas: 195,
        valorHabitualMin: 170,
        valorHabitualMax: 200,
        anomalia: {
          fonte: 'localiza',
          valor: 299,
          variacao: 53.3,
          motivo: 'Pico atípico de SUV'
        }
      }
    ],
    intermediario: [
      { data: '08/10', localiza: 155, movida: 148, unidas: 150, valorHabitualMin: 145, valorHabitualMax: 165 },
      { data: '09/10', localiza: 158, movida: 145, unidas: 152, valorHabitualMin: 145, valorHabitualMax: 165 },
      { data: '10/10', localiza: 160, movida: 142, unidas: 155, valorHabitualMin: 145, valorHabitualMax: 165 },
      { data: '11/10', localiza: 162, movida: 140, unidas: 154, valorHabitualMin: 145, valorHabitualMax: 165 },
      { data: '12/10', localiza: 165, movida: 139, unidas: 158, valorHabitualMin: 145, valorHabitualMax: 165 }
    ]
  },
  pampulha: {
    economico: [
      { data: '08/10', localiza: 120, movida: 115, unidas: 118, valorHabitualMin: 110, valorHabitualMax: 128 },
      { data: '09/10', localiza: 122, movida: 112, unidas: 115, valorHabitualMin: 110, valorHabitualMax: 128 },
      { data: '10/10', localiza: 125, movida: 110, unidas: 116, valorHabitualMin: 110, valorHabitualMax: 128 },
      { data: '11/10', localiza: 126, movida: 108, unidas: 114, valorHabitualMin: 110, valorHabitualMax: 128 },
      {
        data: '12/10',
        localiza: 128,
        movida: 105,
        unidas: 115,
        valorHabitualMin: 110,
        valorHabitualMax: 128,
        anomalia: {
          fonte: 'movida',
          valor: 105,
          variacao: -18.0,
          motivo: 'Agressividade comercial'
        }
      }
    ],
    intermediario: [
      { data: '08/10', localiza: 162, movida: 155, unidas: 158, valorHabitualMin: 150, valorHabitualMax: 172 },
      { data: '09/10', localiza: 165, movida: 145, unidas: 160, valorHabitualMin: 150, valorHabitualMax: 172 },
      { data: '10/10', localiza: 166, movida: 135, unidas: 162, valorHabitualMin: 150, valorHabitualMax: 172 },
      { data: '11/10', localiza: 168, movida: 125, unidas: 161, valorHabitualMin: 150, valorHabitualMax: 172 },
      {
        data: '12/10',
        localiza: 169.5,
        movida: 119,
        unidas: 163,
        valorHabitualMin: 150,
        valorHabitualMax: 172,
        anomalia: {
          fonte: 'movida',
          valor: 119,
          variacao: -29.8,
          motivo: 'Movida −29,8% abaixo'
        }
      }
    ],
    suv: [
      { data: '08/10', localiza: 180, movida: 175, unidas: 178, valorHabitualMin: 165, valorHabitualMax: 195 },
      { data: '09/10', localiza: 185, movida: 178, unidas: 180, valorHabitualMin: 165, valorHabitualMax: 195 },
      { data: '10/10', localiza: 188, movida: 180, unidas: 182, valorHabitualMin: 165, valorHabitualMax: 195 },
      { data: '11/10', localiza: 192, movida: 184, unidas: 185, valorHabitualMin: 165, valorHabitualMax: 195 },
      { data: '12/10', localiza: 195, movida: 185, unidas: 188, valorHabitualMin: 165, valorHabitualMax: 195 }
    ]
  },
  savassi: {
    economico: [
      { data: '08/10', localiza: 128, movida: 124, unidas: 125, valorHabitualMin: 120, valorHabitualMax: 135 },
      { data: '09/10', localiza: 130, movida: 122, unidas: 126, valorHabitualMin: 120, valorHabitualMax: 135 },
      { data: '10/10', localiza: 132, movida: 120, unidas: 128, valorHabitualMin: 120, valorHabitualMax: 135 },
      { data: '11/10', localiza: 133, movida: 119, unidas: 127, valorHabitualMin: 120, valorHabitualMax: 135 },
      { data: '12/10', localiza: 135, movida: 118, unidas: 130, valorHabitualMin: 120, valorHabitualMax: 135 }
    ],
    intermediario: [
      { data: '08/10', localiza: 165, movida: 158, unidas: 160, valorHabitualMin: 155, valorHabitualMax: 175 },
      { data: '09/10', localiza: 168, movida: 155, unidas: 162, valorHabitualMin: 155, valorHabitualMax: 175 },
      { data: '10/10', localiza: 170, movida: 152, unidas: 165, valorHabitualMin: 155, valorHabitualMax: 175 },
      { data: '11/10', localiza: 172, movida: 150, unidas: 164, valorHabitualMin: 155, valorHabitualMax: 175 },
      { data: '12/10', localiza: 175, movida: 148, unidas: 168, valorHabitualMin: 155, valorHabitualMax: 175 }
    ],
    suv: [
      { data: '08/10', localiza: 195, movida: 188, unidas: 190, valorHabitualMin: 180, valorHabitualMax: 210 },
      { data: '09/10', localiza: 198, movida: 185, unidas: 192, valorHabitualMin: 180, valorHabitualMax: 210 },
      { data: '10/10', localiza: 200, movida: 184, unidas: 195, valorHabitualMin: 180, valorHabitualMax: 210 },
      { data: '11/10', localiza: 202, movida: 182, unidas: 196, valorHabitualMin: 180, valorHabitualMax: 210 },
      { data: '12/10', localiza: 205, movida: 180, unidas: 198, valorHabitualMin: 180, valorHabitualMax: 210 }
    ]
  }
};

interface PropriedadesGraficoPrecos {
  pracaInicial?: string;
  categoriaInicial?: string;
}

export function GraficoPrecos({
  pracaInicial = 'aeroporto_confins',
  categoriaInicial = 'economico'
}: PropriedadesGraficoPrecos) {
  const [praca, setPraca] = useState(pracaInicial);
  const [categoria, setCategoria] = useState(categoriaInicial);

  const pontos =
    DADOS_GRAFICO[praca]?.[categoria] ||
    DADOS_GRAFICO['aeroporto_confins']['economico'];

  // Dimensões do SVG
  const largura = 760;
  const altura = 280;
  const paddingEsquerda = 60;
  const paddingDireita = 140;
  const paddingSuperior = 30;
  const paddingInferior = 45;

  const larguraUtil = largura - paddingEsquerda - paddingDireita;
  const alturaUtil = altura - paddingSuperior - paddingInferior;

  // Escalas
  const todosValores = pontos.flatMap((p) => [
    p.localiza,
    p.movida,
    p.unidas || 0,
    p.valorHabitualMin,
    p.valorHabitualMax
  ]).filter(Boolean);

  const minValor = Math.floor((Math.min(...todosValores) * 0.9) / 10) * 10;
  const maxValor = Math.ceil((Math.max(...todosValores) * 1.1) / 10) * 10;
  const alcance = maxValor - minValor || 1;

  const obterX = (indice: number) =>
    paddingEsquerda + (indice / (pontos.length - 1)) * larguraUtil;

  const obterY = (valor: number) =>
    paddingSuperior + alturaUtil - ((valor - minValor) / alcance) * alturaUtil;

  // Gerador de caminhos SVG
  const caminhoLocaliza = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${obterX(i).toFixed(1)} ${obterY(p.localiza).toFixed(1)}`)
    .join(' ');

  const caminhoMovida = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${obterX(i).toFixed(1)} ${obterY(p.movida).toFixed(1)}`)
    .join(' ');

  // Faixa do valor habitual (polígono preenchido)
  const caminhoFaixaSuperior = pontos
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${obterX(i).toFixed(1)} ${obterY(p.valorHabitualMax).toFixed(1)}`)
    .join(' ');

  const caminhoFaixaInferior = pontos
    .slice()
    .reverse()
    .map((p, i) => `L ${obterX(pontos.length - 1 - i).toFixed(1)} ${obterY(p.valorHabitualMin).toFixed(1)}`)
    .join(' ');

  const caminhoFaixaHabitual = `${caminhoFaixaSuperior} ${caminhoFaixaInferior} Z`;

  // Localiza ponto de anomalia se houver
  const indiceAnomalia = pontos.findIndex((p) => p.anomalia);
  const pontoAnomalo = indiceAnomalia >= 0 ? pontos[indiceAnomalia] : null;

  // Linhas de grade horizontal
  const linhasGrade = [minValor, minValor + alcance * 0.33, minValor + alcance * 0.66, maxValor];

  return (
    <div className="grafico-bloco">
      {/* Controles de Filtro Sóbrios */}
      <div className="grafico-controles">
        <div>
          <h3 className="grafico-titulo">Comparativo de tarifas e variação histórica</h3>
          <p className="grafico-descricao">
            Evolução das diárias recentes em Belo Horizonte. A faixa sombreada indica o intervalo habitual esperado.
          </p>
        </div>

        <div className="grafico-filtros">
          <label className="filtro-campo">
            <span className="filtro-rotulo">Praça:</span>
            <select
              value={praca}
              onChange={(e) => setPraca(e.target.value)}
              className="filtro-select"
              aria-label="Selecionar praça do gráfico"
            >
              <option value="aeroporto_confins">Aeroporto de Confins</option>
              <option value="pampulha">Pampulha</option>
              <option value="savassi">Savassi</option>
            </select>
          </label>

          <label className="filtro-campo">
            <span className="filtro-rotulo">Categoria:</span>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="filtro-select"
              aria-label="Selecionar categoria do gráfico"
            >
              <option value="economico">Econômico</option>
              <option value="intermediario">Sedan / Intermediário</option>
              <option value="suv">SUV</option>
            </select>
          </label>
        </div>
      </div>

      {/* Legenda Textual Direta */}
      <div className="grafico-legenda">
        <span className="legenda-item">
          <span className="legenda-linha localiza" />
          <strong>Localiza</strong>
        </span>
        <span className="legenda-item">
          <span className="legenda-linha movida" />
          <strong>Movida</strong>
        </span>
        <span className="legenda-item">
          <span className="legenda-amostra-faixa" />
          <span>Faixa de valor habitual</span>
        </span>
      </div>

      {/* Gráfico SVG Responsivo */}
      <div className="grafico-svg-conteiner">
        <svg
          viewBox={`0 0 ${largura} ${altura}`}
          className="grafico-svg"
          role="img"
          aria-label={`Gráfico de preços em ${rotuloPraca(praca)} para a categoria ${rotuloCategoria(categoria)}`}
        >
          {/* Grade Horizontal */}
          {linhasGrade.map((valor, i) => (
            <g key={i}>
              <line
                x1={paddingEsquerda}
                y1={obterY(valor)}
                x2={largura - paddingDireita}
                y2={obterY(valor)}
                stroke="var(--cor-borda)"
                strokeDasharray="3 3"
                strokeWidth="1"
              />
              <text
                x={paddingEsquerda - 8}
                y={obterY(valor) + 4}
                textAnchor="end"
                className="svg-texto-eixo"
              >
                {formatarMoeda(valor).replace(',00', '')}
              </text>
            </g>
          ))}

          {/* Faixa Sombreada Habitual */}
          <path
            d={caminhoFaixaHabitual}
            fill="var(--cor-superficie-subtil)"
            opacity="0.8"
          />

          {/* Linha Movida */}
          <path
            d={caminhoMovida}
            fill="none"
            stroke="var(--cor-texto-secundario)"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Linha Localiza */}
          <path
            d={caminhoLocaliza}
            fill="none"
            stroke="var(--cor-acento)"
            strokeWidth="2.5"
          />

          {/* Pontos de Dados */}
          {pontos.map((p, i) => {
            const x = obterX(i);
            const yLocaliza = obterY(p.localiza);
            const yMovida = obterY(p.movida);

            return (
              <g key={i}>
                {/* Linha vertical e rótulo do eixo X */}
                <text
                  x={x}
                  y={altura - 12}
                  textAnchor="middle"
                  className="svg-texto-eixo"
                >
                  {p.data}
                </text>

                {/* Marcador Movida */}
                <circle
                  cx={x}
                  cy={yMovida}
                  r="3.5"
                  fill="var(--cor-superficie)"
                  stroke="var(--cor-texto-secundario)"
                  strokeWidth="2"
                />

                {/* Marcador Localiza */}
                <circle
                  cx={x}
                  cy={yLocaliza}
                  r="4"
                  fill="var(--cor-acento)"
                  stroke="var(--cor-superficie)"
                  strokeWidth="2"
                />
              </g>
            );
          })}

          {/* Destaque Direto da Anomalia com Rótulo Textual (não apenas cor) */}
          {pontoAnomalo && indiceAnomalia >= 0 && (
            <g>
              {(() => {
                const x = obterX(indiceAnomalia);
                const valorAnomalo =
                  pontoAnomalo.anomalia?.fonte === 'localiza'
                    ? pontoAnomalo.localiza
                    : pontoAnomalo.movida;
                const y = obterY(valorAnomalo);
                const rotulo = `${pontoAnomalo.anomalia?.motivo}: ${formatarMoeda(valorAnomalo)}`;

                const larguraCaixa = 165;
                const ladoEsquerdo = x + larguraCaixa + 15 > largura - paddingDireita;
                const caixaX = ladoEsquerdo ? x - larguraCaixa - 10 : x + 10;
                const caixaY = Math.max(15, y - 26);
                const linhaX2 = ladoEsquerdo ? x - 10 : x + 10;
                const linhaY2 = y - 15;

                return (
                  <g className="svg-anomalia-destaque">
                    {/* Anel indicador */}
                    <circle
                      cx={x}
                      cy={y}
                      r="7"
                      fill="none"
                      stroke="var(--cor-critico)"
                      strokeWidth="2.5"
                    />
                    <circle
                      cx={x}
                      cy={y}
                      r="2.5"
                      fill="var(--cor-critico)"
                    />

                    {/* Caixinha de anotação direta na linha */}
                    <line
                      x1={x}
                      y1={y}
                      x2={linhaX2}
                      y2={linhaY2}
                      stroke="var(--cor-critico)"
                      strokeWidth="1.5"
                    />
                    <rect
                      x={caixaX}
                      y={caixaY}
                      width={larguraCaixa}
                      height="22"
                      rx="3"
                      fill="var(--cor-critico-fundo)"
                      stroke="var(--cor-critico-borda)"
                      strokeWidth="1"
                    />
                    <text
                      x={caixaX + 8}
                      y={caixaY + 15}
                      className="svg-texto-anomalia"
                    >
                      {rotulo}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
        </svg>
      </div>

      {/* Rótulo de Rodapé do Gráfico */}
      <div className="grafico-rodape">
        <span>Última captura: 12/10 às 09:30 · Praça: {rotuloPraca(praca)}</span>
        <span className="grafico-fonte">Fonte: Gravações de tarifas públicas das locadoras (modo replay)</span>
      </div>
    </div>
  );
}
