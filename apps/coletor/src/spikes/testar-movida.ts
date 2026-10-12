/**
 * Spike de Coleta: Movida
 * Testa busca de agências e cotações na Movida para validar captura de JSON.
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium, type Response } from 'playwright';

async function testarColetaMovida() {
  console.log('🚙 Iniciando teste de captura na Movida...');

  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const pagina = await contexto.newPage();
  const apisCapturadas: string[] = [];

  pagina.on('response', async (resposta: Response) => {
    const url = resposta.url();
    const tipo = resposta.headers()['content-type'] || '';
    if (tipo.includes('application/json') && resposta.status() === 200) {
      if (/loja|agencia|store|carro|veiculo|tarifa|rate|cotacao|search|disponibilidade/i.test(url)) {
        apisCapturadas.push(`${resposta.request().method()} ${url}`);
        console.log(`🎯 [Movida API] ${resposta.request().method()} ${url.substring(0, 100)}`);
      }
    }
  });

  await pagina.goto('https://www.movida.com.br/', { waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(3000);

  // Procurar campo de retirada
  const campoRetirada = pagina.locator('input[placeholder*="retirada"], input[placeholder*="loja"], #search, input[type="text"]').first();
  if (await campoRetirada.isVisible().catch(() => false)) {
    console.log('📍 Digitando "Confins" na Movida...');
    await campoRetirada.click();
    await campoRetirada.pressSequentially('Confins', { delay: 150 });
    await pagina.waitForTimeout(3000);
  }

  console.log(`📊 Total de APIs de negócio capturadas na Movida: ${apisCapturadas.length}`);
  await navegador.close();
}

testarColetaMovida().catch(console.error);
