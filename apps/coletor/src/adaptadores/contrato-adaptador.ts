/**
 * Contrato base para adaptadores de coleta de preços
 * Regra: Código 100% em Português do Brasil.
 */

import type { Cotacao, Fonte, Praca, Categoria } from '@fleetpulse/esquemas';

export interface ParametrosConsultaCotacao {
  fonte: Fonte;
  praca: Praca;
  categoria?: Categoria;
  dataRetirada: Date;
  duracaoDias: number;
}

export interface ResultadoColeta {
  sucesso: boolean;
  fonte: Fonte;
  praca: Praca;
  cotacoes: Cotacao[];
  errosValidacao?: string[];
  tempoExecucaoMs: number;
  modo: 'ao_vivo' | 'replay';
}

export interface AdaptadorColeta {
  nome: string;
  fonte: Fonte;
  coletar(parametros: ParametrosConsultaCotacao): Promise<ResultadoColeta>;
}
