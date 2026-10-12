/**
 * Cálculo da mediana estatística para séries numéricas.
 * A mediana é uma medida de tendência central resistente a valores discrepantes (outliers).
 * Regra: Código 100% em Português do Brasil.
 */

export function calcularMediana(valores: number[]): number {
  if (!valores || valores.length === 0) {
    throw new Error('Não é possível calcular a mediana de uma lista vazia.');
  }

  const ordenados = [...valores].sort((a, b) => a - b);
  const meio = Math.floor(ordenados.length / 2);

  if (ordenados.length % 2 !== 0) {
    return ordenados[meio];
  }

  return (ordenados[meio - 1] + ordenados[meio]) / 2;
}
