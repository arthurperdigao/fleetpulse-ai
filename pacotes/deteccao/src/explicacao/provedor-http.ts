/**
 * Provedor HTTP para integração com APIs de LLMs (OpenAI, Gemini, Ollama, etc.).
 * Utiliza o fetch nativo do Node.js 20+ sem adicionar dependências externas desnecessárias.
 * Regra: Código 100% em Português do Brasil.
 */

import { ProvedorLLM, MensagemChat, OpcoesGeracaoLLM, RespostaLLM } from './contrato-llm.js';

export interface ConfiguracaoProvedorHttp {
  urlEndpoint?: string; // Padrão: process.env.LLM_ENDPOINT ou https://api.openai.com/v1/chat/completions
  chaveApi?: string; // Padrão: process.env.FLEETPULSE_LLM_API_KEY ou OPENAI_API_KEY
  modelo?: string; // Padrão: 'gpt-4o-mini' ou 'gemini-1.5-flash'
  timeoutMs?: number; // Padrão: 10000ms
}

export class ProvedorHttp implements ProvedorLLM {
  public readonly nome = 'Provedor HTTP (OpenAI / Gemini / Ollama)';
  private endpoint: string;
  private chaveApi?: string;
  private modelo: string;
  private timeoutMs: number;

  constructor(config: ConfiguracaoProvedorHttp = {}) {
    this.endpoint =
      config.urlEndpoint ||
      process.env.LLM_ENDPOINT ||
      'https://api.openai.com/v1/chat/completions';
    this.chaveApi =
      config.chaveApi ||
      process.env.FLEETPULSE_LLM_API_KEY ||
      process.env.OPENAI_API_KEY ||
      process.env.GEMINI_API_KEY;
    this.modelo = config.modelo || process.env.LLM_MODELO || 'gpt-4o-mini';
    this.timeoutMs = config.timeoutMs || 10000;
  }

  async gerarTexto(mensagens: MensagemChat[], opcoes: OpcoesGeracaoLLM = {}): Promise<RespostaLLM> {
    if (!this.chaveApi && !this.endpoint.includes('localhost') && !this.endpoint.includes('127.0.0.1')) {
      throw new Error(
        'Chave de API de LLM não configurada. Defina FLEETPULSE_LLM_API_KEY ou utilize o ProvedorSimulado.'
      );
    }

    const payload = {
      model: this.modelo,
      messages: mensagens.map((m) => ({
        role: m.papel === 'sistema' ? 'system' : m.papel === 'assistente' ? 'assistant' : 'user',
        content: m.conteudo
      })),
      temperature: opcoes.temperatura ?? 0.2,
      max_tokens: opcoes.maxTokens ?? 300
    };

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const resposta = await fetch(this.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.chaveApi ? { Authorization: `Bearer ${this.chaveApi}` } : {})
        },
        body: JSON.stringify(payload),
        signal: controller.signal
      });

      if (!resposta.ok) {
        const corpoErro = await resposta.text();
        throw new Error(`Erro na chamada da API de LLM (${resposta.status}): ${corpoErro}`);
      }

      const dados: any = await resposta.json();
      const texto = dados.choices?.[0]?.message?.content?.trim() || '';
      const tokensUtilizados = dados.usage?.total_tokens;

      return {
        texto,
        modelo: this.modelo,
        tokensUtilizados
      };
    } finally {
      clearTimeout(timeout);
    }
  }
}
