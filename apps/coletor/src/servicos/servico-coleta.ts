/**
 * Serviço de orquestração da coleta e persistência de dados.
 * Conecta os adaptadores de coleta ao RepositorioCotacoes do TimescaleDB.
 * Regra: Código 100% em Português do Brasil.
 */

import { Cotacao, Fonte, Praca, Categoria } from '@fleetpulse/esquemas';
import { RepositorioCotacoes } from '@fleetpulse/banco';
import { AdaptadorColeta, ParametrosConsultaCotacao } from '../adaptadores/contrato-adaptador.js';

export interface RelatorioExecucaoColeta {
  totalConsultas: number;
  totalCotacoesColetadas: number;
  totalCotacoesSalvas: number;
  erros: string[];
  duracaoTotalMs: number;
  cotacoes: Cotacao[];
}

export class ServicoColeta {
  constructor(
    private readonly repositorio: RepositorioCotacoes = new RepositorioCotacoes()
  ) {}

  /**
   * Executa a coleta para uma lista de parâmetros e persiste imediatamente em lote no banco.
   */
  async executarCiclo(
    adaptador: AdaptadorColeta,
    consultas: ParametrosConsultaCotacao[]
  ): Promise<RelatorioExecucaoColeta> {
    const inicio = performance.now();
    const erros: string[] = [];
    const todasCotacoes: Cotacao[] = [];

    for (const consulta of consultas) {
      const resultado = await adaptador.coletar(consulta);

      if (!resultado.sucesso) {
        if (resultado.errosValidacao) {
          erros.push(...resultado.errosValidacao);
        }
        continue;
      }

      if (resultado.errosValidacao && resultado.errosValidacao.length > 0) {
        erros.push(...resultado.errosValidacao);
      }

      todasCotacoes.push(...resultado.cotacoes);
    }

    let totalSalvas = 0;
    if (todasCotacoes.length > 0) {
      totalSalvas = await this.repositorio.salvarLote(todasCotacoes);
    }

    const duracaoTotalMs = Math.round(performance.now() - inicio);

    return {
      totalConsultas: consultas.length,
      totalCotacoesColetadas: todasCotacoes.length,
      totalCotacoesSalvas: totalSalvas,
      erros,
      duracaoTotalMs,
      cotacoes: todasCotacoes
    };
  }
}
