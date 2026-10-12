/**
 * Detector determinístico de Agressividade Concorrencial (Competitor Undercut).
 * Compara cotações concorrentes pareadas por praça, categoria e período de locação.
 * Regra: Código 100% em Português do Brasil.
 */

import { Cotacao, InsightAnomalia, Severidade, Fonte } from '@fleetpulse/esquemas';

export interface OpcoesDetectorConcorrente {
  fonteReferencia?: Fonte; // Padrão: 'localiza'
  gapMinimoPercentual?: number; // Padrão: 12% (abaixo disso é flutuação normal de mercado)
  diferencaMinimaReais?: number; // Padrão: R$ 15.00
}

export function classificarSeveridadeGap(gapPercentual: number): Severidade {
  if (gapPercentual >= 35) {
    return 'critica';
  }
  if (gapPercentual >= 25) {
    return 'alta';
  }
  if (gapPercentual >= 15) {
    return 'media';
  }
  return 'baixa';
}

function formatarDataIso(data: Date): string {
  return data.toISOString().split('T')[0];
}

/**
 * Detecta se algum concorrente está com preço expressivamente inferior à fonte de referência.
 */
export function detectarAgressividadeConcorrente(
  cotacoesRodada: Cotacao[],
  opcoes: OpcoesDetectorConcorrente = {}
): InsightAnomalia[] {
  const fonteReferencia = opcoes.fonteReferencia ?? 'localiza';
  const gapMinimo = opcoes.gapMinimoPercentual ?? 12;
  const diferencaMinima = opcoes.diferencaMinimaReais ?? 15;

  const insights: InsightAnomalia[] = [];

  // 1. Filtrar cotações disponíveis da referência
  const cotacoesReferencia = cotacoesRodada.filter(
    (c) => c.fonte === fonteReferencia && c.disponivel
  );

  for (const referencia of cotacoesReferencia) {
    // 2. Localizar cotações de concorrentes para a mesma praça, categoria e data de retirada
    const concorrentes = cotacoesRodada.filter(
      (c) =>
        c.fonte !== fonteReferencia &&
        c.praca === referencia.praca &&
        c.categoria === referencia.categoria &&
        c.dataRetirada.getTime() === referencia.dataRetirada.getTime() &&
        c.disponivel
    );

    for (const concorrente of concorrentes) {
      if (concorrente.precoDiaria < referencia.precoDiaria) {
        const diferencaReais = Number((referencia.precoDiaria - concorrente.precoDiaria).toFixed(2));
        const gapPercentual = Number(((diferencaReais / referencia.precoDiaria) * 100).toFixed(2));

        if (gapPercentual >= gapMinimo && diferencaReais >= diferencaMinima) {
          const severidade = classificarSeveridadeGap(gapPercentual);
          const periodo = `${formatarDataIso(referencia.dataRetirada)} até ${formatarDataIso(referencia.dataDevolucao)}`;

          const narrativa =
            `Agressividade concorrencial detectada: ${concorrente.fonte.toUpperCase()} está R$ ${diferencaReais.toFixed(2)} ` +
            `mais barata (-${gapPercentual.toFixed(1)}%) que ${fonteReferencia.toUpperCase()} na categoria ${referencia.categoria} ` +
            `em ${referencia.praca} (R$ ${concorrente.precoDiaria.toFixed(2)} vs R$ ${referencia.precoDiaria.toFixed(2)}).`;

          insights.push({
            detectadoEm: new Date(),
            tipo: 'concorrente_mais_barato',
            severidade,
            praca: referencia.praca,
            categoria: referencia.categoria,
            periodo,
            metricas: {
              fonteReferencia,
              fonteConcorrente: concorrente.fonte,
              precoReferencia: referencia.precoDiaria,
              precoConcorrente: concorrente.precoDiaria,
              diferencaReais,
              gapPercentual,
              duracaoDias: referencia.duracaoDias
            },
            narrativa,
            status: 'novo'
          });
        }
      }
    }
  }

  return insights;
}
