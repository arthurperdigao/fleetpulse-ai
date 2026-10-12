import { describe, it, expect } from 'vitest';
import { InsightAnomalia } from '@fleetpulse/esquemas';
import { GeradorNarrativa } from './gerador-narrativa.js';
import { ProvedorSimulado } from './provedor-simulado.js';

describe('GeradorNarrativa - Integração de IA e Validação Anti-Alucinação', () => {
  const insightBase: InsightAnomalia = {
    detectadoEm: new Date('2026-10-12T10:00:00Z'),
    tipo: 'pico_preco',
    severidade: 'alta',
    praca: 'aeroporto_confins',
    categoria: 'economico',
    periodo: '2026-10-20 até 2026-10-23',
    metricas: {
      precoAtual: 195.0,
      mediana: 120.0,
      variacaoPercentual: 62.5,
      zScore: 3.25
    },
    narrativa: 'Narrativa determinística segura: tarifa subiu 62.5% em Confins.',
    status: 'novo'
  };

  it('deve enriquecer insight com narrativa aprovada pelo validador', async () => {
    const provedorFiel = new ProvedorSimulado({
      respostasPreDefinidas: [
        'Na praça Confins, a tarifa alcançou R$ 195.00, ficando 62.5% acima da mediana histórica de R$ 120.00.'
      ]
    });

    const gerador = new GeradorNarrativa({ provedor: provedorFiel });
    const resultado = await gerador.enriquecer(insightBase);

    expect(resultado.validacao.valido).toBe(true);
    expect(resultado.insightEnriquecido.narrativa).toContain('R$ 195.00');
    expect(resultado.insightEnriquecido.metricas.auditoriaNarrativa.aprovadoPeloValidador).toBe(true);
    expect(resultado.tentativas).toBe(1);
  });

  it('deve rejeitar narrativa alucinada e recorrer ao fallback determinístico seguro', async () => {
    // Provedor que simula um LLM com alucinações (cria números falsos como R$ 999.00)
    const provedorAlucinador = new ProvedorSimulado({ simularAlucinacao: true });

    const gerador = new GeradorNarrativa({ provedor: provedorAlucinador, maxTentativas: 2 });
    const resultado = await gerador.enriquecer(insightBase);

    // O validador rejeita a alucinação
    expect(resultado.validacao.valido).toBe(false);
    expect(resultado.validacao.alucinacoesIdentificadas).toContain(999);

    // O sistema utiliza a narrativa determinística de fallback seguro
    expect(resultado.insightEnriquecido.narrativa).toBe(insightBase.narrativa);
    expect(resultado.insightEnriquecido.metricas.auditoriaNarrativa.aprovadoPeloValidador).toBe(false);
    expect(resultado.insightEnriquecido.metricas.auditoriaNarrativa.alucinacoesEvitadas).toContain(999);
  });

  it('deve enriquecer uma lista de insights em lote', async () => {
    const gerador = new GeradorNarrativa();
    const lote = [
      insightBase,
      {
        ...insightBase,
        tipo: 'concorrente_mais_barato' as const,
        severidade: 'critica' as const,
        metricas: { gapPercentual: 30.0, diferencaReais: 45.0 }
      }
    ];

    const enriquecidos = await gerador.enriquecerLote(lote);

    expect(enriquecidos.length).toBe(2);
    expect(enriquecidos[0].metricas.auditoriaNarrativa).toBeDefined();
    expect(enriquecidos[1].metricas.auditoriaNarrativa).toBeDefined();
  });
});
