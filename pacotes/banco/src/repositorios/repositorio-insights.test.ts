import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { InsightAnomalia } from '@fleetpulse/esquemas';
import { RepositorioInsights } from './repositorio-insights.js';
import { encerrarPoolConexao } from '../conexao.js';

describe('RepositorioInsights - Integração com TimescaleDB / Postgres', () => {
  let repositorio: RepositorioInsights;

  beforeEach(async () => {
    repositorio = new RepositorioInsights();
    try {
      await repositorio.limparTudo();
    } catch {
      // Ignora caso container indisponível
    }
  });

  afterAll(async () => {
    await encerrarPoolConexao();
  });

  const insightExemplo: InsightAnomalia = {
    detectadoEm: new Date(),
    tipo: 'pico_preco',
    severidade: 'alta',
    praca: 'aeroporto_confins',
    categoria: 'economico',
    periodo: '2026-10-20 até 2026-10-23',
    metricas: {
      zScore: 3.25,
      mediana: 120.0,
      precoAtual: 195.0,
      variacaoPercentual: 62.5
    },
    narrativa: 'Tarifa da categoria econômico em Confins subiu abruptamente 62.5% em relação à mediana histórica.',
    status: 'novo'
  };

  it('deve persistir um insight individual e retornar ID gerado', async () => {
    const salvo = await repositorio.salvar(insightExemplo);

    expect(salvo.id).toBeDefined();
    expect(salvo.tipo).toBe('pico_preco');
    expect(salvo.severidade).toBe('alta');
    expect(salvo.metricas.zScore).toBe(3.25);
    expect(salvo.status).toBe('novo');
  });

  it('deve salvar insights em lote e permitir filtro por severidade e praça', async () => {
    const lote: InsightAnomalia[] = [
      insightExemplo,
      {
        ...insightExemplo,
        tipo: 'concorrente_mais_barato',
        severidade: 'critica',
        narrativa: 'Movida aplicou desconto agressivo de 35% na praça Confins.'
      }
    ];

    const totalInserido = await repositorio.salvarLote(lote);
    expect(totalInserido).toBe(2);

    const criticos = await repositorio.buscarPorFiltro({ severidade: 'critica' });
    expect(criticos.length).toBe(1);
    expect(criticos[0].tipo).toBe('concorrente_mais_barato');
  });

  it('deve permitir atualizar status para loop de feedback humano', async () => {
    const salvo = await repositorio.salvar(insightExemplo);
    expect(salvo.id).toBeDefined();

    await repositorio.atualizarStatus(salvo.id!, 'verificado_humano');

    const atualizados = await repositorio.buscarPorFiltro({ status: 'verificado_humano' });
    expect(atualizados.length).toBe(1);
    expect(atualizados[0].id).toBe(salvo.id);
  });
});
