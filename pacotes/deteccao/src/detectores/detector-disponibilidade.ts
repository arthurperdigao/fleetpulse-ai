/**
 * Detector determinístico de Queda de Disponibilidade (Stockout / Availability Drop).
 * Identifica esgotamento de categorias-chave em praças estratégicas.
 * Regra: Código 100% em Português do Brasil.
 */

import { Cotacao, InsightAnomalia, Severidade, Categoria } from '@fleetpulse/esquemas';

export function classificarSeveridadeDisponibilidade(categoria: Categoria): Severidade {
  switch (categoria) {
    case 'economico':
      return 'alta'; // Categoria crítica de maior demanda
    case 'intermediario':
      return 'alta';
    case 'suv':
      return 'media';
    default:
      return 'baixa';
  }
}

function formatarDataIso(data: Date): string {
  return data.toISOString().split('T')[0];
}

/**
 * Detecta itens indisponíveis na rodada atual
 */
export function detectarQuedaDisponibilidade(cotacoes: Cotacao[]): InsightAnomalia[] {
  const insights: InsightAnomalia[] = [];
  const indisponiveis = cotacoes.filter((c) => !c.disponivel);

  for (const item of indisponiveis) {
    const severidade = classificarSeveridadeDisponibilidade(item.categoria);
    const periodo = `${formatarDataIso(item.dataRetirada)} até ${formatarDataIso(item.dataDevolucao)}`;

    const narrativa =
      `Ruptura de estoque detectada: categoria ${item.categoria.toUpperCase()} está sem disponibilidade ` +
      `na fonte ${item.fonte.toUpperCase()} para a praça ${item.praca} no período de ${periodo}.`;

    insights.push({
      detectadoEm: new Date(),
      tipo: 'queda_disponibilidade',
      severidade,
      praca: item.praca,
      categoria: item.categoria,
      periodo,
      metricas: {
        fonte: item.fonte,
        disponivel: false,
        grupoOriginal: item.grupoOriginal,
        modeloExemplo: item.modeloExemplo,
        antecedenciaDias: item.antecedenciaDias
      },
      narrativa,
      status: 'novo'
    });
  }

  return insights;
}
