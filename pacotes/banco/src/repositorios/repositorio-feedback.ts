/**
 * Repositório de Feedback Humano (Human-in-the-Loop).
 * Registra aprovações, correções de analistas e alimenta o loop de melhoria contínua do RAG.
 * Regra: Código 100% em Português do Brasil.
 */

import pg from 'pg';
import { obterPoolConexao } from '../conexao.js';

export interface FeedbackAnalista {
  id?: string;
  insightId: string;
  avaliadoEm?: Date;
  ehUtil: boolean;
  correcao?: string;
  revisadoPor?: string;
}

export class RepositorioFeedback {
  private pool: pg.Pool;

  constructor(pool?: pg.Pool) {
    this.pool = pool || obterPoolConexao();
  }

  /**
   * Salva a avaliação do analista para um insight e sincroniza o status do insight.
   */
  async salvar(feedback: FeedbackAnalista): Promise<FeedbackAnalista> {
    const consulta = `
      INSERT INTO feedback (
        insight_id,
        avaliado_em,
        eh_util,
        correcao,
        revisado_por
      ) VALUES (
        $1, COALESCE($2, NOW()), $3, $4, COALESCE($5, 'analista_precos')
      )
      RETURNING *;
    `;

    const valores = [
      feedback.insightId,
      feedback.avaliadoEm || null,
      feedback.ehUtil,
      feedback.correcao || null,
      feedback.revisadoPor || null
    ];

    const resultado = await this.pool.query(consulta, valores);
    const linha = resultado.rows[0];

    // Atualiza automaticamente o status do insight correspondente
    const novoStatus = feedback.ehUtil ? 'verificado_humano' : 'rejeitado_humano';
    await this.pool.query('UPDATE insights SET status = $1 WHERE id = $2;', [
      novoStatus,
      feedback.insightId
    ]);

    return {
      id: linha.id,
      insightId: linha.insight_id,
      avaliadoEm: new Date(linha.avaliado_em),
      ehUtil: Boolean(linha.eh_util),
      correcao: linha.correcao || undefined,
      revisadoPor: linha.revisado_por
    };
  }

  /**
   * Busca todas as avaliações registradas para um determinado insight.
   */
  async buscarPorInsight(insightId: string): Promise<FeedbackAnalista[]> {
    const consulta = `
      SELECT * FROM feedback
      WHERE insight_id = $1
      ORDER BY avaliado_em DESC;
    `;

    const resultado = await this.pool.query(consulta, [insightId]);

    return resultado.rows.map((linha) => ({
      id: linha.id,
      insightId: linha.insight_id,
      avaliadoEm: new Date(linha.avaliado_em),
      ehUtil: Boolean(linha.eh_util),
      correcao: linha.correcao || undefined,
      revisadoPor: linha.revisado_por
    }));
  }
}
