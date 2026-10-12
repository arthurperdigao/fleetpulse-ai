/**
 * Validador Pós-Resposta de Chat para o Agente FleetPulse AI.
 * 
 * Assinatura técnica SDET / QA Aplicado à IA:
 * Audita a resposta final do agente garantindo que qualquer número citado (preços, porcentagens, gaps)
 * provenha com exatidão dos retornos das 3 ferramentas especializadas.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { extrairNumerosDoTexto } from '@fleetpulse/deteccao';

export interface ResultadoAuditoriaChat {
  valido: boolean;
  numerosCitados: number[];
  numerosAutorizados: number[];
  alucinacoesIdentificadas: number[];
  motivoReprovacao?: string;
}

export class ValidadorRespostaChat {
  private toleranciaAbsoluta: number;
  private numerosIgnorados: Set<number>;

  constructor(toleranciaAbsoluta: number = 0.25) {
    this.toleranciaAbsoluta = toleranciaAbsoluta;
    this.numerosIgnorados = new Set([2024, 2025, 2026, 2027, 24, 7, 1, 2, 3]); // Referências temporais e contagens ordinais comuns
  }

  validar(respostaTexto: string, numerosDasFerramentas: number[]): ResultadoAuditoriaChat {
    const numerosCitadosBrutos = extrairNumerosDoTexto(respostaTexto);
    const numerosCitados = numerosCitadosBrutos.filter((n) => !this.numerosIgnorados.has(n));

    const autorizados = new Set(numerosDasFerramentas);
    const alucinacoes: number[] = [];

    for (const citado of numerosCitados) {
      const coincide = Array.from(autorizados).some((esperado) => {
        return Math.abs(citado - esperado) <= this.toleranciaAbsoluta;
      });

      if (!coincide) {
        alucinacoes.push(citado);
      }
    }

    if (alucinacoes.length > 0) {
      return {
        valido: false,
        numerosCitados,
        numerosAutorizados: Array.from(autorizados),
        alucinacoesIdentificadas: alucinacoes,
        motivoReprovacao: `A resposta citou valores não fundamentados nas ferramentas: [${alucinacoes.join(', ')}].`
      };
    }

    return {
      valido: true,
      numerosCitados,
      numerosAutorizados: Array.from(autorizados),
      alucinacoesIdentificadas: []
    };
  }
}
