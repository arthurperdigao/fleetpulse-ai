/**
 * Rotas HTTP para consulta de cotações brutas coletadas no TimescaleDB.
 * Regra: Código 100% em Português do Brasil.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RepositorioCotacoes } from '@fleetpulse/banco';
import { PracaEnum, CategoriaEnum, FonteEnum } from '@fleetpulse/esquemas';

const EsquemaFiltroCotacoes = z.object({
  fonte: FonteEnum.optional(),
  praca: PracaEnum.optional(),
  categoria: CategoriaEnum.optional(),
  limite: z.coerce.number().int().min(1).max(200).default(50)
});

export async function registrarRotasCotacoes(
  app: FastifyInstance,
  repositorioCotacoes: RepositorioCotacoes = new RepositorioCotacoes()
) {
  app.get('/api/cotacoes', async (requisicao, resposta) => {
    const parse = EsquemaFiltroCotacoes.safeParse(requisicao.query);

    if (!parse.success) {
      return resposta.status(400).send({
        erro: 'Parâmetros de consulta de cotações inválidos',
        detalhes: parse.error.issues.map((i) => i.message)
      });
    }

    try {
      const cotacoes = await repositorioCotacoes.buscarPorFiltro(parse.data);
      const total = await repositorioCotacoes.contarTotal(parse.data);

      return resposta.send({ totalGeral: total, retornado: cotacoes.length, cotacoes });
    } catch (erro: any) {
      requisicao.log.error(erro);
      return resposta.status(500).send({ erro: 'Erro ao buscar cotações', mensagem: erro.message });
    }
  });
}
