/**
 * Configuração e inicialização do servidor Fastify.
 * Centraliza rotas do agente de chat, API de insights e monitor de integridade.
 * Regra: Código 100% em Português do Brasil.
 */

import fastify, { FastifyInstance } from 'fastify';
import cors from '@fastify/cors';
import { testarConexao } from '@fleetpulse/banco';
import { registrarRotasChat } from './rotas/rota-chat.js';
import { registrarRotasInsights } from './rotas/rota-insights.js';
import { registrarRotasCotacoes } from './rotas/rota-cotacoes.js';
import { AgenteObservabilidade } from './agente/agente-observabilidade.js';

export interface OpcoesServidor {
  agente?: AgenteObservabilidade;
  ativarLogs?: boolean;
}

export async function criarServidor(opcoes: OpcoesServidor = {}): Promise<FastifyInstance> {
  const app = fastify({
    logger: opcoes.ativarLogs ?? false
  });

  // Habilitar CORS para permitir comunicação com o painel Next.js
  await app.register(cors, {
    origin: true
  });

  // Rota de verificação de integridade e saúde do serviço
  app.get('/api/saude', async () => {
    const bancoConectado = await testarConexao();
    return {
      status: bancoConectado ? 'operacional' : 'degradado',
      servico: 'FleetPulse AI API',
      bancoDeDados: bancoConectado ? 'conectado' : 'falha',
      horario: new Date().toISOString()
    };
  });

  // Registro das rotas da API
  await registrarRotasChat(app, opcoes.agente);
  await registrarRotasInsights(app);
  await registrarRotasCotacoes(app);

  return app;
}
