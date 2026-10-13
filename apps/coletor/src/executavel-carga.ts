/**
 * Executável de Carga Inicial e Semeadura de Dados (Seed do Banco).
 * 
 * Pipeline de ponta a ponta:
 * 1. Popula cotações históricas e recentes no TimescaleDB (hypertable cotacoes).
 * 2. Injeta anomalias reais de mercado de BH (pico de SUV, desconto agressivo da Movida e ruptura).
 * 3. Executa o MotorDeteccao estatístico (Z-score robusto / MAD).
 * 4. Gera narrativas via LLM com auditoria de integridade numérica.
 * 5. Indexa os vetores no PostgreSQL com pgvector (1536 dimensões via HNSW).
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import {
  Cotacao,
  InsightAnomalia,
  Fonte,
  Praca,
  Categoria,
  TipoAnomalia,
  Severidade
} from '@fleetpulse/esquemas';
import {
  RepositorioCotacoes,
  RepositorioInsights,
  GeradorEmbeddingsSimulado,
  encerrarPoolConexao
} from '@fleetpulse/banco';
import {
  MotorDeteccao,
  GeradorNarrativa,
  ProvedorSimulado
} from '@fleetpulse/deteccao';

async function semearBaseDeDados() {
  console.log('===============================================================');
  console.log('   FLEETPULSE AI - CARGA E SEMEADURA DE DADOS DE MERCADO      ');
  console.log('===============================================================');

  const repoCotacoes = new RepositorioCotacoes();
  const repoInsights = new RepositorioInsights();
  const motor = new MotorDeteccao();
  const narrador = new GeradorNarrativa({ provedor: new ProvedorSimulado() });
  const geradorEmbeddings = new GeradorEmbeddingsSimulado();

  const agora = new Date();
  const cotacoesHistorico: Cotacao[] = [];
  const cotacoesRodadaRecente: Cotacao[] = [];

  const fontes: Fonte[] = ['localiza', 'movida', 'unidas'];
  const pracas: Praca[] = ['aeroporto_confins', 'pampulha', 'savassi'];
  const categorias: Categoria[] = ['economico', 'intermediario', 'suv'];

  console.log('\n[1/4] Gerando séries temporais de cotações para a Grande BH...');

  const duracaoPadrao = 3;

  // 1. Gera histórico dos últimos 5 dias
  for (let diasAtras = 5; diasAtras >= 1; diasAtras--) {
    const dataCaptura = new Date(agora.getTime() - diasAtras * 24 * 60 * 60 * 1000);

    for (const praca of pracas) {
      for (const categoria of categorias) {
        for (const fonte of fontes) {
          let precoBase = categoria === 'economico' ? 125 : categoria === 'intermediario' ? 160 : 190;
          // Pequena variação estocástica realista de mercado
          const variacao = (Math.random() - 0.5) * 15;
          const precoFinal = Number((precoBase + variacao).toFixed(2));

          cotacoesHistorico.push({
            fonte,
            praca,
            categoria,
            dataRetirada: new Date(dataCaptura.getTime() + 2 * 24 * 60 * 60 * 1000),
            dataDevolucao: new Date(dataCaptura.getTime() + 5 * 24 * 60 * 60 * 1000),
            duracaoDias: duracaoPadrao,
            antecedenciaDias: 2,
            precoDiaria: precoFinal,
            precoTotal: Number((precoFinal * duracaoPadrao).toFixed(2)),
            disponivel: true,
            capturadoEm: dataCaptura
          });
        }
      }
    }
  }

  // 2. Gera a rodada recente de hoje com anomalias controladas
  for (const praca of pracas) {
    for (const categoria of categorias) {
      for (const fonte of fontes) {
        let preco = categoria === 'economico' ? 129.9 : categoria === 'intermediario' ? 165.0 : 195.0;
        let disponivel = true;

        // Injeção de Anomalia 1: Pico de preço da Localiza em SUV em Confins
        if (fonte === 'localiza' && praca === 'aeroporto_confins' && categoria === 'suv') {
          preco = 299.0; // Salto anômalo de preço
        }

        // Injeção de Anomalia 2: Agressividade comercial da Movida em Econômicos
        if (fonte === 'movida' && praca === 'aeroporto_confins' && categoria === 'economico') {
          preco = 89.9; // Desconto agressivo de mais de 30%
        }

        // Injeção de Anomalia 3: Ruptura de estoque da Unidas na Pampulha
        if (fonte === 'unidas' && praca === 'pampulha' && categoria === 'economico') {
          disponivel = false;
        }

        cotacoesRodadaRecente.push({
          fonte,
          praca,
          categoria,
          dataRetirada: new Date(agora.getTime() + 2 * 24 * 60 * 60 * 1000),
          dataDevolucao: new Date(agora.getTime() + 5 * 24 * 60 * 60 * 1000),
          duracaoDias: duracaoPadrao,
          antecedenciaDias: 2,
          precoDiaria: preco,
          precoTotal: Number((preco * duracaoPadrao).toFixed(2)),
          disponivel,
          capturadoEm: agora
        });
      }
    }
  }

  const todasCotacoes = [...cotacoesHistorico, ...cotacoesRodadaRecente];
  console.log(` -> Persistindo ${todasCotacoes.length} cotações no TimescaleDB...`);
  const totalCotacoesSalvas = await repoCotacoes.salvarLote(todasCotacoes);
  console.log(` -> [OK] ${totalCotacoesSalvas} cotações salvas na hypertable.`);

  console.log('\n[2/4] Executando MotorDeteccao estatístico (Z-Score Robusto / MAD)...');
  const insights = motor.processarRodada(cotacoesRodadaRecente, cotacoesHistorico);
  console.log(` -> [OK] ${insights.length} anomalias estatísticas detectadas.`);

  console.log('\n[3/4] Gerando narrativas com LLM e indexando no pgvector (HNSW)...');
  let insightsPersistidos = 0;

  for (const insight of insights) {
    // LLM gera narrativa auditada via enriquecer()
    const { insightEnriquecido } = await narrador.enriquecer(insight);

    // Gera embedding de 1536 dimensões para busca semântica
    const textoVetorizacao = `${insightEnriquecido.tipo} em ${insightEnriquecido.praca} na categoria ${insightEnriquecido.categoria}. ${insightEnriquecido.narrativa}`;
    const embedding = await geradorEmbeddings.gerarEmbedding(textoVetorizacao);

    await repoInsights.salvar(insightEnriquecido, embedding);
    insightsPersistidos++;
    console.log(`   * [${insightEnriquecido.severidade.toUpperCase()}] ${insightEnriquecido.tipo} (${insightEnriquecido.praca} | ${insightEnriquecido.categoria})`);
  }

  console.log(` -> [OK] ${insightsPersistidos} insights vetorizados e salvos com sucesso.`);

  console.log('\n[4/4] Resumo da Semeadura:');
  console.log('===============================================================');
  console.log(`Total de Cotações Inseridas:   ${totalCotacoesSalvas}`);
  console.log(`Total de Anomalias Gravadas:   ${insightsPersistidos}`);
  console.log(`Status do pgvector:            Indexado com HNSW (Cosine)`);
  console.log('===============================================================\n');

  await encerrarPoolConexao();
  console.log('Carga inicial finalizada com sucesso! A base está pronta para demonstração.');
}

semearBaseDeDados().catch((erro) => {
  console.error('Falha na semeadura do banco:', erro);
  process.exit(1);
});
