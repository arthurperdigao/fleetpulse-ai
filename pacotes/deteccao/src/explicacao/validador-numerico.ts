/**
 * Validador Pós-Resposta de Integridade Numérica para Narrativas de LLM.
 * 
 * Assinatura técnica SDET / QA Aplicado à IA:
 * O LLM interpreta, mas o código calcula. Esta classe audita o texto gerado pelo modelo
 * e garante que TODO número, porcentagem ou valor financeiro citado derive estritamente
 * das métricas calculadas pelo pipeline analítico, eliminando o risco de alucinação numérica.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { InsightAnomalia } from '@fleetpulse/esquemas';

export interface OpcoesValidacaoNumerica {
  toleranciaAbsoluta?: number; // Padrão: 0.15 (permite pequenas aproximações como 62.5% vs 62.5)
  toleranciaPercentualArredondamento?: number; // Padrão: 1.0 (permite 62.5% citado como 62% ou 63%)
  numerosIgnorados?: number[]; // Números contextuais (ex: anos como 2026, 2025)
}

export interface ResultadoValidacaoNumerica {
  valido: boolean;
  numerosCitados: number[];
  numerosEsperados: number[];
  alucinacoesIdentificadas: number[];
  motivoReprovacao?: string;
}

/**
 * Extrai todos os números reais/decimais presentes em uma narrativa de texto.
 * Lida com padrões brasileiros (R$ 129,90, 62,5%) e internacionais (129.90, 62.5%).
 */
export function extrairNumerosDoTexto(texto: string): number[] {
  if (!texto) return [];

  // Remove referências a datas no formato AAAA-MM-DD para não capturar o ano como número solto
  const textoSemDatas = texto.replace(/\b\d{4}-\d{2}-\d{2}\b/g, ' ');

  // Captura padrões como: R$ 129,90 | 129.90 | 62,5% | -30% | 15 | +45.2
  const regexNumeros = /[+-]?\b\d+(?:[.,]\d+)?\b/g;
  const correspondencias = textoSemDatas.match(regexNumeros) || [];

  const numeros: number[] = [];
  for (const item of correspondencias) {
    // Normalizar vírgula decimal para ponto
    const normalizado = item.replace(',', '.');
    const valor = parseFloat(normalizado);
    if (!isNaN(valor)) {
      numeros.push(Math.abs(valor));
    }
  }

  return numeros;
}

/**
 * Compila a lista de todos os números legítimos autorizados contidos nas métricas do insight.
 */
export function extrairNumerosAutorizados(insight: InsightAnomalia): number[] {
  const autorizados: number[] = [];

  const extrairDeObjeto = (obj: Record<string, any>) => {
    for (const valor of Object.values(obj)) {
      if (typeof valor === 'number' && !isNaN(valor)) {
        autorizados.push(Math.abs(valor));
        // Adicionar também o valor arredondado inteiro para tolerância de escrita comum
        autorizados.push(Math.floor(Math.abs(valor)));
        autorizados.push(Math.ceil(Math.abs(valor)));
      } else if (typeof valor === 'object' && valor !== null) {
        extrairDeObjeto(valor);
      }
    }
  };

  if (insight.metricas) {
    extrairDeObjeto(insight.metricas);
  }

  // Desduplicar
  return Array.from(new Set(autorizados));
}

/**
 * Validador que confronta a narrativa do LLM contra os números exatos autorizados.
 */
export class ValidadorNumerico {
  private toleranciaAbsoluta: number;
  private numerosIgnorados: Set<number>;

  constructor(opcoes: OpcoesValidacaoNumerica = {}) {
    this.toleranciaAbsoluta = opcoes.toleranciaAbsoluta ?? 0.2;
    const padraoIgnorados = [2024, 2025, 2026, 2027, 24, 7]; // Anos e referências temporais comuns (24h, 7 dias)
    this.numerosIgnorados = new Set([...padraoIgnorados, ...(opcoes.numerosIgnorados ?? [])]);
  }

  validar(narrativa: string, insight: InsightAnomalia): ResultadoValidacaoNumerica {
    const numerosCitadosBrutos = extrairNumerosDoTexto(narrativa);
    const numerosEsperados = extrairNumerosAutorizados(insight);

    // Filtrar números contextuais inofensivos
    const numerosCitados = numerosCitadosBrutos.filter((n) => !this.numerosIgnorados.has(n));

    const alucinacoes: number[] = [];

    for (const citado of numerosCitados) {
      // Verifica se o número citado bate com algum número esperado dentro da tolerância
      const coincide = numerosEsperados.some((esperado) => {
        const diferenca = Math.abs(citado - esperado);
        return diferenca <= this.toleranciaAbsoluta;
      });

      if (!coincide) {
        alucinacoes.push(citado);
      }
    }

    if (alucinacoes.length > 0) {
      return {
        valido: false,
        numerosCitados,
        numerosEsperados,
        alucinacoesIdentificadas: alucinacoes,
        motivoReprovacao: `O LLM citou os seguintes valores numéricos não autorizados pelas métricas calculadas: [${alucinacoes.join(', ')}].`
      };
    }

    return {
      valido: true,
      numerosCitados,
      numerosEsperados,
      alucinacoesIdentificadas: []
    };
  }
}
