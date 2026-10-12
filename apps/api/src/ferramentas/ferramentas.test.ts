import { describe, it, expect, afterAll } from 'vitest';
import { FerramentaConsultaSql } from './ferramenta-consulta-sql.js';
import { FerramentaBuscaSemantica } from './ferramenta-busca-semantica.js';
import { FerramentaCalculoGap } from './ferramenta-calculo-gap.js';
import { encerrarPoolLeitor, encerrarPoolConexao } from '@fleetpulse/banco';

describe('Ferramentas Especializadas do Agente FleetPulse AI', () => {
  afterAll(async () => {
    await encerrarPoolLeitor();
    await encerrarPoolConexao();
  });

  describe('FerramentaConsultaSql (Segurança e Leitura Restrita)', () => {
    it('deve bloquear comandos de mutação antes de executar no banco', async () => {
      const ferramenta = new FerramentaConsultaSql();

      await expect(
        ferramenta.executar({ consultaSql: 'DELETE FROM cotacoes WHERE praca = 1;' })
      ).rejects.toThrow(/somente-leitura/i);

      await expect(
        ferramenta.executar({ consultaSql: 'DROP TABLE insights;' })
      ).rejects.toThrow(/somente-leitura/i);
    });

    it('deve executar consulta SELECT e extrair números autorizados para auditoria', async () => {
      const ferramenta = new FerramentaConsultaSql();
      const resultado = await ferramenta.executar({
        consultaSql: 'SELECT 129.90 as preco_diaria, 3 as duracao;'
      });

      expect(resultado.totalLinhas).toBe(1);
      expect(Number(resultado.linhas[0].preco_diaria)).toBe(129.9);

      const numeros = ferramenta.extrairNumerosAutorizados(resultado);
      expect(numeros).toContain(129.9);
      expect(numeros).toContain(3);
    });
  });

  describe('FerramentaCalculoGap (Deterministica)', () => {
    it('deve calcular gap percentual e diferença em reais com exatidão matemática', async () => {
      const ferramenta = new FerramentaCalculoGap();
      const resultado = await ferramenta.executar({
        precoReferencia: 150.0,
        precoConcorrente: 120.0
      });

      expect(resultado.diferencaReais).toBe(30.0);
      expect(resultado.gapPercentual).toBe(20.0);
      expect(resultado.concorrenteMaisBarato).toBe(true);

      const numeros = ferramenta.extrairNumerosAutorizados(resultado);
      expect(numeros).toContain(150);
      expect(numeros).toContain(120);
      expect(numeros).toContain(30);
      expect(numeros).toContain(20);
    });
  });

  describe('FerramentaBuscaSemantica', () => {
    it('deve executar busca e extrair métricas dos insights', async () => {
      const ferramenta = new FerramentaBuscaSemantica();
      const resultado = await ferramenta.executar({
        termoBusca: 'Pico de preço recente',
        limite: 2
      });

      expect(resultado.tempoBuscaMs).toBeGreaterThanOrEqual(0);
      expect(Array.isArray(resultado.insights)).toBe(true);
    });
  });
});
