/**
 * Ferramenta 1: Consulta SQL Somente-Leitura.
 * 
 * Princípio Arquitetural de Segurança e Defesa em Profundidade:
 * Executa consultas SQL estritamente SELECT através do perfil restrito leitor_agente.
 * Possui dupla barreira de proteção:
 * 1. Validação estática no código (bloqueia comandos de mutação DDL/DML).
 * 2. Bloqueio no próprio PostgreSQL (o usuário leitor_agente não possui permissão de escrita).
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { z } from 'zod';
import pg from 'pg';
import { obterPoolLeitor } from '@fleetpulse/banco';
import { FerramentaAgente } from './contrato-ferramenta.js';

export const EsquemaParametrosConsultaSql = z.object({
  consultaSql: z
    .string()
    .min(5, 'A consulta SQL não pode ser vazia')
    .refine(
      (sql) => {
        const limpo = sql.trim().toLowerCase();
        // Permite apenas comandos SELECT ou WITH (CTEs)
        return limpo.startsWith('select') || limpo.startsWith('with');
      },
      { message: 'Apenas consultas SELECT ou WITH de somente-leitura são permitidas.' }
    )
    .refine(
      (sql) => {
        // Bloqueio de mutações explícitas
        const proibidos = [
          /\binsert\b/i,
          /\bupdate\b/i,
          /\bdelete\b/i,
          /\bdrop\b/i,
          /\balter\b/i,
          /\btruncate\b/i,
          /\bcreate\b/i,
          /\bgrant\b/i,
          /\brevoke\b/i
        ];
        return !proibidos.some((regex) => regex.test(sql));
      },
      { message: 'Instruções de modificação de dados ou esquema são estritamente proibidas.' }
    )
});

export type ParametrosConsultaSql = z.infer<typeof EsquemaParametrosConsultaSql>;

export interface ResultadoConsultaSql {
  linhas: Record<string, any>[];
  totalLinhas: number;
  colunas: string[];
  tempoExecucaoMs: number;
}

export class FerramentaConsultaSql
  implements FerramentaAgente<ParametrosConsultaSql, ResultadoConsultaSql>
{
  public readonly nome = 'consulta_sql';
  public readonly descricao =
    'Executa consultas analíticas SQL somente-leitura nas tabelas cotacoes e insights para responder perguntas com números verificados.';
  public readonly esquemaParametros = EsquemaParametrosConsultaSql;

  constructor(private readonly pool: pg.Pool = obterPoolLeitor()) {}

  async executar(parametros: ParametrosConsultaSql): Promise<ResultadoConsultaSql> {
    const inicio = performance.now();
    const sqlValidada = this.esquemaParametros.parse(parametros).consultaSql;

    // Garante cláusula LIMIT se não existir para prevenir consultas desmedidas
    let sqlFinal = sqlValidada.trim();
    if (!/\blimit\b/i.test(sqlFinal)) {
      sqlFinal = `${sqlFinal.replace(/;+$/, '')} LIMIT 50;`;
    }

    const resultado = await this.pool.query(sqlFinal);
    const duracaoMs = Math.round(performance.now() - inicio);

    const colunas = resultado.fields ? resultado.fields.map((f) => f.name) : [];

    return {
      linhas: resultado.rows,
      totalLinhas: resultado.rows.length,
      colunas,
      tempoExecucaoMs: duracaoMs
    };
  }

  extrairNumerosAutorizados(resultado: ResultadoConsultaSql): number[] {
    const numeros: number[] = [];
    for (const linha of resultado.linhas) {
      for (const valor of Object.values(linha)) {
        if (typeof valor === 'number' && !isNaN(valor)) {
          numeros.push(Math.abs(valor));
          numeros.push(Math.floor(Math.abs(valor)));
          numeros.push(Math.ceil(Math.abs(valor)));
        } else if (typeof valor === 'string') {
          const num = parseFloat(valor);
          if (!isNaN(num) && /^-?\d+(\.\d+)?$/.test(valor.trim())) {
            numeros.push(Math.abs(num));
            numeros.push(Math.floor(Math.abs(num)));
            numeros.push(Math.ceil(Math.abs(num)));
          }
        }
      }
    }
    return Array.from(new Set(numeros));
  }
}
