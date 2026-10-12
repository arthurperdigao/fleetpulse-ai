/**
 * Cálculo do Z-Score Robusto (Modified Z-Score baseado em Mediana e MAD).
 * 
 * Por que Z-Score Robusto e não Z-Score Comum?
 * O Z-score comum usa média e desvio padrão, ambos altamente distorcidos por outliers extremos.
 * O Z-score robusto utiliza Mediana e MAD (Median Absolute Deviation), garantindo que
 * uma anomalia extrema não contamine a régua de medição.
 * 
 * Fórmula:
 * Z_robusto = (valor - mediana) / (1.4826 * MAD)
 * O multiplicador 1.4826 ajusta o MAD para ser um estimador consistente do desvio padrão
 * em distribuições normais.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { calcularMediana } from './mediana.js';
import { calcularMad } from './mad.js';

export const FATOR_ESCALA_NORMAL = 1.4826;

export interface OpcoesZScoreRobusto {
  limiarAnomalia?: number; // Padrão: 2.5 (anomalia moderada/alta a partir de 2.5 ou 3.0)
  minimoAmostras?: number; // Quantidade mínima de dados históricos para cálculo confiável (padrão: 3)
}

export interface MetricasZScoreRobusto {
  valor: number;
  mediana: number;
  mad: number;
  desvioPadraoEstimado: number;
  zScore: number;
  diferencaAbsoluta: number;
  variacaoPercentual: number;
  amostras: number;
  ehAnomalia: boolean;
}

export function calcularZScoreRobusto(
  valor: number,
  historico: number[],
  opcoes: OpcoesZScoreRobusto = {}
): MetricasZScoreRobusto {
  const limiar = opcoes.limiarAnomalia ?? 2.5;
  const minimoAmostras = opcoes.minimoAmostras ?? 3;

  if (!historico || historico.length < minimoAmostras) {
    throw new Error(
      `Histórico insuficiente para cálculo de Z-score robusto. Necessário no mínimo ${minimoAmostras} amostras, recebido: ${historico?.length ?? 0}.`
    );
  }

  const mediana = calcularMediana(historico);
  const mad = calcularMad(historico, mediana);
  const desvioPadraoEstimado = mad * FATOR_ESCALA_NORMAL;
  const diferencaAbsoluta = valor - mediana;
  const variacaoPercentual = mediana !== 0 ? (diferencaAbsoluta / mediana) * 100 : 0;

  let zScore = 0;
  let ehAnomalia = false;

  // Tratamento de borda: Se MAD for 0 (ex.: preços históricos constantes)
  if (mad === 0) {
    if (diferencaAbsoluta === 0) {
      zScore = 0;
      ehAnomalia = false;
    } else {
      // Se houve variação relativa significativa (ex: > 10%), é anomalia
      const variacaoAbsolutaRelativa = Math.abs(variacaoPercentual);
      ehAnomalia = variacaoAbsolutaRelativa >= 10;
      zScore = diferencaAbsoluta > 0 ? (ehAnomalia ? 3.0 : 1.0) : (ehAnomalia ? -3.0 : -1.0);
    }
  } else {
    zScore = Number((diferencaAbsoluta / desvioPadraoEstimado).toFixed(4));
    ehAnomalia = Math.abs(zScore) >= limiar;
  }

  return {
    valor,
    mediana: Number(mediana.toFixed(2)),
    mad: Number(mad.toFixed(2)),
    desvioPadraoEstimado: Number(desvioPadraoEstimado.toFixed(2)),
    zScore,
    diferencaAbsoluta: Number(diferencaAbsoluta.toFixed(2)),
    variacaoPercentual: Number(variacaoPercentual.toFixed(2)),
    amostras: historico.length,
    ehAnomalia
  };
}
