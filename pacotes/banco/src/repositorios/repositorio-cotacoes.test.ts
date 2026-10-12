import { describe, it, expect, vi, beforeEach, afterAll } from 'vitest';
import pg from 'pg';
import { Cotacao } from '@fleetpulse/esquemas';
import { RepositorioCotacoes, mapearLinhaParaCotacao } from './repositorio-cotacoes.js';
import { obterPoolConexao, encerrarPoolConexao } from '../conexao.js';

describe('RepositorioCotacoes - Testes Unitários', () => {
  const cotacaoExemplo: Cotacao = {
    capturadoEm: new Date('2026-10-12T10:00:00Z'),
    fonte: 'localiza',
    praca: 'aeroporto_confins',
    categoria: 'economico',
    dataRetirada: new Date('2026-10-20T10:00:00Z'),
    dataDevolucao: new Date('2026-10-23T10:00:00Z'),
    duracaoDias: 3,
    antecedenciaDias: 8,
    precoDiaria: 129.9,
    precoTotal: 389.7,
    disponivel: true,
    grupoOriginal: 'Grupo B - Compacto Com Ar',
    modeloExemplo: 'Fiat Mobi 1.0',
    referenciaBruta: 'hash-ref-123'
  };

  it('deve converter corretamente uma linha do PostgreSQL para a entidade Cotacao', () => {
    const linhaPostgres = {
      id: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
      capturado_em: '2026-10-12T10:00:00Z',
      fonte: 'localiza',
      praca: 'aeroporto_confins',
      categoria: 'economico',
      data_retirada: '2026-10-20T10:00:00Z',
      data_devolucao: '2026-10-23T10:00:00Z',
      duracao_dias: 3,
      antecedencia_dias: 8,
      preco_diaria: '129.90',
      preco_total: '389.70',
      disponivel: true,
      grupo_original: 'Grupo B - Compacto Com Ar',
      modelo_exemplo: 'Fiat Mobi 1.0',
      referencia_bruta: 'hash-ref-123'
    };

    const cotacao = mapearLinhaParaCotacao(linhaPostgres);

    expect(cotacao.id).toBe('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11');
    expect(cotacao.fonte).toBe('localiza');
    expect(cotacao.precoDiaria).toBe(129.9);
    expect(cotacao.precoTotal).toBe(389.7);
    expect(cotacao.duracaoDias).toBe(3);
    expect(cotacao.capturadoEm).toBeInstanceOf(Date);
  });

  it('deve salvar uma única cotação chamando a consulta parametrizada correta', async () => {
    const mockQuery = vi.fn().mockResolvedValue({
      rows: [
        {
          id: 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
          capturado_em: cotacaoExemplo.capturadoEm.toISOString(),
          fonte: cotacaoExemplo.fonte,
          praca: cotacaoExemplo.praca,
          categoria: cotacaoExemplo.categoria,
          data_retirada: cotacaoExemplo.dataRetirada.toISOString(),
          data_devolucao: cotacaoExemplo.dataDevolucao.toISOString(),
          duracao_dias: cotacaoExemplo.duracaoDias,
          antecedencia_dias: cotacaoExemplo.antecedenciaDias,
          preco_diaria: '129.90',
          preco_total: '389.70',
          disponivel: true,
          grupo_original: cotacaoExemplo.grupoOriginal,
          modelo_exemplo: cotacaoExemplo.modeloExemplo,
          referencia_bruta: cotacaoExemplo.referenciaBruta
        }
      ]
    });

    const mockPool = { query: mockQuery } as unknown as pg.Pool;
    const repositorio = new RepositorioCotacoes(mockPool);

    const salva = await repositorio.salvar(cotacaoExemplo);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(salva.id).toBe('b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22');
    expect(salva.precoDiaria).toBe(129.9);
  });

  it('deve lidar com lote vazio retornando 0 sem executar consulta SQL', async () => {
    const mockQuery = vi.fn();
    const mockPool = { query: mockQuery } as unknown as pg.Pool;
    const repositorio = new RepositorioCotacoes(mockPool);

    const total = await repositorio.salvarLote([]);

    expect(total).toBe(0);
    expect(mockQuery).not.toHaveBeenCalled();
  });

  it('deve salvar lote de cotações com múltiplos marcadores na consulta SQL', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rowCount: 2 });
    const mockPool = { query: mockQuery } as unknown as pg.Pool;
    const repositorio = new RepositorioCotacoes(mockPool);

    const total = await repositorio.salvarLote([cotacaoExemplo, cotacaoExemplo]);

    expect(mockQuery).toHaveBeenCalledTimes(1);
    expect(total).toBe(2);
    const sqlExecutado = mockQuery.mock.calls[0][0];
    expect(sqlExecutado).toContain('INSERT INTO cotacoes');
    expect(sqlExecutado).toContain('$14');
    expect(sqlExecutado).toContain('$28');
  });

  it('deve aplicar filtros dinâmicos na busca por filtro', async () => {
    const mockQuery = vi.fn().mockResolvedValue({ rows: [] });
    const mockPool = { query: mockQuery } as unknown as pg.Pool;
    const repositorio = new RepositorioCotacoes(mockPool);

    await repositorio.buscarPorFiltro({
      praca: 'aeroporto_confins',
      categoria: 'economico',
      fonte: 'localiza',
      limite: 25
    });

    expect(mockQuery).toHaveBeenCalledTimes(1);
    const [sqlExecutado, parametros] = mockQuery.mock.calls[0];
    expect(sqlExecutado).toContain('WHERE');
    expect(sqlExecutado).toContain('fonte = $1');
    expect(sqlExecutado).toContain('praca = $2');
    expect(sqlExecutado).toContain('categoria = $3');
    expect(sqlExecutado).toContain('LIMIT 25');
    expect(parametros).toEqual(['localiza', 'aeroporto_confins', 'economico']);
  });
});

