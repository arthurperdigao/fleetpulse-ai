/**
 * Rotas HTTP para listagem de insights e loop de feedback humano (Human-in-the-Loop).
 * Regra: Código 100% em Português do Brasil.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { RepositorioInsights, RepositorioFeedback } from '@fleetpulse/banco';
import { PracaEnum, CategoriaEnum, TipoAnomaliaEnum, SeveridadeEnum } from '@fleetpulse/esquemas';

const EsquemaFiltroInsights = z.object({
  tipo: TipoAnomaliaEnum.optional(),
  severidade: SeveridadeEnum.optional(),
  praca: PracaEnum.optional(),
  categoria: CategoriaEnum.optional(),
  status: z.enum(['novo', 'verificado_humano', 'rejeitado_humano']).optional(),
  limite: z.coerce.number().int().min(1).max(100).default(50)
});

const EsquemaCorpoFeedback = z.object({
  ehUtil: z.boolean(),
  correcao: z.string().optional(),
  revisadoPor: z.string().optional()
});

export async function registrarRotasInsights(
  app: FastifyInstance,
  repositorioInsights: RepositorioInsights = new RepositorioInsights(),
  repositorioFeedback: RepositorioFeedback = new RepositorioFeedback()
) {
  // Listagem de insights com filtros analíticos
  app.get('/api/insights', async (requisicao, resposta) => {
    const parse = EsquemaFiltroInsights.safeParse(requisicao.query);

    if (!parse.success) {
      return resposta.status(400).send({
        erro: 'Parâmetros de consulta inválidos',
        detalhes: parse.error.issues.map((i) => i.message)
      });
    }

    try {
      const insights = await repositorioInsights.buscarPorFiltro(parse.data);
      return resposta.send({ total: insights.length, insights });
    } catch (erro: any) {
      requisicao.log.error(erro);
      return resposta.status(500).send({ erro: 'Erro ao buscar insights', mensagem: erro.message });
    }
  });

  // Envio de feedback humano e correção para um insight específico
  app.post('/api/insights/:id/feedback', async (requisicao, resposta) => {
    const { id } = requisicao.params as { id: string };
    const parse = EsquemaCorpoFeedback.safeParse(requisicao.body);

    if (!parse.success) {
      return resposta.status(400).send({
        erro: 'Corpo do feedback inválido',
        detalhes: parse.error.issues.map((i) => i.message)
      });
    }

    try {
      const feedbackSalvo = await repositorioFeedback.salvar({
        insightId: id,
        ehUtil: parse.data.ehUtil,
        correcao: parse.data.correcao,
        revisadoPor: parse.data.revisadoPor
      });

      return resposta.status(201).send(feedbackSalvo);
    } catch (erro: any) {
      requisicao.log.error(erro);
      return resposta.status(500).send({ erro: 'Erro ao salvar feedback', mensagem: erro.message });
    }
  });
}
