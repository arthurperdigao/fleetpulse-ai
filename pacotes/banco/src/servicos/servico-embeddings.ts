/**
 * Serviço de Geração de Embeddings para indexação semântica no pgvector.
 * Suporta modo simulado determinístico (para testes e CI) e integração HTTP real.
 * Dimensão padrão: 1536 (compatível com OpenAI text-embedding-3-small e pgvector).
 * Regra: Código 100% em Português do Brasil.
 */

export const DIMENSAO_EMBEDDING_PADRAO = 1536;

export interface GeradorEmbeddings {
  readonly nome: string;
  readonly dimensao: number;
  gerarEmbedding(texto: string): Promise<number[]>;
}

/**
 * Normaliza um vetor numérico para que sua norma L2 (Euclidiana) seja exatamente 1.0.
 * Isso garante que o produto escalar e a distância de cosseno sejam matematicamente precisos.
 */
export function normalizarVetorL2(vetor: number[]): number[] {
  const normaQuadrada = vetor.reduce((soma, val) => soma + val * val, 0);
  const norma = Math.sqrt(normaQuadrada);

  if (norma === 0) {
    return new Array(vetor.length).fill(0);
  }

  return vetor.map((val) => Number((val / norma).toFixed(6)));
}

/**
 * Gera um embedding determinístico de 1536 dimensões sem chamadas externas de rede.
 * Textos com vocabulário comum ("Confins", "pico", "tarifa") compartilham peso direcional.
 */
export class GeradorEmbeddingsSimulado implements GeradorEmbeddings {
  public readonly nome = 'Gerador Embeddings Simulado (Determinístico)';
  public readonly dimensao: number;

  constructor(dimensao: number = DIMENSAO_EMBEDDING_PADRAO) {
    this.dimensao = dimensao;
  }

  async gerarEmbedding(texto: string): Promise<number[]> {
    if (!texto || texto.trim().length === 0) {
      return normalizarVetorL2(new Array(this.dimensao).fill(0.001));
    }

    const vetor = new Array(this.dimensao).fill(0);
    const palavras = texto.toLowerCase().replace(/[^\w\s]/g, '').split(/\s+/);

    for (let i = 0; i < palavras.length; i++) {
      const palavra = palavras[i];
      let hash = 0;
      for (let j = 0; j < palavra.length; j++) {
        hash = (hash << 5) - hash + palavra.charCodeAt(j);
        hash |= 0;
      }

      // Distribui energia em buckets de dimensão associados à palavra
      for (let k = 0; k < 8; k++) {
        const indice = Math.abs((hash + k * 97) % this.dimensao);
        const peso = ((hash >> (k * 3)) % 100) / 100.0;
        vetor[indice] += peso !== 0 ? peso : 0.1;
      }
    }

    return normalizarVetorL2(vetor);
  }
}

/**
 * Gerador de embeddings conectado a provedores HTTP reais (OpenAI text-embedding-3-small, etc.)
 */
export class GeradorEmbeddingsHttp implements GeradorEmbeddings {
  public readonly nome = 'Gerador Embeddings HTTP (OpenAI / Gemini / Ollama)';
  public readonly dimensao: number;
  private endpoint: string;
  private chaveApi?: string;
  private modelo: string;

  constructor(opcoes: {
    endpoint?: string;
    chaveApi?: string;
    modelo?: string;
    dimensao?: number;
  } = {}) {
    this.dimensao = opcoes.dimensao || DIMENSAO_EMBEDDING_PADRAO;
    this.endpoint =
      opcoes.endpoint ||
      process.env.EMBEDDING_ENDPOINT ||
      'https://api.openai.com/v1/embeddings';
    this.chaveApi =
      opcoes.chaveApi ||
      process.env.FLEETPULSE_LLM_API_KEY ||
      process.env.OPENAI_API_KEY;
    this.modelo = opcoes.modelo || process.env.EMBEDDING_MODELO || 'text-embedding-3-small';
  }

  async gerarEmbedding(texto: string): Promise<number[]> {
    if (!this.chaveApi && !this.endpoint.includes('localhost') && !this.endpoint.includes('127.0.0.1')) {
      throw new Error(
        'Chave de API não informada para geração de embeddings. Utilize GeradorEmbeddingsSimulado ou configure FLEETPULSE_LLM_API_KEY.'
      );
    }

    const resposta = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(this.chaveApi ? { Authorization: `Bearer ${this.chaveApi}` } : {})
      },
      body: JSON.stringify({
        model: this.modelo,
        input: texto,
        dimensions: this.dimensao
      })
    });

    if (!resposta.ok) {
      const erro = await resposta.text();
      throw new Error(`Erro na geração de embedding HTTP (${resposta.status}): ${erro}`);
    }

    const dados: any = await resposta.json();
    return dados.data[0].embedding;
  }
}