describe('RepositorioCotacoes - Testes de Integração com TimescaleDB', () => {
  let repositorio: RepositorioCotacoes;

  beforeEach(async () => {
    repositorio = new RepositorioCotacoes();
    try {
      await repositorio.limparTudo();
    } catch {
      // Ignora caso container não esteja acessível em ambiente sem banco
    }
  });

  afterAll(async () => {
    await encerrarPoolConexao();
  });

  it('deve persistir e recuperar cotações reais na tabela cotacoes do PostgreSQL', async () => {
    const cotacaoReal: Cotacao = {
      capturadoEm: new Date(),
      fonte: 'localiza',
      praca: 'aeroporto_confins',
      categoria: 'economico',
      dataRetirada: new Date('2026-11-01T10:00:00Z'),
      dataDevolucao: new Date('2026-11-04T10:00:00Z'),
      duracaoDias: 3,
      antecedenciaDias: 20,
      precoDiaria: 145.5,
      precoTotal: 436.5,
      disponivel: true,
      grupoOriginal: 'Grupo B',
      modeloExemplo: 'Fiat Mobi ou similar'
    };

    // 1. Salvar
    const salva = await repositorio.salvar(cotacaoReal);
    expect(salva.id).toBeDefined();
    expect(salva.precoDiaria).toBe(145.5);

    // 2. Contar
    const total = await repositorio.contarTotal({ praca: 'aeroporto_confins' });
    expect(total).toBe(1);

    // 3. Buscar por filtro
    const encontradas = await repositorio.buscarPorFiltro({
      praca: 'aeroporto_confins',
      categoria: 'economico'
    });

    expect(encontradas.length).toBe(1);
    expect(encontradas[0].fonte).toBe('localiza');
    expect(encontradas[0].precoTotal).toBe(436.5);
  });

  it('deve salvar em lote cotações e respeitar os índices temporais', async () => {
    const lote: Cotacao[] = [
      {
        capturadoEm: new Date(),
        fonte: 'localiza',
        praca: 'pampulha',
        categoria: 'intermediario',
        dataRetirada: new Date('2026-11-10T10:00:00Z'),
        dataDevolucao: new Date('2026-11-12T10:00:00Z'),
        duracaoDias: 2,
        antecedenciaDias: 29,
        precoDiaria: 180.0,
        precoTotal: 360.0,
        disponivel: true
      },
      {
        capturadoEm: new Date(),
        fonte: 'movida',
        praca: 'pampulha',
        categoria: 'intermediario',
        dataRetirada: new Date('2026-11-10T10:00:00Z'),
        dataDevolucao: new Date('2026-11-12T10:00:00Z'),
        duracaoDias: 2,
        antecedenciaDias: 29,
        precoDiaria: 165.0,
        precoTotal: 330.0,
        disponivel: true
      }
    ];

    const inseridas = await repositorio.salvarLote(lote);
    expect(inseridas).toBe(2);

    const filtradas = await repositorio.buscarPorFiltro({ praca: 'pampulha' });
    expect(filtradas.length).toBe(2);
  });
});
