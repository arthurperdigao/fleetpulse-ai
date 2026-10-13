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

  it('deve resolver pergunta de gap sem números no prompt buscando dados da base', async () => {
    const agente = new AgenteObservabilidade();
    const resposta = await agente.processarPergunta('Qual o gap de preço entre Localiza e Movida?');

    const nomesFerramentas = resposta.ferramentasExecutadas.map((f) => f.nome);
    expect(nomesFerramentas).toContain('calculo_gap_mercado');
    expect(resposta.auditoria.valido).toBe(true);
    expect(resposta.auditoria.numerosCitados.length).toBeGreaterThan(0);
    expect(resposta.mensagem).toMatch(/\d+/); // Contém números calculados
  });

  it('deve reprovar auditoria se pergunta quantitativa de gap não apresentar números na resposta', async () => {
    // Provedor simulado retornando texto sem números
    const provedorVazio = new ProvedorSimulado({
      respostasPreDefinidas: ['Avaliamos os preços e o mercado está dinâmico sem alteração perceptível.']
    });

    const agente = new AgenteObservabilidade({ provedorLlm: provedorVazio });
    const resposta = await agente.processarPergunta('Qual a diferença e gap entre 150 e 120?');

    // Validador deve acusar falha por ausência de números quando exigido
    expect(resposta.auditoria.valido).toBe(false);
    expect(resposta.auditoria.motivoReprovacao).toContain('análise quantitativa');
  });
});
