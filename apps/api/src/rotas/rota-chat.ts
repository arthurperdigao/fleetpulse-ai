/**
 * Rota HTTP para interação conversacional com o Agente FleetPulse AI.
 * Regra: Código 100% em Português do Brasil.
 */

import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { AgenteObservabilidade } from '../agente/agente-observabilidade.js';

const EsquemaCorpoChat = z.object({
  mensagem: z.string().min(1, 'A mensagem não pode estar em branco')
});

export async function registrarRotasChat(
  app: FastifyInstance,
  agente: AgenteObservabilidade = new AgenteObservabilidade()
) {
  app.post('/api/chat', async (requisicao, resposta) => {
    const parse = EsquemaCorpoChat.safeParse(requisicao.body);

    if (!parse.success) {
      return resposta.status(400).send({
        erro: 'Corpo da requisição inválido',
        detalhes: parse.error.issues.map((i) => i.message)
      });
    }

    try {
      const resultado = await agente.processarPergunta(parse.data.mensagem);
      return resposta.send(resultado);
    } catch (erro: any) {
      requisicao.log.error(erro);
      return resposta.status(500).send({
        erro: 'Falha ao processar mensagem com o agente',
        mensagem: erro.message
      });
    }
  });
}
