import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyInstance } from 'fastify';
import { criarServidor } from './servidor.js';
import { RepositorioInsights, encerrarPoolLeitor, encerrarPoolConexao } from '@fleetpulse/banco';
import { ProvedorSimulado } from '@fleetpulse/deteccao';
import { AgenteObservabilidade } from './agente/agente-observabilidade.js';

describe('Servidor Fastify - Endpoints da API FleetPulse AI', () => {
  let app: FastifyInstance;

  beforeAll(async () => {
    const provedor = new ProvedorSimulado({
      respostasPreDefinidas: [
        'Resposta verificada: a diferença calculada é de R$ 30 com gap de 20%.'
      ]
    });
    const agente = new AgenteObservabilidade({ provedorLlm: provedor });
    app = await criarServidor({ agente });
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await encerrarPoolLeitor();
    await encerrarPoolConexao();
  });

  it('GET /api/saude deve retornar status operacional e banco conectado', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: '/api/saude'
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.status).toBe('operacional');
    expect(corpo.bancoDeDados).toBe('conectado');
  });

  it('POST /api/chat deve responder perguntas acionando o agente e validador', async () => {
    const resposta = await app.inject({
      method: 'POST',
      url: '/api/chat',
      payload: {
        mensagem: 'Qual o gap e a diferença entre 150 e 120?'
      }
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.mensagem).toContain('R$ 30');
    expect(corpo.auditoria.valido).toBe(true);
  });

  it('GET /api/insights deve listar os insights persistidos', async () => {
    const resposta = await app.inject({
      method: 'GET',
      url: '/api/insights?limite=5'
    });

    expect(resposta.statusCode).toBe(200);
    const corpo = JSON.parse(resposta.body);
    expect(corpo).toHaveProperty('total');
    expect(Array.isArray(corpo.insights)).toBe(true);
  });

  it('POST /api/insights/:id/feedback deve registrar avaliação e correção humana', async () => {
    const repo = new RepositorioInsights();
    const insight = await repo.salvar({
      detectadoEm: new Date(),
      tipo: 'pico_preco',
      severidade: 'baixa',
      praca: 'savassi',
      categoria: 'economico',
      periodo: '2026-10-20 até 2026-10-23',
      metricas: { preco: 100 },
      narrativa: 'Variação leve',
      status: 'novo'
    });

    const resposta = await app.inject({
      method: 'POST',
      url: `/api/insights/${insight.id}/feedback`,
      payload: {
        ehUtil: true,
        correcao: 'Comportamento normal de feriado.',
        revisadoPor: 'analista_qa'
      }
    });

    expect(resposta.statusCode).toBe(201);
    const corpo = JSON.parse(resposta.body);
    expect(corpo.ehUtil).toBe(true);
    expect(corpo.correcao).toBe('Comportamento normal de feriado.');
  });
});
