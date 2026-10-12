import { describe, it, expect } from 'vitest';
import { calcularMediana } from './mediana.js';
import { calcularMad } from './mad.js';
import { calcularZScoreRobusto, FATOR_ESCALA_NORMAL } from './zscore-robusto.js';

describe('Estatística Robusta - Mediana e MAD', () => {
  it('deve calcular a mediana de lista com número ímpar de elementos', () => {
    expect(calcularMediana([100, 110, 105])).toBe(105);
    expect(calcularMediana([50, 20, 80, 10, 90])).toBe(50);
  });

  it('deve calcular a mediana de lista com número par de elementos', () => {
    expect(calcularMediana([100, 110, 105, 115])).toBe(107.5);
    expect(calcularMediana([10, 20, 30, 40])).toBe(25);
  });

  it('deve lançar erro ao tentar calcular mediana de lista vazia', () => {
    expect(() => calcularMediana([])).toThrow('lista vazia');
  });

  it('deve calcular o MAD corretamente', () => {
    // Série: [100, 102, 104, 106, 108]
    // Mediana = 104
    // Desvios absolutos: |100-104|=4, |102-104|=2, |104-104|=0, |106-104|=2, |108-104|=4
    // Desvios ordenados: [0, 2, 2, 4, 4]
    // Mediana dos desvios (MAD) = 2
    const valores = [100, 102, 104, 106, 108];
    expect(calcularMad(valores)).toBe(2);
  });

  it('deve retornar MAD zero quando todos os valores forem idênticos', () => {
    expect(calcularMad([120, 120, 120, 120])).toBe(0);
  });
});

describe('Z-Score Robusto', () => {
  it('deve calcular Z-Score robusto com precisão para preços normais', () => {
    const historico = [100, 102, 104, 106, 108]; // mediana = 104, MAD = 2, desvio = 2 * 1.4826 = 2.9652
    const resultado = calcularZScoreRobusto(104, historico);

    expect(resultado.mediana).toBe(104);
    expect(resultado.mad).toBe(2);
    expect(resultado.zScore).toBe(0);
    expect(resultado.ehAnomalia).toBe(false);
  });

  it('deve detectar pico de preço anômalo (Z-score >= 2.5)', () => {
    const historico = [120, 122, 125, 121, 123];
    // Preço dispara para 190 (ex: tarifa de véspera de feriado)
    const resultado = calcularZScoreRobusto(190, historico);

    expect(resultado.ehAnomalia).toBe(true);
    expect(resultado.zScore).toBeGreaterThan(2.5);
    expect(resultado.variacaoPercentual).toBeGreaterThan(50);
  });

  it('deve resistir a outliers existentes no histórico (diferencial contra média comum)', () => {
    // Suponha um histórico onde houve um erro grosseiro de digitação no passado (R$ 9999)
    // Na média comum, a média seria inflada para ~2100 e um preço de R$ 250 não pareceria anomalia.
    // No Z-Score Robusto, a mediana é imune ao outlier!
    const historicoComOutlier = [120, 122, 125, 121, 123, 9999];

    const resultado = calcularZScoreRobusto(200, historicoComOutlier);

    // Mediana permanece em torno de 122.5, pegando o preço de 200 como anomalia
    expect(resultado.mediana).toBeLessThan(130);
    expect(resultado.ehAnomalia).toBe(true);
  });

  it('deve tratar adequadamente o caso em que o MAD é 0 (preços históricos constantes)', () => {
    const historicoConstante = [100, 100, 100, 100];

    // Novo preço igual ao histórico -> sem anomalia
    const semMudanca = calcularZScoreRobusto(100, historicoConstante);
    expect(semMudanca.ehAnomalia).toBe(false);
    expect(semMudanca.zScore).toBe(0);

    // Novo preço com salto de 30% -> detectado como anomalia
    const comSalto = calcularZScoreRobusto(130, historicoConstante);
    expect(comSalto.ehAnomalia).toBe(true);
    expect(comSalto.zScore).toBe(3);
  });

  it('deve lançar erro se o histórico tiver menos amostras do que o mínimo configurado', () => {
    expect(() => calcularZScoreRobusto(150, [100, 110], { minimoAmostras: 3 })).toThrow(
      'Histórico insuficiente'
    );
  });
});
