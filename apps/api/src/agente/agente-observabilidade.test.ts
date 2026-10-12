import { describe, it, expect, afterAll } from 'vitest';
import { AgenteObservabilidade } from './agente-observabilidade.js';
import { ProvedorSimulado } from '@fleetpulse/deteccao';
import { encerrarPoolLeitor, encerrarPoolConexao } from '@fleetpulse/banco';

describe('AgenteObservabilidade - Orquestração e Auditoria', () => {
  afterAll(async () => {
    await encerrarPoolLeitor();
    await encerrarPoolConexao();
  });

  it('deve processar pergunta de mercado acionando ferramentas e auditando a resposta', async () => {
    const provedor = new ProvedorSimulado({
      respostasPreDefinidas: [
        'Analisamos a concorrência: o gap apurado é de 20% com diferença de R$ 30 entre as tarifas de R$ 150 e R$ 120.'
      ]
    });

    const agente = new AgenteObservabilidade({ provedorLlm: provedor });
    const resposta = await agente.processarPergunta('Qual a diferença e gap entre 150 e 120?');

    expect(resposta.mensagem).toContain('R$ 30');
    expect(resposta.ferramentasExecutadas.length).toBeGreaterThan(0);
    expect(resposta.auditoria.valido).toBe(true);
    expect(resposta.auditoria.alucinacoesIdentificadas.length).toBe(0);
  });
});
