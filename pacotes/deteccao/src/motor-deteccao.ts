/**
 * Motor Unificado de Detecção Estatística de Anomalias de Mercado.
 * Orquestra detectores especializados (Picos de Preço, Concorrência e Disponibilidade).
 * Princípio Arquitetural: "LLM interpreta, código calcula".
 * Regra: Código 100% em Português do Brasil.
 */

import { Cotacao, InsightAnomalia, EsquemaInsightAnomalia } from '@fleetpulse/esquemas';
import { detectarPicoPreco, OpcoesDetectorPicoPreco } from './detectores/detector-pico-preco.js';
import {
  detectarAgressividadeConcorrente,
  OpcoesDetectorConcorrente
} from './detectores/detector-concorrente.js';
import { detectarQuedaDisponibilidade } from './detectores/detector-disponibilidade.js';

export interface ConfiguracaoMotorDeteccao {
  opcoesPicoPreco?: OpcoesDetectorPicoPreco;
  opcoesConcorrencia?: OpcoesDetectorConcorrente;
}

export class MotorDeteccao {
  constructor(private readonly configuracao: ConfiguracaoMotorDeteccao = {}) {}

  /**
   * Executa a análise completa de uma rodada de cotações contra o histórico.
   * Retorna a lista de anomalias e insights estatísticos validados.
   */
  processarRodada(
    cotacoesRodada: Cotacao[],
    historicoCotacoes: Cotacao[] = []
  ): InsightAnomalia[] {
    const insights: InsightAnomalia[] = [];

    // 1. Detecção de Picos de Preço com Z-Score Robusto
    for (const cotacao of cotacoesRodada) {
      if (!cotacao.disponivel) continue;

      const insightPico = detectarPicoPreco(
        cotacao,
        historicoCotacoes,
        this.configuracao.opcoesPicoPreco
      );

      if (insightPico) {
        insights.push(EsquemaInsightAnomalia.parse(insightPico));
      }
    }

    // 2. Detecção de Concorrência Agressiva (pareamento na mesma rodada)
    const insightsConcorrencia = detectarAgressividadeConcorrente(
      cotacoesRodada,
      this.configuracao.opcoesConcorrencia
    );
    for (const insight of insightsConcorrencia) {
      insights.push(EsquemaInsightAnomalia.parse(insight));
    }

    // 3. Detecção de Ruptura de Estoque / Disponibilidade
    const insightsDisponibilidade = detectarQuedaDisponibilidade(cotacoesRodada);
    for (const insight of insightsDisponibilidade) {
      insights.push(EsquemaInsightAnomalia.parse(insight));
    }

    return insights;
  }
}
