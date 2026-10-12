/**
 * Detector determinístico de Pico de Preço (Price Spike).
 * Utiliza o Z-Score Robusto com Mediana e MAD sobre a série histórica.
 * Regra: Código 100% em Português do Brasil.
 */

import { Cotacao, InsightAnomalia, Severidade } from '@fleetpulse/esquemas';
import { calcularZScoreRobusto, OpcoesZScoreRobusto } from '../estatistica/zscore-robusto.js';

export interface OpcoesDetectorPicoPreco extends OpcoesZScoreRobusto {
  diferencaMinimaReais?: number; // Preço deve variar ao menos R$ 15 para justificar alerta
}

export function classificarSeveridadePico(zScore: number, variacaoPercentual: number): Severidade {
  if (zScore >= 4.0 || variacaoPercentual >= 70) {
    return 'critica';
  }
  if (zScore >= 3.0 || variacaoPercentual >= 45) {
    return 'alta';
  }
  if (zScore >= 2.5 || variacaoPercentual >= 25) {
    return 'media';
  }
  return 'baixa';
}

function formatarDataIso(data: Date): string {
  return data.toISOString().split('T')[0];
}

/**
 * Avalia se uma cotação representa um pico de preço anômalo frente ao histórico.
 */
export function detectarPicoPreco(
  cotacaoAtual: Cotacao,
  historicoCotacoes: Cotacao[],
  opcoes: OpcoesDetectorPicoPreco = {}
): InsightAnomalia | null {
  const diferencaMinima = opcoes.diferencaMinimaReais ?? 15;

  // Filtrar histórico pela mesma fonte, praça e categoria
  const historicoRelevante = historicoCotacoes.filter(
    (c) =>
      c.fonte === cotacaoAtual.fonte &&
      c.praca === cotacaoAtual.praca &&
      c.categoria === cotacaoAtual.categoria &&
      c.disponivel
  );

  const precosHistoricos = historicoRelevante.map((c) => c.precoDiaria);

  try {
    const metricas = calcularZScoreRobusto(cotacaoAtual.precoDiaria, precosHistoricos, opcoes);

    // Só é pico de preço se o Z-score for positivo e superar a diferença monetária mínima
    if (metricas.ehAnomalia && metricas.zScore > 0 && metricas.diferencaAbsoluta >= diferencaMinima) {
      const severidade = classificarSeveridadePico(metricas.zScore, metricas.variacaoPercentual);
      const periodo = `${formatarDataIso(cotacaoAtual.dataRetirada)} até ${formatarDataIso(cotacaoAtual.dataDevolucao)}`;

      const narrativa =
        `Pico de preço detectado em ${cotacaoAtual.fonte.toUpperCase()} (${cotacaoAtual.categoria} na praça ${cotacaoAtual.praca}). ` +
        `Tarifa atual de R$ ${cotacaoAtual.precoDiaria.toFixed(2)} está +${metricas.variacaoPercentual.toFixed(1)}% acima da mediana ` +
        `histórica de R$ ${metricas.mediana.toFixed(2)} (Z-score robusto: ${metricas.zScore.toFixed(2)}).`;

      return {
        detectadoEm: new Date(),
        tipo: 'pico_preco',
        severidade,
        praca: cotacaoAtual.praca,
        categoria: cotacaoAtual.categoria,
        periodo,
        metricas: {
          ...metricas,
          fonte: cotacaoAtual.fonte,
          precoAtual: cotacaoAtual.precoDiaria,
          duracaoDias: cotacaoAtual.duracaoDias,
          antecedenciaDias: cotacaoAtual.antecedenciaDias
        },
        narrativa,
        status: 'novo'
      };
    }
  } catch {
    // Quantidade de amostras insuficiente para cálculo estatístico defensável
    return null;
  }

  return null;
}
