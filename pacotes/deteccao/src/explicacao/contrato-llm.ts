/**
 * Contrato base para provedores de LLM.
 * Desacopla a chamada de IA do restante do pipeline de observabilidade.
 * Regra: Código 100% em Português do Brasil.
 */

export interface MensagemChat {
  papel: 'sistema' | 'usuario' | 'assistente';
  conteudo: string;
}

export interface OpcoesGeracaoLLM {
  temperatura?: number;
  maxTokens?: number;
}

export interface RespostaLLM {
  texto: string;
  modelo: string;
  tokensUtilizados?: number;
}

export interface ProvedorLLM {
  readonly nome: string;
  gerarTexto(mensagens: MensagemChat[], opcoes?: OpcoesGeracaoLLM): Promise<RespostaLLM>;
}
