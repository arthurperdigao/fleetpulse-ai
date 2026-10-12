/**
 * Contrato base para as ferramentas (tools) do Agente FleetPulse AI.
 * Cada ferramenta possui schema de parâmetros validado com Zod e
 * método para extrair números autorizados para a auditoria anti-alucinação.
 * Regra: Código 100% em Português do Brasil.
 */

import { z } from 'zod';

export interface FerramentaAgente<TParametros = any, TResultado = any> {
  readonly nome: string;
  readonly descricao: string;
  readonly esquemaParametros: z.ZodType<TParametros>;
  executar(parametros: TParametros): Promise<TResultado>;
  extrairNumerosAutorizados(resultado: TResultado): number[];
}
