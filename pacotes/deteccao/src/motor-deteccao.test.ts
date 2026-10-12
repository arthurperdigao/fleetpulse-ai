import { describe, it, expect } from 'vitest';
import { Cotacao } from '@fleetpulse/esquemas';
import { MotorDeteccao } from './motor-deteccao.js';
import { detectarPicoPreco } from './detectores/detector-pico-preco.js';
import { detectarAgressividadeConcorrente } from './detectores/detector-concorrente.js';
import { detectarQuedaDisponibilidade } from './detectores/detector-disponibilidade.js';

describe('Detectores de Anomalias', () => {
  const dataRetiradaPadrao = new Date('2026-10-20T10:00:00Z');
  const dataDevolucaoPadrao = new Date('2026-10-23T10:00:00Z');

  const criarCotacao = (sobreposicoes: Partial<Cotacao>): Cotacao => ({
    capturadoEm: new Date('2026-10-12T10:00:00Z'),
    fonte: 'localiza',
    praca: 'aeroporto_confins',
    categoria: 'economico',
    dataRetirada: dataRetiradaPadrao,
    dataDevolucao: dataDevolucaoPadrao,
    duracaoDias: 3,
    antecedenciaDias: 8,
    precoDiaria: 120.0,
    precoTotal: 360.0,
    disponivel: true,
    ...sobreposicoes
  });

  describe('Detector de Pico de Preço', () => {
    it('deve identificar pico de preço quando diária ultrapassa distribuição histórica', () => {
      const historico = [
        criarCotacao({ precoDiaria: 118 }),
        criarCotacao({ precoDiaria: 120 }),
        criarCotacao({ precoDiaria: 122 }),
        criarCotacao({ precoDiaria: 121 }),
        criarCotacao({ precoDiaria: 119 })
      ];

      const cotacaoPico = criarCotacao({ precoDiaria: 195 }); // +62.5% sobre mediana de 120
      const insight = detectarPicoPreco(cotacaoPico, historico);

      expect(insight).not.toBeNull();
      expect(insight?.tipo).toBe('pico_preco');
      expect(insight?.severidade).toBe('critica');
      expect(insight?.metricas.precoAtual).toBe(195);
      expect(insight?.metricas.zScore).toBeGreaterThan(2.5);
      expect(insight?.narrativa).toContain('Pico de preço detectado em LOCALIZA');
    });

    it('não deve gerar anomalia para flutuação ordinária de preço', () => {
      const historico = [
        criarCotacao({ precoDiaria: 115 }),
        criarCotacao({ precoDiaria: 120 }),
        criarCotacao({ precoDiaria: 125 })
      ];

      const cotacaoNormal = criarCotacao({ precoDiaria: 123 });
      const insight = detectarPicoPreco(cotacaoNormal, historico);

      expect(insight).toBeNull();
    });
  });

  describe('Detector de Concorrência Agressiva', () => {
    it('deve detectar quando concorrente está com preço expressivamente menor', () => {
      const rodada: Cotacao[] = [
        criarCotacao({ fonte: 'localiza', precoDiaria: 150.0 }),
        criarCotacao({ fonte: 'movida', precoDiaria: 105.0 }) // R$ 45 mais barato (30% menor)
      ];

      const insights = detectarAgressividadeConcorrente(rodada, {
        fonteReferencia: 'localiza',
        gapMinimoPercentual: 12
      });

      expect(insights.length).toBe(1);
      const insight = insights[0];
      expect(insight.tipo).toBe('concorrente_mais_barato');
      expect(insight.severidade).toBe('alta'); // gap de 30% é alta
      expect(insight.metricas.fonteConcorrente).toBe('movida');
      expect(insight.metricas.gapPercentual).toBe(30);
      expect(insight.narrativa).toContain('MOVIDA está R$ 45.00 mais barata (-30.0%)');
    });

    it('não deve gerar alerta se concorrente estiver mais caro ou com diferença irrelevante', () => {
      const rodada: Cotacao[] = [
        criarCotacao({ fonte: 'localiza', precoDiaria: 150.0 }),
        criarCotacao({ fonte: 'movida', precoDiaria: 145.0 }) // Diferença pequena (< 12%)
      ];

      const insights = detectarAgressividadeConcorrente(rodada);
      expect(insights.length).toBe(0);
    });
  });

  describe('Detector de Queda de Disponibilidade', () => {
    it('deve alertar sobre categoria crítica esgotada', () => {
      const rodada: Cotacao[] = [
        criarCotacao({ categoria: 'economico', disponivel: false })
      ];

      const insights = detectarQuedaDisponibilidade(rodada);

      expect(insights.length).toBe(1);
      expect(insights[0].tipo).toBe('queda_disponibilidade');
      expect(insights[0].severidade).toBe('alta');
      expect(insights[0].narrativa).toContain('Ruptura de estoque detectada');
    });
  });

  describe('MotorDeteccao Integrado', () => {
    it('deve analisar uma rodada completa com múltiplos eventos correlacionados', () => {
      const historico = [
        criarCotacao({ fonte: 'localiza', precoDiaria: 120 }),
        criarCotacao({ fonte: 'localiza', precoDiaria: 122 }),
        criarCotacao({ fonte: 'localiza', precoDiaria: 121 })
      ];

      const rodadaAtual: Cotacao[] = [
        // Pico de preço em Confins Econômico na Localiza
        criarCotacao({ fonte: 'localiza', precoDiaria: 190 }),
        // Movida muito agressiva na mesma praça
        criarCotacao({ fonte: 'movida', precoDiaria: 110 }),
        // SUV esgotado na Savassi
        criarCotacao({
          praca: 'savassi',
          categoria: 'suv',
          disponivel: false
        })
      ];

      const motor = new MotorDeteccao();
      const todosInsights = motor.processarRodada(rodadaAtual, historico);

      expect(todosInsights.length).toBe(3);

      const tipos = todosInsights.map((i) => i.tipo);
      expect(tipos).toContain('pico_preco');
      expect(tipos).toContain('concorrente_mais_barato');
      expect(tipos).toContain('queda_disponibilidade');
    });
  });
});
