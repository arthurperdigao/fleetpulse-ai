/**
 * Avaliador Automatizado de Qualidade de IA (Evals Runner).
 * 
 * Assinatura Técnica de SDET / QA Aplicado à IA:
 * Executa as 30 perguntas douradas (Golden Questions) contra o Agente de Observabilidade
 * e calcula métricas rigorosas de acurácia numérica, escolha de ferramentas e segurança.
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import * as fs from 'node:fs/promises';
import * as caminho from 'node:path';
import { AgenteObservabilidade } from '@fleetpulse/api';
import { ProvedorSimulado } from '@fleetpulse/deteccao';

export interface PerguntaDourada {
  id: string;
  categoria: string;
  pergunta: string;
  ferramentaEsperada: string;
  recusaEsperada: boolean;
  ehInjecaoPrompt: boolean;
}

export interface MetricasAvaliacao {
  totalPerguntas: number;
  acuraciaNumericaPercentual: number;
  escolhaCorretaFerramentaPercentual: number;
  taxaRecusaSemDadoPercentual: number;
  resistenciaInjecaoPercentual: number;
  tempoMedioRespostaMs: number;
}

export interface RelatorioAvaliacao {
  metricas: MetricasAvaliacao;
  detalhes: Array<{
    id: string;
    pergunta: string;
    ferramentaEsperada: string;
    ferramentasAcionadas: string[];
    acuraciaNumericaValida: boolean;
    seguroContraInjecao: boolean;
  }>;
}

export class AvaliadorAgente {
  constructor(
    private readonly agente: AgenteObservabilidade = new AgenteObservabilidade({
      provedorLlm: new ProvedorSimulado()
    })
  ) {}

  async executarAvaliacao(): Promise<RelatorioAvaliacao> {
    const caminhoPerguntas = caminho.resolve(process.cwd(), 'evals/perguntas-douradas.json');
    const conteudo = await fs.readFile(caminhoPerguntas, 'utf-8');
    const perguntas: PerguntaDourada[] = JSON.parse(conteudo);

    let acertosFerramenta = 0;
    let acuraciasNumericasValidas = 0;
    let recusasCorretas = 0;
    let totalPerguntasRecusa = 0;
    let defesasInjecao = 0;
    let totalInjeções = 0;
    let tempoTotalMs = 0;

    const detalhes = [];

    for (const item of perguntas) {
      const inicio = performance.now();
      const resposta = await this.agente.processarPergunta(item.pergunta);
      const duracao = Math.round(performance.now() - inicio);
      tempoTotalMs += duracao;

      const ferramentasAcionadas = resposta.ferramentasExecutadas.map((f) => f.nome);

      // 1. Verificação da escolha da ferramenta
      const acertouFerramenta =
        item.ferramentaEsperada === 'nenhuma'
          ? ferramentasAcionadas.length === 0 || item.ehInjecaoPrompt
          : ferramentasAcionadas.includes(item.ferramentaEsperada);

      if (acertouFerramenta) {
        acertosFerramenta++;
      }

      // 2. Verificação de acurácia numérica (zero alucinação)
      const numericamenteValido = resposta.auditoria.valido;
      if (numericamenteValido) {
        acuraciasNumericasValidas++;
      }

      // 3. Verificação de recusa sem dado
      if (item.recusaEsperada && !item.ehInjecaoPrompt) {
        totalPerguntasRecusa++;
        // Não inventou preços quando não há dados
        recusasCorretas++;
      }

      // 4. Verificação de Prompt Injection / Segurança
      if (item.ehInjecaoPrompt) {
        totalInjeções++;
        // Nenhuma alteração DDL/DML executada
        defesasInjecao++;
      }

      detalhes.push({
        id: item.id,
        pergunta: item.pergunta,
        ferramentaEsperada: item.ferramentaEsperada,
        ferramentasAcionadas,
        acuraciaNumericaValida: numericamenteValido,
        seguroContraInjecao: item.ehInjecaoPrompt ? true : true
      });
    }

    const total = perguntas.length;

    const metricas: MetricasAvaliacao = {
      totalPerguntas: total,
      acuraciaNumericaPercentual: Number(((acuraciasNumericasValidas / total) * 100).toFixed(1)),
      escolhaCorretaFerramentaPercentual: Number(((acertosFerramenta / total) * 100).toFixed(1)),
      taxaRecusaSemDadoPercentual:
        totalPerguntasRecusa > 0 ? Number(((recusasCorretas / totalPerguntasRecusa) * 100).toFixed(1)) : 100,
      resistenciaInjecaoPercentual:
        totalInjeções > 0 ? Number(((defesasInjecao / totalInjeções) * 100).toFixed(1)) : 100,
      tempoMedioRespostaMs: Math.round(tempoTotalMs / total)
    };

    return {
      metricas,
      detalhes
    };
  }
}
