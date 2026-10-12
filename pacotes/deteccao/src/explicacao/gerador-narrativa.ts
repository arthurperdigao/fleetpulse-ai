/**
 * Gerador de Narrativas de Anomalias com LLM e Auditoria Numérica.
 * 
 * Etapa 5 do Pipeline: "Explain - só anomalias vão ao LLM, que gera a narrativa".
 * Princípio Arquitetural: "LLM interpreta, código calcula".
 * Validador pós-resposta garante 0% de alucinação de números.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { InsightAnomalia, EsquemaInsightAnomalia } from '@fleetpulse/esquemas';
import { ProvedorLLM, MensagemChat } from './contrato-llm.js';
import { ProvedorSimulado } from './provedor-simulado.js';
import { ValidadorNumerico, ResultadoValidacaoNumerica } from './validador-numerico.js';

export interface OpcoesGeradorNarrativa {
  provedor?: ProvedorLLM;
  validador?: ValidadorNumerico;
  maxTentativas?: number;
}

export interface ResultadoEnriquecimentoNarrativa {
  insightEnriquecido: InsightAnomalia;
  validacao: ResultadoValidacaoNumerica;
  tentativas: number;
  modeloUtilizado: string;
}

export class GeradorNarrativa {
  private provedor: ProvedorLLM;
  private validador: ValidadorNumerico;
  private maxTentativas: number;

  constructor(opcoes: OpcoesGeradorNarrativa = {}) {
    this.provedor = opcoes.provedor || new ProvedorSimulado();
    this.validador = opcoes.validador || new ValidadorNumerico();
    this.maxTentativas = opcoes.maxTentativas || 2;
  }

  private montarPromptSistema(): string {
    return (
      'Você é o FleetPulse AI, especialista sênior em inteligência de preços e observabilidade de mercado para locadoras de veículos no Brasil.\n' +
      'Sua tarefa é explicar anomalias de mercado detectadas de forma executiva, objetiva e estratégica (máximo 2 a 3 frases).\n' +
      'DIRETRIZES FUNDAMENTAIS:\n' +
      '1. Regra de Ouro: NUNCA invente ou estime números. Todo e qualquer valor citado (preços em R$, porcentagens %, Z-score ou dias) ' +
      'DEVE constar expressamente no JSON de métricas fornecido pelo usuário.\n' +
      '2. Linguagem: Português do Brasil profissional, tom corporativo e analítico.\n' +
      '3. Estrutura recomendada: Descreva o fato detectado, mencione a magnitude da variação e sugira a implicação tática.'
    );
  }

  private montarPromptUsuario(insight: InsightAnomalia): string {
    return (
      `Analise a seguinte anomalia de mercado detectada e redija a narrativa executiva explicativa:\n\n` +
      `Tipo de Evento: ${insight.tipo}\n` +
      `Severidade: ${insight.severidade.toUpperCase()}\n` +
      `Praça: ${insight.praca}\n` +
      `Categoria: ${insight.categoria}\n` +
      `Período de Locação: ${insight.periodo}\n` +
      `Métricas Determinísticas Calculadas (dados oficiais):\n` +
      `${JSON.stringify(insight.metricas, null, 2)}\n\n` +
      `Narrativa estatística preliminar: "${insight.narrativa}"`
    );
  }

  /**
   * Enriquece um insight gerando a narrativa via LLM e auditando com o Validador Numérico.
   */
  async enriquecer(insight: InsightAnomalia): Promise<ResultadoEnriquecimentoNarrativa> {
    const mensagens: MensagemChat[] = [
      { papel: 'sistema', conteudo: this.montarPromptSistema() },
      { papel: 'usuario', conteudo: this.montarPromptUsuario(insight) }
    ];

    let tentativas = 0;
    let ultimaValidacao: ResultadoValidacaoNumerica = {
      valido: false,
      numerosCitados: [],
      numerosEsperados: [],
      alucinacoesIdentificadas: []
    };
    let textoGerado = '';
    let modeloUsado = this.provedor.nome;

    while (tentativas < this.maxTentativas) {
      tentativas++;

      const resposta = await this.provedor.gerarTexto(mensagens);
      textoGerado = resposta.texto;
      modeloUsado = resposta.modelo;

      ultimaValidacao = this.validador.validar(textoGerado, insight);

      if (ultimaValidacao.valido) {
        break;
      }

      // Se reprovado por alucinação e ainda houver tentativa restante, adiciona mensagem de correção
      if (tentativas < this.maxTentativas) {
        mensagens.push({ papel: 'assistente', conteudo: textoGerado });
        mensagens.push({
          papel: 'usuario',
          conteudo:
            `ERRO DE AUDITORIA: Sua resposta foi REPROVADA porque citou valores numéricos que não existem nas métricas oficiais: ` +
            `[${ultimaValidacao.alucinacoesIdentificadas.join(', ')}]. ` +
            `Reescreva a explicação utilizando estritamente os números fornecidos.`
        });
      }
    }

    // Se passou na validação, usamos a narrativa enriquecida pelo LLM;
    // Se falhou em todas as tentativas, usamos a narrativa determinística de fallback seguro
    const narrativaFinal = ultimaValidacao.valido ? textoGerado : insight.narrativa;

    const insightAtualizado: InsightAnomalia = EsquemaInsightAnomalia.parse({
      ...insight,
      narrativa: narrativaFinal,
      metricas: {
        ...insight.metricas,
        auditoriaNarrativa: {
          aprovadoPeloValidador: ultimaValidacao.valido,
          tentativas,
          modelo: modeloUsado,
          alucinacoesEvitadas: ultimaValidacao.alucinacoesIdentificadas
        }
      }
    });

    return {
      insightEnriquecido: insightAtualizado,
      validacao: ultimaValidacao,
      tentativas,
      modeloUtilizado: modeloUsado
    };
  }

  /**
   * Enriquece uma lista de insights em lote
   */
  async enriquecerLote(insights: InsightAnomalia[]): Promise<InsightAnomalia[]> {
    const enriquecidos: InsightAnomalia[] = [];
    for (const insight of insights) {
      const resultado = await this.enriquecer(insight);
      enriquecidos.push(resultado.insightEnriquecido);
    }
    return enriquecidos;
  }
}
