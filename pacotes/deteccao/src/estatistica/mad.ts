/**
 * Cálculo do Desvio Absoluto Mediano (MAD - Median Absolute Deviation).
 * Medida robusta de dispersão estatística menos sensível a outliers que o desvio padrão.
 * Regra: Código 100% em Português do Brasil.
 */

import { calcularMediana } from './mediana.js';

export function calcularMad(valores: number[], medianaPrevia?: number): number {
  if (!valores || valores.length === 0) {
    throw new Error('Não é possível calcular o MAD de uma lista vazia.');
  }

  const mediana = medianaPrevia ?? calcularMediana(valores);
  const desviosAbsolutos = valores.map((valor) => Math.abs(valor - mediana));

  return calcularMediana(desviosAbsolutos);
}
