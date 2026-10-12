import pg from 'pg';
import { Cotacao, EsquemaCotacao, Fonte, Praca, Categoria } from '@fleetpulse/esquemas';
import { obterPoolConexao } from '../conexao.js';

export interface FiltroCotacoes {
  fonte?: Fonte;
  praca?: Praca;
  categoria?: Categoria;
  dataRetiradaInicio?: Date;
  dataRetiradaFim?: Date;
  capturadoApos?: Date;
  limite?: number;
}

/**
 * Converte um registro cru do PostgreSQL (snake_case) para a entidade tipada Cotacao (camelCase)
 */
export function mapearLinhaParaCotacao(linha: any): Cotacao {
  return EsquemaCotacao.parse({
    id: linha.id,
    capturadoEm: new Date(linha.capturado_em),
    fonte: linha.fonte,
    praca: linha.praca,
    categoria: linha.categoria,
    dataRetirada: new Date(linha.data_retirada),
    dataDevolucao: new Date(linha.data_devolucao),
    duracaoDias: Number(linha.duracao_dias),
    antecedenciaDias: Number(linha.antecedencia_dias),
    precoDiaria: Number(linha.preco_diaria),
    precoTotal: Number(linha.preco_total),
    disponivel: Boolean(linha.disponivel),
    grupoOriginal: linha.grupo_original || undefined,
    modeloExemplo: linha.modelo_exemplo || undefined,
    referenciaBruta: linha.referencia_bruta || undefined
  });
}

/**
 * Repositório de persistência e consulta analítica de cotações em TimescaleDB
 */
export class RepositorioCotacoes {
  private pool: pg.Pool;

  constructor(pool?: pg.Pool) {
    this.pool = pool || obterPoolConexao();
  }

  /**
   * Salva uma única cotação no banco de dados.
   */
  async salvar(cotacao: Cotacao): Promise<Cotacao> {
    const cotacaoValidada = EsquemaCotacao.parse(cotacao);

    const consulta = `
      INSERT INTO cotacoes (
        capturado_em,
        fonte,
        praca,
        categoria,
        data_retirada,
        data_devolucao,
        duracao_dias,
        antecedencia_dias,
        preco_diaria,
        preco_total,
        disponivel,
        grupo_original,
        modelo_exemplo,
        referencia_bruta
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14
      )
      RETURNING *;
    `;

    const valores = [
      cotacaoValidada.capturadoEm,
      cotacaoValidada.fonte,
      cotacaoValidada.praca,
      cotacaoValidada.categoria,
      cotacaoValidada.dataRetirada,
      cotacaoValidada.dataDevolucao,
      cotacaoValidada.duracaoDias,
      cotacaoValidada.antecedenciaDias,
      cotacaoValidada.precoDiaria,
      cotacaoValidada.precoTotal,
      cotacaoValidada.disponivel,
      cotacaoValidada.grupoOriginal || null,
      cotacaoValidada.modeloExemplo || null,
      cotacaoValidada.referenciaBruta || null
    ];

    const resultado = await this.pool.query(consulta, valores);
    return mapearLinhaParaCotacao(resultado.rows[0]);
  }

