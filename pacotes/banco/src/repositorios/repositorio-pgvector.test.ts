import { describe, it, expect, beforeEach, afterAll } from 'vitest';
import { InsightAnomalia } from '@fleetpulse/esquemas';
import { RepositorioInsights } from './repositorio-insights.js';
import { RepositorioFeedback } from './repositorio-feedback.js';
import { GeradorEmbeddingsSimulado } from '../servicos/servico-embeddings.js';
import { obterPoolLeitor, encerrarPoolLeitor } from '../conexao-leitor.js';
import { encerrarPoolConexao } from '../conexao.js';

describe('pgvector & RAG Semântico - Integração Real com TimescaleDB', () => {
  let repositorioInsights: RepositorioInsights;
  let repositorioFeedback: RepositorioFeedback;
  let geradorEmbeddings: GeradorEmbeddingsSimulado;

  beforeEach(async () => {
    repositorioInsights = new RepositorioInsights();
    repositorioFeedback = new RepositorioFeedback();
    geradorEmbeddings = new GeradorEmbeddingsSimulado();
    try {
      await repositorioInsights.limparTudo();
    } catch {
      // Ignora se indisponível
    }
  });

  afterAll(async () => {
    await encerrarPoolLeitor();
    await encerrarPoolConexao();
  });

  it('deve indexar insight com embedding de 1536 dimensões e realizar busca semântica por cosseno', async () => {
    const narrativa1 = 'Pico severo de preço na Localiza em Confins para carros econômicos durante o feriado.';
    const narrativa2 = 'Movida aplicou desconto agressivo de 30% em sedans na região da Pampulha.';

    const emb1 = await geradorEmbeddings.gerarEmbedding(narrativa1);
    const emb2 = await geradorEmbeddings.gerarEmbedding(narrativa2);

    const insight1: InsightAnomalia = {
      detectadoEm: new Date(),
      tipo: 'pico_preco',
      severidade: 'critica',
      praca: 'aeroporto_confins',
      categoria: 'economico',
      periodo: '2026-10-20 até 2026-10-23',
      metricas: { precoAtual: 210.0, mediana: 120.0, zScore: 4.1 },
      narrativa: narrativa1,
      status: 'novo'
    };

    const insight2: InsightAnomalia = {
      detectadoEm: new Date(),
      tipo: 'concorrente_mais_barato',
      severidade: 'alta',
      praca: 'pampulha',
      categoria: 'intermediario',
      periodo: '2026-10-20 até 2026-10-23',
      metricas: { gapPercentual: 30.0 },
      narrativa: narrativa2,
      status: 'novo'
    };

    // 1. Salvar com embeddings
    const salvo1 = await repositorioInsights.salvar(insight1, emb1);
    await repositorioInsights.salvar(insight2, emb2);

    expect(salvo1.id).toBeDefined();

    // 2. Realizar busca semântica com uma pergunta do usuário
    const embeddingPergunta = await geradorEmbeddings.gerarEmbedding('Houve aumento abusivo de tarifa em Confins?');
    const similares = await repositorioInsights.buscarSimilares(embeddingPergunta, { limite: 2 });

    expect(similares.length).toBe(2);
    // O insight sobre Confins deve ser o primeiro resultado (maior similaridade)
    expect(similares[0].praca).toBe('aeroporto_confins');
    expect(similares[0].similaridade).toBeGreaterThan(similares[1].similaridade);
  });

  it('deve enriquecer a busca semântica com correções do analista (Human-in-the-Loop)', async () => {
    const narrativa = 'Movida reduziu tarifa abruptamente na Savassi.';
    const emb = await geradorEmbeddings.gerarEmbedding(narrativa);

    const insight: InsightAnomalia = {
      detectadoEm: new Date(),
      tipo: 'concorrente_mais_barato',
      severidade: 'media',
      praca: 'savassi',
      categoria: 'suv',
      periodo: '2026-10-25 até 2026-10-28',
      metricas: { gapPercentual: 18.0 },
      narrativa,
      status: 'novo'
    };

    const salvo = await repositorioInsights.salvar(insight, emb);

    // Analista revisa e adiciona correção técnica
    await repositorioFeedback.salvar({
      insightId: salvo.id!,
      ehUtil: false,
      correcao: 'Promoção pontual de queima de estoque de final de semana, não é guerra tarifária estrutural.',
      revisadoPor: 'analista_senior_pricing'
    });

    const similares = await repositorioInsights.buscarSimilares(emb, { limite: 1 });

    expect(similares.length).toBe(1);
    expect(similares[0].status).toBe('rejeitado_humano');
    expect(similares[0].correcaoHumana).toContain('Promoção pontual');
  });

  it('deve garantir que o leitor_agente consegue consultar SELECT mas é bloqueado em mutações DELETE', async () => {
    const poolLeitor = obterPoolLeitor();

    // 1. SELECT deve funcionar normalmente
    const resultadoSelect = await poolLeitor.query('SELECT COUNT(*)::int as total FROM insights;');
    expect(resultadoSelect.rows[0].total).toBeGreaterThanOrEqual(0);

    // 2. DELETE ou DROP deve falhar por falta de permissão do PostgreSQL (zero risco de injeção de prompt)
    await expect(poolLeitor.query('DELETE FROM insights;')).rejects.toThrow(/permission denied/i);
  });
});
