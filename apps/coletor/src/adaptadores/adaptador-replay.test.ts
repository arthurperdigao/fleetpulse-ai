/**
 * Testes unitários do Adaptador de Replay
 * Regra: Código 100% em Português do Brasil.
 */

import { describe, it, expect } from 'vitest';
import { AdaptadorReplay } from './adaptador-replay.js';

describe('AdaptadorReplay', () => {
  it('deve coletar cotações da Localiza em Confins com sucesso e validação Zod', async () => {
    const adaptador = new AdaptadorReplay('localiza');

    const resultado = await adaptador.coletar({
      fonte: 'localiza',
      praca: 'aeroporto_confins',
      dataRetirada: new Date('2026-10-15T10:00:00.000Z'),
      duracaoDias: 3
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.modo).toBe('replay');
    expect(resultado.cotacoes.length).toBeGreaterThanOrEqual(3);

    // Verificar se as 3 categorias essenciais foram retornadas
    const categorias = resultado.cotacoes.map(c => c.categoria);
    expect(categorias).toContain('economico');
    expect(categorias).toContain('intermediario');
    expect(categorias).toContain('suv');

    // Validações de integridade financeira
    for (const cotacao of resultado.cotacoes) {
      expect(cotacao.precoDiaria).toBeGreaterThan(0);
      expect(cotacao.precoTotal).toBe(Number((cotacao.precoDiaria * cotacao.duracaoDias).toFixed(2)));
      expect(cotacao.disponivel).toBe(true);
    }
  });

  it('deve filtrar cotações estritamente por categoria quando solicitada', async () => {
    const adaptador = new AdaptadorReplay('localiza');

    const resultado = await adaptador.coletar({
      fonte: 'localiza',
      praca: 'aeroporto_confins',
      categoria: 'economico',
      dataRetirada: new Date('2026-10-15T10:00:00.000Z'),
      duracaoDias: 3
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.cotacoes.length).toBe(1);
    expect(resultado.cotacoes[0].categoria).toBe('economico');
    expect(resultado.cotacoes[0].grupoOriginal).toBe('Grupo B - Compacto Com Ar');
  });

  it('deve coletar cotações do concorrente (Movida) para a mesma praça', async () => {
    const adaptador = new AdaptadorReplay('movida');

    const resultado = await adaptador.coletar({
      fonte: 'movida',
      praca: 'aeroporto_confins',
      dataRetirada: new Date('2026-10-15T10:00:00.000Z'),
      duracaoDias: 3
    });

    expect(resultado.sucesso).toBe(true);
    expect(resultado.cotacoes.length).toBeGreaterThanOrEqual(3);
    expect(resultado.cotacoes.every(c => c.fonte === 'movida')).toBe(true);
  });
});
