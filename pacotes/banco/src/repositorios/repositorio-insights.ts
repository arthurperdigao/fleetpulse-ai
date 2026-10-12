import pg from 'pg';
import {
  InsightAnomalia,
  EsquemaInsightAnomalia,
  TipoAnomalia,
  Severidade,
  Praca,
  Categoria
} from '@fleetpulse/esquemas';
import { obterPoolConexao } from '../conexao.js';

export interface FiltroInsights {
  tipo?: TipoAnomalia;
  severidade?: Severidade;
  praca?: Praca;
  categoria?: Categoria;
  status?: 'novo' | 'verificado_humano' | 'rejeitado_humano';
  limite?: number;
}

/**
 * Converte linha do banco (snake_case) para a entidade InsightAnomalia (camelCase)
 */
export function mapearLinhaParaInsight(linha: any): InsightAnomalia {
  return EsquemaInsightAnomalia.parse({
    id: linha.id,
    detectadoEm: new Date(linha.detectado_em),
    tipo: linha.tipo,
    severidade: linha.severidade,
    praca: linha.praca,
    categoria: linha.categoria,
    periodo: linha.periodo,
    metricas: typeof linha.metricas === 'string' ? JSON.parse(linha.metricas) : linha.metricas,
    narrativa: linha.narrativa,
    status: linha.status
  });
}

/**
 * Repositório para persistência e consulta de insights e anomalias de mercado.
 */
export class RepositorioInsights {
  private pool: pg.Pool;

  constructor(pool?: pg.Pool) {
    this.pool = pool || obterPoolConexao();
  }

  /**
   * Salva um único insight no banco de dados.
   */
  async salvar(insight: InsightAnomalia): Promise<InsightAnomalia> {
    const validado = EsquemaInsightAnomalia.parse(insight);

    const consulta = `
      INSERT INTO insights (
        detectado_em,
        tipo,
        severidade,
        praca,
        categoria,
        periodo,
        metricas,
        narrativa,
        status
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9
      )
      RETURNING *;
    `;

    const valores = [
      validado.detectadoEm,
      validado.tipo,
      validado.severidade,
      validado.praca,
      validado.categoria,
      validado.periodo,
      JSON.stringify(validado.metricas),
      validado.narrativa,
      validado.status
    ];

    const resultado = await this.pool.query(consulta, valores);
    return mapearLinhaParaInsight(resultado.rows[0]);
  }

  /**
   * Salva lote de insights em uma única instrução SQL multi-row.
   */
  async salvarLote(insights: InsightAnomalia[]): Promise<number> {
    if (!insights || insights.length === 0) {
      return 0;
    }

    const validados = insights.map((i) => EsquemaInsightAnomalia.parse(i));
    const camposPorLinha = 9;
    const clausulasValores: string[] = [];
    const parametros: any[] = [];

    validados.forEach((insight, indice) => {
      const deslocamento = indice * camposPorLinha;
      const marcadores = Array.from(
        { length: camposPorLinha },
        (_, i) => `$${deslocamento + i + 1}`
      ).join(', ');

      clausulasValores.push(`(${marcadores})`);

      parametros.push(
        insight.detectadoEm,
        insight.tipo,
        insight.severidade,
        insight.praca,
        insight.categoria,
        insight.periodo,
        JSON.stringify(insight.metricas),
        insight.narrativa,
        insight.status
      );
    });

    const consulta = `
      INSERT INTO insights (
        detectado_em,
        tipo,
        severidade,
        praca,
        categoria,
        periodo,
        metricas,
        narrativa,
        status
      ) VALUES ${clausulasValores.join(', ')};
    `;

    const resultado = await this.pool.query(consulta, parametros);
    return resultado.rowCount || 0;
  }

  /**
   * Busca insights por filtros dinâmicos com ordenação mais recente primeiro.
   */
  async buscarPorFiltro(filtro: FiltroInsights = {}): Promise<InsightAnomalia[]> {
    const condicoes: string[] = [];
    const parametros: any[] = [];
    let contador = 1;

    if (filtro.tipo) {
      condicoes.push(`tipo = $${contador++}`);
      parametros.push(filtro.tipo);
    }

    if (filtro.severidade) {
      condicoes.push(`severidade = $${contador++}`);
      parametros.push(filtro.severidade);
    }

    if (filtro.praca) {
      condicoes.push(`praca = $${contador++}`);
      parametros.push(filtro.praca);
    }

    if (filtro.categoria) {
      condicoes.push(`categoria = $${contador++}`);
      parametros.push(filtro.categoria);
    }

    if (filtro.status) {
      condicoes.push(`status = $${contador++}`);
      parametros.push(filtro.status);
    }

    const onde = condicoes.length > 0 ? `WHERE ${condicoes.join(' AND ')}` : '';
    const limite = filtro.limite ? `LIMIT ${Number(filtro.limite)}` : 'LIMIT 100';

    const consulta = `
      SELECT * FROM insights
      ${onde}
      ORDER BY detectado_em DESC
      ${limite};
    `;

    const resultado = await this.pool.query(consulta, parametros);
    return resultado.rows.map(mapearLinhaParaInsight);
  }

  /**
   * Atualiza o status do insight (ex: após validação ou correção pelo analista).
   */
  async atualizarStatus(
    id: string,
    status: 'novo' | 'verificado_humano' | 'rejeitado_humano'
  ): Promise<void> {
    await this.pool.query('UPDATE insights SET status = $1 WHERE id = $2;', [status, id]);
  }

  /**
   * Limpa todos os insights (usado para testes de integração).
   */
  async limparTudo(): Promise<void> {
    await this.pool.query('TRUNCATE TABLE insights CASCADE;');
  }
}
