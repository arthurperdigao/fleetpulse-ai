/**
 * Adaptador de Replay determinístico para coleta de cotações
 * Permite testes estáveis, rápidos e reprodutíveis no CI e demos.
 * Regra: Código 100% em Português do Brasil.
 */

import * as fs from 'node:fs/promises';
import * as caminho from 'node:path';
import { EsquemaCotacao, type Cotacao, type Fonte } from '@fleetpulse/esquemas';
import type {
  AdaptadorColeta,
  ParametrosConsultaCotacao,
  ResultadoColeta
} from './contrato-adaptador.js';

export class AdaptadorReplay implements AdaptadorColeta {
  public readonly nome = 'Adaptador Replay (HAR / Fixtures)';

  constructor(
    public readonly fonte: Fonte,
    private readonly caminhoArquivoFixture?: string
  ) {}

  public async coletar(parametros: ParametrosConsultaCotacao): Promise<ResultadoColeta> {
    const inicio = performance.now();
    const arquivo =
      this.caminhoArquivoFixture ??
      caminho.resolve(process.cwd(), '../../fixtures/har/cotacoes-referencia.json');

    try {
      const conteudo = await fs.readFile(arquivo, 'utf-8');
      const dadosBrutos: unknown[] = JSON.parse(conteudo);

      const cotacoesValidas: Cotacao[] = [];
      const errosValidacao: string[] = [];

      for (const item of dadosBrutos) {
        const resultadoZod = EsquemaCotacao.safeParse(item);

        if (!resultadoZod.success) {
          errosValidacao.push(
            `Falha de contrato no item: ${resultadoZod.error.issues.map(i => `${i.path.join('.')}: ${i.message}`).join(', ')}`
          );
          continue;
        }

        const cotacao = resultadoZod.data;

        // Filtrar pela consulta informada
        const coincideFonte = cotacao.fonte === parametros.fonte;
        const coincidePraca = cotacao.praca === parametros.praca;
        const coincideCategoria = parametros.categoria
          ? cotacao.categoria === parametros.categoria
          : true;

        if (coincideFonte && coincidePraca && coincideCategoria) {
          cotacoesValidas.push(cotacao);
        }
      }

      const duracaoMs = Math.round(performance.now() - inicio);

      return {
        sucesso: true,
        fonte: parametros.fonte,
        praca: parametros.praca,
        cotacoes: cotacoesValidas,
        errosValidacao: errosValidacao.length > 0 ? errosValidacao : undefined,
        tempoExecucaoMs: duracaoMs,
        modo: 'replay'
      };
    } catch (erro: any) {
      const duracaoMs = Math.round(performance.now() - inicio);
      return {
        sucesso: false,
        fonte: parametros.fonte,
        praca: parametros.praca,
        cotacoes: [],
        errosValidacao: [`Erro ao carregar fixture de replay: ${erro.message}`],
        tempoExecucaoMs: duracaoMs,
        modo: 'replay'
      };
    }
  }
}
