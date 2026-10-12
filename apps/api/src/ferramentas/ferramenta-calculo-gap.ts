/**
 * Ferramenta 3: Cálculo Determinístico de Gap de Mercado.
 * 
 * Princípio Arquitetural: "LLM interpreta, código calcula".
 * Realiza cálculos matemáticos exatos de diferença financeira, variação percentual
 * e competitividade tarifária sem delegar contas ao modelo de linguagem.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { z } from 'zod';
import { FerramentaAgente } from './contrato-ferramenta.js';

export const EsquemaParametrosCalculoGap = z.object({
  precoReferencia: z.number().positive('O preço de referência deve ser positivo'),
  precoConcorrente: z.number().positive('O preço do concorrente deve ser positivo')
});

export type ParametrosCalculoGap = z.infer<typeof EsquemaParametrosCalculoGap>;

export interface ResultadoCalculoGap {
  precoReferencia: number;
  precoConcorrente: number;
  diferencaReais: number;
  gapPercentual: number;
  razaoTarifaria: number;
  concorrenteMaisBarato: boolean;
}

export class FerramentaCalculoGap
  implements FerramentaAgente<ParametrosCalculoGap, ResultadoCalculoGap>
{
  public readonly nome = 'calculo_gap_mercado';
  public readonly descricao =
    'Calcula com exatidão matemática determinística a diferença em reais e o gap percentual entre duas tarifas de locação.';
  public readonly esquemaParametros = EsquemaParametrosCalculoGap;

  async executar(parametros: ParametrosCalculoGap): Promise<ResultadoCalculoGap> {
    const { precoReferencia, precoConcorrente } = this.esquemaParametros.parse(parametros);

    const diferencaReais = Number((precoReferencia - precoConcorrente).toFixed(2));
    const gapPercentual = Number(((diferencaReais / precoReferencia) * 100).toFixed(2));
    const razaoTarifaria = Number((precoConcorrente / precoReferencia).toFixed(4));
    const concorrenteMaisBarato = precoConcorrente < precoReferencia;

    return {
      precoReferencia,
      precoConcorrente,
      diferencaReais,
      gapPercentual,
      razaoTarifaria,
      concorrenteMaisBarato
    };
  }

  extrairNumerosAutorizados(resultado: ResultadoCalculoGap): number[] {
    return [
      resultado.precoReferencia,
      resultado.precoConcorrente,
      Math.abs(resultado.diferencaReais),
      Math.abs(resultado.gapPercentual),
      Math.abs(resultado.razaoTarifaria),
      Math.floor(Math.abs(resultado.diferencaReais)),
      Math.ceil(Math.abs(resultado.diferencaReais)),
      Math.floor(Math.abs(resultado.gapPercentual)),
      Math.ceil(Math.abs(resultado.gapPercentual))
    ];
  }
}
