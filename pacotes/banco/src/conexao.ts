import pg from 'pg';

const { Pool } = pg;

export interface ConfiguracaoBanco {
  host?: string;
  porta?: number;
  database?: string;
  usuario?: string;
  senha?: string;
  maxConexoes?: number;
  tempoLimiteConexaoMs?: number;
}

let poolSingleton: pg.Pool | null = null;

/**
 * Obtém as configurações padronizadas de conexão ao banco de dados PostgreSQL / TimescaleDB.
 * Dá prioridade às variáveis de ambiente, com fallback seguro para o ambiente de desenvolvimento local.
 */
export function obterConfiguracaoBanco(sobreposicoes?: ConfiguracaoBanco): pg.PoolConfig {
  return {
    host: sobreposicoes?.host || process.env.BANCO_HOST || 'localhost',
    port: sobreposicoes?.porta || Number(process.env.BANCO_PORTA) || 5433,
    database: sobreposicoes?.database || process.env.BANCO_NOME || 'fleetpulse',
    user: sobreposicoes?.usuario || process.env.BANCO_USUARIO || 'postgres',
    password: sobreposicoes?.senha || process.env.BANCO_SENHA || 'postgres',
    max: sobreposicoes?.maxConexoes || 10,
    connectionTimeoutMillis: sobreposicoes?.tempoLimiteConexaoMs || 5000
  };
}

/**
 * Retorna o Pool de conexões do banco de dados (reutilizando a instância singleton se já existir).
 */
export function obterPoolConexao(config?: ConfiguracaoBanco): pg.Pool {
  if (!poolSingleton) {
    const configCompleta = obterConfiguracaoBanco(config);
    poolSingleton = new Pool(configCompleta);

    poolSingleton.on('error', (erro) => {
      console.error('[FleetPulse:Banco] Erro inesperado no cliente ocioso do pool:', erro);
    });
  }

  return poolSingleton;
}

/**
 * Testa a conectividade com o banco de dados executando uma consulta simples (SELECT 1).
 */
export async function testarConexao(pool?: pg.Pool): Promise<boolean> {
  const clientePool = pool || obterPoolConexao();
  try {
    const resultado = await clientePool.query('SELECT 1 as conectado;');
    return resultado.rows.length > 0 && resultado.rows[0].conectado === 1;
  } catch (erro) {
    console.error('[FleetPulse:Banco] Falha ao testar conexão com o banco de dados:', erro);
    return false;
  }
}

/**
 * Encerra o pool de conexões singleton se estiver ativo.
 */
export async function encerrarPoolConexao(): Promise<void> {
  if (poolSingleton) {
    await poolSingleton.end();
    poolSingleton = null;
  }
}
