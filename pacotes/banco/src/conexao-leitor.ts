/**
 * Gerenciador de conexão com o perfil restrito de leitura (leitor_agente).
 * 
 * Princípio Arquitetural de Segurança e Defesa em Profundidade:
 * As ferramentas (tools) de consulta SQL do agente utilizam exclusivamente este pool,
 * que possui apenas permissão de SELECT nas tabelas cotacoes e insights.
 * Qualquer tentativa de mutação (INSERT, UPDATE, DELETE, DROP) ou injeção de prompt
 * é bloqueada a nível de banco de dados pelo PostgreSQL.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import pg from 'pg';
import { obterConfiguracaoBanco, ConfiguracaoBanco } from './conexao.js';

const { Pool } = pg;

let poolLeitorSingleton: pg.Pool | null = null;

export function obterPoolLeitor(sobreposicoes?: ConfiguracaoBanco): pg.Pool {
  if (!poolLeitorSingleton) {
    const configPadrao = obterConfiguracaoBanco(sobreposicoes);

    poolLeitorSingleton = new Pool({
      ...configPadrao,
      user: process.env.BANCO_LEITOR_USUARIO || 'leitor_agente',
      password: process.env.BANCO_LEITOR_SENHA || 'leitor_agente_senha',
      max: 5,
      connectionTimeoutMillis: 3000
    });

    poolLeitorSingleton.on('error', (erro) => {
      console.error('[FleetPulse:BancoLeitor] Erro inesperado no cliente de leitura:', erro);
    });
  }

  return poolLeitorSingleton;
}

export async function encerrarPoolLeitor(): Promise<void> {
  if (poolLeitorSingleton) {
    await poolLeitorSingleton.end();
    poolLeitorSingleton = null;
  }
}
