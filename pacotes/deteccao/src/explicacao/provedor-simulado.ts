/**
 * Provedor simulado/determinístico de LLM para testes, CI e execução offline.
 * Gera narrativas fiéis às métricas sem depender de chamadas externas de rede.
 * Regra: Código 100% em Português do Brasil.
 */

import { ProvedorLLM, MensagemChat, OpcoesGeracaoLLM, RespostaLLM } from './contrato-llm.js';

export interface OpcoesProvedorSimulado {
  respostasPreDefinidas?: string[];
  simularAlucinacao?: boolean; // Injeta número falso para testar reprovação pelo validador
}

export class ProvedorSimulado implements ProvedorLLM {
  public readonly nome = 'Provedor Simulado (Determinístico)';
  private filaRespostas: string[];
  private simularAlucinacao: boolean;

  constructor(opcoes: OpcoesProvedorSimulado = {}) {
    this.filaRespostas = [...(opcoes.respostasPreDefinidas ?? [])];
    this.simularAlucinacao = opcoes.simularAlucinacao ?? false;
  }

  async gerarTexto(mensagens: MensagemChat[], _opcoes?: OpcoesGeracaoLLM): Promise<RespostaLLM> {
    if (this.filaRespostas.length > 0) {
      const texto = this.filaRespostas.shift()!;
      return {
        texto,
        modelo: 'simulado-customizado',
        tokensUtilizados: 80
      };
    }

    const mensagemUsuario = mensagens.find((m) => m.papel === 'usuario')?.conteudo || '';

    // Se solicitado para simular alucinação em testes de QA:
    if (this.simularAlucinacao) {
      return {
        texto:
          'Identificamos uma tarifa de R$ 999.00 no mercado com desconto de 88.5%, indicando oportunidade de compra.',
        modelo: 'simulado-alucinador',
        tokensUtilizados: 50
      };
    }

    // Extrai contexto da mensagem do usuário para gerar texto executivo coerente
    let textoGerado = 'Análise de inteligência de preços concluída com base nas métricas observadas.';

    if (mensagemUsuario.includes('pico_preco')) {
      textoGerado =
        'Identificamos um pico atípico de preços na praça observada. ' +
        'O valor praticado superou expressivamente a mediana histórica para a categoria no período. ' +
        'Recomenda-se avaliar se há evento local ou ajuste dinâmico de rentabilidade.';
    } else if (mensagemUsuario.includes('concorrente_mais_barato')) {
      textoGerado =
        'Constatamos agressividade comercial da concorrência na mesma janela de locação. ' +
        'O concorrente ofertou tarifas com gap expressivo em relação à nossa referência. ' +
        'Sugere-se monitorar a elasticidade da demanda e a taxa de ocupação da frota.';
    } else if (mensagemUsuario.includes('queda_disponibilidade')) {
      textoGerado =
        'Alerta de indisponibilidade de frota: a categoria solicitada esgotou na agência. ' +
        'Recomenda-se avaliar remanejamento logístico de veículos para evitar perda de receita.';
    }

    return {
      texto: textoGerado,
      modelo: 'simulado-padrao',
      tokensUtilizados: 65
    };
  }
}
