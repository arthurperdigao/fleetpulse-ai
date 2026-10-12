/**
 * Spike de Viabilidade - Coleta de Cotações da Localiza
 * 
 * Objetivo:
 * Validar se o fluxo público de cotação da Localiza permite interceptação de respostas JSON
 * via Playwright (`page.on('response')`) para extração estruturada de preços, grupos e disponibilidade,
 * além de gerar o arquivo HAR para reprodução determinística (modo replay).
 * 
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium, type Response } from 'playwright';
import * as caminho from 'node:path';
import * as fs from 'node:fs/promises';

interface RespostaInterceptada {
  url: string;
  metodo: string;
  status: number;
  dados: any;
}

export async function executarSpikeLocaliza(opcoes?: { modoVisivel?: boolean }) {
  console.log('🚀 Iniciando Spike de Viabilidade: Localiza...');
  console.log('ℹ️  Critério de aceitação: Interceptar payload JSON de cotação e salvar evidência/HAR.');

  const pastaHar = caminho.resolve(process.cwd(), '../../fixtures/har');
  await fs.mkdir(pastaHar, { recursive: true });
  const arquivoHar = caminho.join(pastaHar, 'localiza-spike.har');

  const navegador = await chromium.launch({
    headless: !(opcoes?.modoVisivel ?? false),
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled']
  });

  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 },
    recordHar: {
      path: arquivoHar,
      mode: 'minimal'
    }
  });

  const pagina = await contexto.newPage();
  const respostasJson: RespostaInterceptada[] = [];

  // Interceptar respostas de rede buscando chamadas de API/JSON
  pagina.on('response', async (resposta: Response) => {
    try {
      const cabecalhos = resposta.headers();
      const tipoConteudo = cabecalhos['content-type'] || '';
      const url = resposta.url();

      if (tipoConteudo.includes('application/json') && resposta.status() === 200) {
        // Filtrar requisições relevantes que possam conter cotações/grupos/tarifas
        const ehRelevante = /booking|cotacao|carros|vehicles|grupos|tarifas|rates|pesquisa|search|available/i.test(url);
        
        if (ehRelevante) {
          try {
            const corpoJson = await resposta.json();
            respostasJson.push({
              url,
              metodo: resposta.request().method(),
              status: resposta.status(),
              dados: corpoJson
            });
            console.log(`✅ [JSON Interceptado] ${resposta.request().method()} ${url.substring(0, 80)}...`);
          } catch {
            // Ignora JSONs malformados ou incompletos de streaming
          }
        }
      }
    } catch {
      // Ignora respostas abortadas ou de preflight
    }
  });

  try {
    console.log('🌐 Navegando para o portal da Localiza...');
    await pagina.goto('https://www.localiza.com/brasil/pt-br', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });

    console.log(`📄 Título da página: "${await pagina.title()}"`);

    // Aguardar estabilização e verificar se carregou elementos essenciais
    await pagina.waitForTimeout(4000);

    console.log(`📊 Total de endpoints JSON relevantes interceptados: ${respostasJson.length}`);

    // Salvar relatório do Spike para análise do SDET
    const pastaRelatorios = caminho.resolve(process.cwd(), '../../tmp');
    await fs.mkdir(pastaRelatorios, { recursive: true });
    const caminhoRelatorio = caminho.join(pastaRelatorios, 'relatorio-spike-localiza.json');
    
    await fs.writeFile(
      caminhoRelatorio,
      JSON.stringify({
        executadoEm: new Date().toISOString(),
        totalInterceptados: respostasJson.length,
        respostas: respostasJson.map(r => ({ url: r.url, status: r.status, amostra: typeof r.dados === 'object' ? Object.keys(r.dados) : null }))
      }, null, 2),
      'utf-8'
    );

    console.log(`💾 Relatório preliminar gravado em: ${caminhoRelatorio}`);
    console.log(`📦 Fixture HAR gravada em: ${arquivoHar}`);

  } catch (erro) {
    console.error('❌ Falha durante execução do spike:', erro);
  } finally {
    await contexto.close();
    await navegador.close();
    console.log('🏁 Spike finalizado.');
  }
}

// Executar diretamente se chamado pelo CLI
if (process.argv[1]?.endsWith('spike-localiza.ts')) {
  executarSpikeLocaliza({ modoVisivel: process.env.MODO_VISIVEL === 'true' });
}
