/**
 * Agente de Observabilidade de Preços e Inteligência de Mercado.
 * 
 * Implementação nativa em TypeScript seguindo os princípios anti-artificial:
 * - Sem frameworks de IA por moda: arquitetura direta e controlada.
 * - 3 Ferramentas Especializadas: SQL restrito, busca semântica no pgvector e cálculo determinístico de gap.
 * - Auditoria Pós-Resposta de QA: valida se todos os números citados batem com os dados das ferramentas.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { ProvedorLLM, ProvedorSimulado } from '@fleetpulse/deteccao';
import { FerramentaConsultaSql } from '../ferramentas/ferramenta-consulta-sql.js';
import { FerramentaBuscaSemantica } from '../ferramentas/ferramenta-busca-semantica.js';
import { FerramentaCalculoGap } from '../ferramentas/ferramenta-calculo-gap.js';
import { ValidadorRespostaChat, ResultadoAuditoriaChat } from './validador-resposta-chat.js';

export interface ExecucaoFerramenta {
  nome: string;
  parametros: any;
  resultado: any;
}

export interface RespostaAgenteChat {
  mensagem: string;
  ferramentasExecutadas: ExecucaoFerramenta[];
  auditoria: ResultadoAuditoriaChat;
  tempoTotalMs: number;
}

export interface OpcoesAgenteObservabilidade {
  provedorLlm?: ProvedorLLM;
  ferramentaSql?: FerramentaConsultaSql;
  ferramentaSemantica?: FerramentaBuscaSemantica;
  ferramentaGap?: FerramentaCalculoGap;
  validador?: ValidadorRespostaChat;
}

export class AgenteObservabilidade {
  private provedorLlm: ProvedorLLM;
  private ferramentaSql: FerramentaConsultaSql;
  private ferramentaSemantica: FerramentaBuscaSemantica;
  private ferramentaGap: FerramentaCalculoGap;
  private validador: ValidadorRespostaChat;

  constructor(opcoes: OpcoesAgenteObservabilidade = {}) {
    this.provedorLlm = opcoes.provedorLlm || new ProvedorSimulado();
    this.ferramentaSql = opcoes.ferramentaSql || new FerramentaConsultaSql();
    this.ferramentaSemantica = opcoes.ferramentaSemantica || new FerramentaBuscaSemantica();
    this.ferramentaGap = opcoes.ferramentaGap || new FerramentaCalculoGap();
    this.validador = opcoes.validador || new ValidadorRespostaChat();
  }

  /**
   * Processa a pergunta do usuário executando as ferramentas apropriadas e auditando a resposta.
   */
  async processarPergunta(perguntaUsuario: string): Promise<RespostaAgenteChat> {
    const inicio = performance.now();
    const ferramentasExecutadas: ExecucaoFerramenta[] = [];
    const numerosAutorizados: number[] = [];

    const textoPergunta = perguntaUsuario.toLowerCase();

    // 1. Decisão heurística/semântica de acionamento de ferramentas
    const requerSql =
      textoPergunta.includes('quantas cotações') ||
      textoPergunta.includes('média') ||
      textoPergunta.includes('menor preço') ||
      textoPergunta.includes('maior preço') ||
      textoPergunta.includes('listar') ||
      textoPergunta.includes('tabela') ||
      textoPergunta.includes('sql') ||
      textoPergunta.includes('hoje');

    const requerBuscaSemantica =
      textoPergunta.includes('anomalia') ||
      textoPergunta.includes('pico') ||
      textoPergunta.includes('concorrente') ||
      textoPergunta.includes('já aconteceu') ||
      textoPergunta.includes('histórico') ||
      textoPergunta.includes('feriado') ||
      textoPergunta.includes('evento');

    const requerCalculoGap =
      textoPergunta.includes('gap') ||
      textoPergunta.includes('diferença') ||
      textoPergunta.includes('desconto') ||
      textoPergunta.includes('comparar');

    // Execução da Ferramenta de Busca Semântica no pgvector
    if (requerBuscaSemantica || (!requerSql && !requerCalculoGap)) {
      try {
        const resultadoSemantica = await this.ferramentaSemantica.executar({
          termoBusca: perguntaUsuario,
          limite: 3
        });
        ferramentasExecutadas.push({
          nome: this.ferramentaSemantica.nome,
          parametros: { termoBusca: perguntaUsuario },
          resultado: resultadoSemantica
        });
        numerosAutorizados.push(...this.ferramentaSemantica.extrairNumerosAutorizados(resultadoSemantica));
      } catch (erro: any) {
        console.warn('[Agente] Falha na busca semântica:', erro.message);
      }
    }

    // Execução da Ferramenta de Consulta SQL estruturada (somente-leitura)
    if (requerSql) {
      try {
        let sqlGerada = 'SELECT praca, categoria, fonte, preco_diaria, capturado_em FROM cotacoes ORDER BY capturado_em DESC LIMIT 10;';

        if (textoPergunta.includes('confins')) {
          sqlGerada = "SELECT fonte, categoria, MIN(preco_diaria) as preco_minimo, AVG(preco_diaria)::numeric(10,2) as preco_medio FROM cotacoes WHERE praca = 'aeroporto_confins' GROUP BY fonte, categoria;";
        } else if (textoPergunta.includes('total') || textoPergunta.includes('quantas')) {
          sqlGerada = 'SELECT COUNT(*)::int as total_cotacoes FROM cotacoes;';
        }

        const resultadoSql = await this.ferramentaSql.executar({ consultaSql: sqlGerada });
        ferramentasExecutadas.push({
          nome: this.ferramentaSql.nome,
          parametros: { consultaSql: sqlGerada },
          resultado: resultadoSql
        });
        numerosAutorizados.push(...this.ferramentaSql.extrairNumerosAutorizados(resultadoSql));
      } catch (erro: any) {
        console.warn('[Agente] Falha na consulta SQL:', erro.message);
      }
    }

    // Execução da Ferramenta de Cálculo Determinístico de Gap
    if (requerCalculoGap) {
      // Extrai possíveis preços mencionados na pergunta (ex: "gap entre 150 e 120")
      const numerosNaPergunta = perguntaUsuario.match(/\b\d+(?:[.,]\d+)?\b/g)?.map(n => parseFloat(n.replace(',', '.'))) || [];
      if (numerosNaPergunta.length >= 2) {
        const resultadoGap = await this.ferramentaGap.executar({
          precoReferencia: Math.max(numerosNaPergunta[0], numerosNaPergunta[1]),
          precoConcorrente: Math.min(numerosNaPergunta[0], numerosNaPergunta[1])
        });
        ferramentasExecutadas.push({
          nome: this.ferramentaGap.nome,
          parametros: { precoReferencia: resultadoGap.precoReferencia, precoConcorrente: resultadoGap.precoConcorrente },
          resultado: resultadoGap
        });
        numerosAutorizados.push(...this.ferramentaGap.extrairNumerosAutorizados(resultadoGap));
      }
    }

    // 2. Síntese da resposta pelo modelo de linguagem
    const promptSistema =
      'Você é o assistente inteligente FleetPulse AI, especialista em observabilidade de preços de mercado.\n' +
      'Responda à pergunta do usuário de forma executiva, objetiva e com base EXCLUSIVA nos resultados das ferramentas executadas.\n' +
      'REGRA DE OURO: Use apenas os números e fatos retornados nas ferramentas. Nunca invente dados numéricos.';

    const contextoFerramentas = JSON.stringify(
      ferramentasExecutadas.map((f) => ({ ferramenta: f.nome, dados: f.resultado })),
      null,
      2
    );

    const promptUsuario =
      `Pergunta do analista: "${perguntaUsuario}"\n\n` +
      `Dados oficiais obtidos pelas ferramentas:\n${contextoFerramentas}\n\n` +
      `Formule uma resposta analítica e precisa em português brasileiro.`;

    const respostaLlm = await this.provedorLlm.gerarTexto([
      { papel: 'sistema', conteudo: promptSistema },
      { papel: 'usuario', conteudo: promptUsuario }
    ]);

    // 3. Auditoria Pós-Resposta de Integridade Numérica
    const auditoria = this.validador.validar(respostaLlm.texto, numerosAutorizados);

    let mensagemFinal = respostaLlm.texto;
    if (!auditoria.valido && auditoria.alucinacoesIdentificadas.length > 0) {
      // Alerta de segurança quando a auditoria detecta número não fundamentado
      console.warn(
        `[Agente:Auditoria] Números não autorizados detectados na resposta: ${auditoria.alucinacoesIdentificadas.join(', ')}`
      );
    }

    const tempoTotalMs = Math.round(performance.now() - inicio);

    return {
      mensagem: mensagemFinal,
      ferramentasExecutadas,
      auditoria,
      tempoTotalMs
    };
  }
}
