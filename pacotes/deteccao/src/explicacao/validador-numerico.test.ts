import { describe, it, expect } from 'vitest';
import { InsightAnomalia } from '@fleetpulse/esquemas';
import {
  ValidadorNumerico,
  extrairNumerosDoTexto,
  extrairNumerosAutorizados
} from './validador-numerico.js';

describe('ValidadorNumerico - Auditoria Pós-Resposta de LLM', () => {
  const insightExemplo: InsightAnomalia = {
    detectadoEm: new Date('2026-10-12T10:00:00Z'),
    tipo: 'pico_preco',
    severidade: 'alta',
    praca: 'aeroporto_confins',
    categoria: 'economico',
    periodo: '2026-10-20 até 2026-10-23',
    metricas: {
      precoAtual: 195.0,
      mediana: 120.0,
      diferencaReais: 75.0,
      variacaoPercentual: 62.5,
      zScore: 3.25,
      duracaoDias: 3
    },
    narrativa: 'Narrativa preliminar com base nas métricas',
    status: 'novo'
  };

  it('deve extrair números com precisão em textos nos formatos monetários e percentuais brasileiros', () => {
    const texto = 'A tarifa subiu para R$ 195,00, ficando 62,5% acima da mediana de R$ 120,00 no dia 2026-10-20.';
    const numeros = extrairNumerosDoTexto(texto);

    expect(numeros).toContain(195);
    expect(numeros).toContain(62.5);
    expect(numeros).toContain(120);
    // Data completa não deve ser quebrada em 2026
    expect(numeros).not.toContain(2026);
  });

  it('deve extrair todos os números autorizados das métricas determinísticas', () => {
    const autorizados = extrairNumerosAutorizados(insightExemplo);

    expect(autorizados).toContain(195);
    expect(autorizados).toContain(120);
    expect(autorizados).toContain(75);
    expect(autorizados).toContain(62.5);
    expect(autorizados).toContain(3.25);
    expect(autorizados).toContain(3);
  });

  it('deve aprovar narrativa do LLM que cita estritamente os números corretos', () => {
    const validador = new ValidadorNumerico();
    const narrativaFiel =
      'Constatamos um pico na praça Confins onde a tarifa atingiu R$ 195,00, ' +
      'representando alta de 62.5% em relação à mediana histórica de R$ 120,00.';

    const resultado = validador.validar(narrativaFiel, insightExemplo);

    expect(resultado.valido).toBe(true);
    expect(resultado.alucinacoesIdentificadas.length).toBe(0);
  });

  it('deve reprovar imediatamente narrativa do LLM que alucina números inexistentes nos dados', () => {
    const validador = new ValidadorNumerico();
    // Modelo inventou "R$ 450,00" e "80%" que não existem nas métricas
    const narrativaAlucinada =
      'O preço saltou para R$ 450,00, gerando um ágio de 80% frente aos concorrentes da região.';

    const resultado = validador.validar(narrativaAlucinada, insightExemplo);

    expect(resultado.valido).toBe(false);
    expect(resultado.alucinacoesIdentificadas).toContain(450);
    expect(resultado.alucinacoesIdentificadas).toContain(80);
    expect(resultado.motivoReprovacao).toContain('não autorizados');
  });

  it('deve tolerar pequenas variações de arredondamento aceitáveis', () => {
    const validador = new ValidadorNumerico();
    // Modelo arredondou 62.5% para 62% ou 63%
    const narrativaArredondada =
      'A tarifa atual é de R$ 195,00, acumulando cerca de 63% de aumento sobre a mediana de R$ 120,00.';

    const resultado = validador.validar(narrativaArredondada, insightExemplo);
    expect(resultado.valido).toBe(true);
  });
});
