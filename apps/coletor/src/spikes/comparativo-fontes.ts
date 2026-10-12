/**
 * Spike Comparativo: Movida e Seminovos Localiza
 * Avalia a viabilidade de coleta ao vivo vs necessidade de modo Replay.
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium } from 'playwright';

async function testarFontesAlternativas() {
  console.log('🔍 Testando fontes alternativas (Movida e Seminovos Localiza)...');

  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const pagina = await contexto.newPage();

  // Testar Seminovos Localiza
  try {
    console.log('🚗 Acessando Seminovos Localiza...');
    const respostaSeminovos = await pagina.goto('https://seminovos.localiza.com/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log(`✅ Seminovos Localiza carregou com status: ${respostaSeminovos?.status()} - Título: "${await pagina.title()}"`);
  } catch (e: any) {
    console.log('⚠️ Erro ao acessar Seminovos Localiza:', e.message);
  }

  // Testar Movida
  try {
    console.log('🚙 Acessando Movida...');
    const respostaMovida = await pagina.goto('https://www.movida.com.br/', { waitUntil: 'domcontentloaded', timeout: 20000 });
    console.log(`✅ Movida carregou com status: ${respostaMovida?.status()} - Título: "${await pagina.title()}"`);
  } catch (e: any) {
    console.log('⚠️ Erro ao acessar Movida:', e.message);
  }

  await navegador.close();
  console.log('🏁 Comparativo finalizado.');
}

testarFontesAlternativas().catch(console.error);
