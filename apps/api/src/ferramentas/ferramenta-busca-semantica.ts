/**
 * Ferramenta 2: Busca Semântica de Insights com pgvector.
 * 
 * Permite que o agente encontre eventos históricos de mercado, anomalias e precedentes
 * utilizando busca vetorial por similaridade de cosseno, trazendo também correções
 * registradas pelos analistas de pricing (Human-in-the-Loop).
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { z } from 'zod';
import { PracaEnum, CategoriaEnum } from '@fleetpulse/esquemas';
import {
  RepositorioInsights,
  GeradorEmbeddings,
  GeradorEmbeddingsSimulado,
  InsightSimilar
} from '@fleetpulse/banco';
import { FerramentaAgente } from './contrato-ferramenta.js';

export const EsquemaParametrosBuscaSemantica = z.object({
  termoBusca: z.string().min(3, 'O termo de busca deve conter ao menos 3 caracteres'),
  praca: PracaEnum.optional(),
  categoria: CategoriaEnum.optional(),
  limite: z.number().int().min(1).max(10).optional()
});

export type ParametrosBuscaSemantica = z.infer<typeof EsquemaParametrosBuscaSemantica>;

export interface ResultadoBuscaSemantica {
  insights: InsightSimilar[];
  totalEncontrado: number;
  tempoBuscaMs: number;
}

export class FerramentaBuscaSemantica
  implements FerramentaAgente<ParametrosBuscaSemantica, ResultadoBuscaSemantica>
{
  public readonly nome = 'busca_semantica_insights';
  public readonly descricao =
    'Pesquisa anomalias e insights históricos semelhantes no banco vetorial pgvector usando linguagem natural e contexto.';
  public readonly esquemaParametros = EsquemaParametrosBuscaSemantica;

  constructor(
    private readonly repositorio: RepositorioInsights = new RepositorioInsights(),
    private readonly geradorEmbeddings: GeradorEmbeddings = new GeradorEmbeddingsSimulado()
  ) {}

  async executar(parametros: ParametrosBuscaSemantica): Promise<ResultadoBuscaSemantica> {
    const inicio = performance.now();
    const validado = this.esquemaParametros.parse(parametros);

    const embedding = await this.geradorEmbeddings.gerarEmbedding(validado.termoBusca);
    const insights = await this.repositorio.buscarSimilares(embedding, {
      praca: validado.praca,
      categoria: validado.categoria,
      limite: validado.limite ?? 3
    });

    const tempoBuscaMs = Math.round(performance.now() - inicio);

    return {
      insights,
      totalEncontrado: insights.length,
      tempoBuscaMs
    };
  }

  extrairNumerosAutorizados(resultado: ResultadoBuscaSemantica): number[] {
    const numeros: number[] = [];

    for (const item of resultado.insights) {
      if (item.similaridade) {
        numeros.push(Math.abs(item.similaridade));
        numeros.push(Math.round(item.similaridade * 100));
      }

      if (item.metricas) {
        for (const valor of Object.values(item.metricas)) {
          if (typeof valor === 'number' && !isNaN(valor)) {
            numeros.push(Math.abs(valor));
            numeros.push(Math.floor(Math.abs(valor)));
            numeros.push(Math.ceil(Math.abs(valor)));
          }
        }
      }
    }

    return Array.from(new Set(numeros));
  }
}