  /**
   * Salva uma lista de cotações em lote com uma única instrução SQL multi-row, otimizada para séries temporais.
   */
  async salvarLote(cotacoes: Cotacao[]): Promise<number> {
    if (!cotacoes || cotacoes.length === 0) {
      return 0;
    }

    const cotacoesValidadas = cotacoes.map((c) => EsquemaCotacao.parse(c));
    const camposPorLinha = 14;
    const clausulasValores: string[] = [];
    const parametros: any[] = [];

    cotacoesValidadas.forEach((cotacao, indice) => {
      const deslocamento = indice * camposPorLinha;
      const marcadores = Array.from(
        { length: camposPorLinha },
        (_, i) => `$${deslocamento + i + 1}`
      ).join(', ');

      clausulasValores.push(`(${marcadores})`);

      parametros.push(
        cotacao.capturadoEm,
        cotacao.fonte,
        cotacao.praca,
        cotacao.categoria,
        cotacao.dataRetirada,
        cotacao.dataDevolucao,
        cotacao.duracaoDias,
        cotacao.antecedenciaDias,
        cotacao.precoDiaria,
        cotacao.precoTotal,
        cotacao.disponivel,
        cotacao.grupoOriginal || null,
        cotacao.modeloExemplo || null,
        cotacao.referenciaBruta || null
      );
    });

    const consulta = `
      INSERT INTO cotacoes (
        capturado_em,
        fonte,
        praca,
        categoria,
        data_retirada,
        data_devolucao,
        duracao_dias,
        antecedencia_dias,
        preco_diaria,
        preco_total,
        disponivel,
        grupo_original,
        modelo_exemplo,
        referencia_bruta
      ) VALUES ${clausulasValores.join(', ')}
      ON CONFLICT DO NOTHING;
    `;

    const resultado = await this.pool.query(consulta, parametros);
    return resultado.rowCount || 0;
  }

  /**
   * Busca cotações com filtros dinâmicos e ordenação por tempo de captura descendente.
   */
  async buscarPorFiltro(filtro: FiltroCotacoes = {}): Promise<Cotacao[]> {
    const condicoes: string[] = [];
    const parametros: any[] = [];
    let contador = 1;

    if (filtro.fonte) {
      condicoes.push(`fonte = $${contador++}`);
      parametros.push(filtro.fonte);
    }

    if (filtro.praca) {
      condicoes.push(`praca = $${contador++}`);
      parametros.push(filtro.praca);
    }

    if (filtro.categoria) {
      condicoes.push(`categoria = $${contador++}`);
      parametros.push(filtro.categoria);
    }

    if (filtro.dataRetiradaInicio) {
      condicoes.push(`data_retirada >= $${contador++}`);
      parametros.push(filtro.dataRetiradaInicio);
    }

    if (filtro.dataRetiradaFim) {
      condicoes.push(`data_retirada <= $${contador++}`);
      parametros.push(filtro.dataRetiradaFim);
    }

    if (filtro.capturadoApos) {
      condicoes.push(`capturado_em >= $${contador++}`);
      parametros.push(filtro.capturadoApos);
    }

    const onde = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const limite = filtro.limite ? `LIMIT ${Number(filtro.limite)}` : 'LIMIT 100';

    const consulta = `
      SELECT * FROM cotacoes
      ${onde}
      ORDER BY capturado_em DESC
      ${limite};
    `;

    const resultado = await this.pool.query(consulta, parametros);
    return resultado.rows.map(mapearLinhaParaCotacao);
  }

  /**
   * Retorna a contagem total de cotações armazenadas no banco.
   */
  async contarTotal(filtro?: Pick<FiltroCotacoes, 'fonte' | 'praca' | 'categoria'>): Promise<number> {
    const condicoes: string[] = [];
    const parametros: any[] = [];
    let contador = 1;

    if (filtro?.fonte) {
      condicoes.push(`fonte = $${contador++}`);
      parametros.push(filtro.fonte);
    }

    if (filtro?.praca) {
      condicoes.push(`praca = $${contador++}`);
      parametros.push(filtro.praca);
    }

    if (filtro?.categoria) {
      condicoes.push(`categoria = $${contador++}`);
      parametros.push(filtro.categoria);
    }

    const onde = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const consulta = `SELECT COUNT(*)::int as total FROM cotacoes ${onde};`;

    const resultado = await this.pool.query(consulta, parametros);
    return resultado.rows[0]?.total || 0;
  }

  /**
   * Limpa todas as cotações (utilizado em testes de integração e recargas controladas).
   */
  async limparTudo(): Promise<void> {
    await this.pool.query('TRUNCATE TABLE cotacoes;');
  }
}
