import { describe, it, expect } from 'vitest';
import {
  GeradorEmbeddingsSimulado,
  normalizarVetorL2,
  DIMENSAO_EMBEDDING_PADRAO
} from './servico-embeddings.js';

describe('ServicoEmbeddings', () => {
  it('deve normalizar o vetor para norma L2 unitária', () => {
    const vetorOriginal = [3, 4]; // norma = 5
    const normalizado = normalizarVetorL2(vetorOriginal);

    expect(normalizado[0]).toBeCloseTo(0.6, 4);
    expect(normalizado[1]).toBeCloseTo(0.8, 4);

    const normaFinal = Math.sqrt(normalizado[0] ** 2 + normalizado[1] ** 2);
    expect(normaFinal).toBeCloseTo(1.0, 4);
  });

  it('deve gerar vetor de 1536 dimensões para pgvector', async () => {
    const gerador = new GeradorEmbeddingsSimulado();
    const embedding = await gerador.gerarEmbedding('Pico de preço em Confins para categoria econômico');

    expect(embedding.length).toBe(DIMENSAO_EMBEDDING_PADRAO);

    // Conferir se a norma do vetor gerado é 1.0
    const norma = Math.sqrt(embedding.reduce((s, v) => s + v * v, 0));
    expect(norma).toBeCloseTo(1.0, 2);
  });

  it('deve apresentar similaridade de cosseno superior entre frases com vocabulário correlato', async () => {
    const gerador = new GeradorEmbeddingsSimulado();

    const emb1 = await gerador.gerarEmbedding('Aumento de tarifa Localiza na praça Aeroporto Confins');
    const emb2 = await gerador.gerarEmbedding('Tarifa elevada na Localiza em Confins');
    const emb3 = await gerador.gerarEmbedding('Receita de bolo de chocolate com morango');

    // Produto escalar entre vetores normalizados é a similaridade de cosseno
    const produtoEscalar = (v1: number[], v2: number[]) =>
      v1.reduce((soma, val, i) => soma + val * v2[i], 0);

    const similaridadeCorrelata = produtoEscalar(emb1, emb2);
    const similaridadeDistante = produtoEscalar(emb1, emb3);

    expect(similaridadeCorrelata).toBeGreaterThan(similaridadeDistante);
  });
});
