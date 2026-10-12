import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { AdaptadorReplay } from '../adaptadores/adaptador-replay.js';
import { ServicoColeta } from './servico-coleta.js';
import { RepositorioCotacoes, encerrarPoolConexao } from '@fleetpulse/banco';

describe('ServicoColeta - Integração Coletor com TimescaleDB', () => {
  let repositorio: RepositorioCotacoes;
  let servico: ServicoColeta;

  beforeEach(async () => {
    repositorio = new RepositorioCotacoes();
    try {
      await repositorio.limparTudo();
    } catch {
      // Ignora caso container indisponível
    }
    servico = new ServicoColeta(repositorio);
  });

  afterAll(async () => {
    await encerrarPoolConexao();
  });

  it('deve orquestrar coleta com AdaptadorReplay e persistir cotações no banco com sucesso', async () => {
    const adaptador = new AdaptadorReplay('localiza');

    const consultas = [
      {
        fonte: 'localiza' as const,
        praca: 'aeroporto_confins' as const,
        dataRetirada: new Date('2026-10-15T10:00:00.000Z'),
        duracaoDias: 3
      }
    ];

    const relatorio = await servico.executarCiclo(adaptador, consultas);

    expect(relatorio.totalConsultas).toBe(1);
    expect(relatorio.totalCotacoesColetadas).toBeGreaterThan(0);
    expect(relatorio.totalCotacoesSalvas).toBe(relatorio.totalCotacoesColetadas);
    expect(relatorio.erros.length).toBe(0);

    // Conferir se as cotações realmente estão salvas no banco
    const cotacoesNoBanco = await repositorio.buscarPorFiltro({
      praca: 'aeroporto_confins',
      fonte: 'localiza'
    });

    expect(cotacoesNoBanco.length).toBe(relatorio.totalCotacoesSalvas);
    expect(cotacoesNoBanco[0].fonte).toBe('localiza');
    expect(cotacoesNoBanco[0].praca).toBe('aeroporto_confins');
  });
});
