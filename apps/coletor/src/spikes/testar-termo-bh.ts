/**
 * Testar busca de agência com "Belo Horizonte"
 * Identifica o endpoint de agências e o autocompletar correto.
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium } from 'playwright';
import * as caminho from 'node:path';
import * as fs from 'node:fs/promises';

async function testarTermoBeloHorizonte() {
  const pastaTmp = caminho.resolve(process.cwd(), '../../tmp');
  await fs.mkdir(pastaTmp, { recursive: true });

  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 }
  });

  const pagina = await contexto.newPage();

  // Monitorar requisições durante a busca
  pagina.on('response', async resposta => {
    const url = resposta.url();
    if (resposta.status() === 200 && resposta.headers()['content-type']?.includes('application/json')) {
      if (/agencia|agency|branch|location|place|autocomplete|search/i.test(url)) {
        console.log(`🎯 [API Agência Encontrada] ${resposta.request().method()} ${url}`);
        try {
          const dados = await resposta.json();
          console.log('Amostra de resposta:', JSON.stringify(dados).substring(0, 300));
        } catch {}
      }
    }
  });

  await pagina.goto('https://www.localiza.com/brasil/pt-br', { waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(3000);

  // Clicar em "Manter cookies" para tirar o banner da frente
  const botaoCookies = pagina.locator('button:has-text("Manter cookies"), button:has-text("Aceitar")').first();
  if (await botaoCookies.isVisible().catch(() => false)) {
    await botaoCookies.click();
    console.log('🍪 Cookies aceitos.');
  }

  const rotuloAgencia = pagina.getByLabel(/onde você quer retirar/i).or(pagina.locator('label[for="mat-input-2"]'));
  if (await rotuloAgencia.first().isVisible().catch(() => false)) {
    await rotuloAgencia.first().click();
  }

  const campoInput = pagina.locator('#mat-input-2');
  console.log('⌨️ Digitando "Belo Horizonte"...');
  await campoInput.pressSequentially('Belo Horizonte', { delay: 100 });
  await pagina.waitForTimeout(3000);

  // Capturar screenshot
  const caminhoScreenshot = caminho.join(pastaTmp, 'busca-belo-horizonte.png');
  await pagina.screenshot({ path: caminhoScreenshot });
  console.log(`📸 Screenshot salvo em: ${caminhoScreenshot}`);

  // Inspecionar dropdown de resultados
  const opcoes = await pagina.evaluate(() => {
    const itens = Array.from(document.querySelectorAll('mat-option, .mat-mdc-option, [role="option"], .list-agencias, .agencia-item')).map(o => ({
      texto: o.textContent?.trim().replace(/\s+/g, ' '),
      id: o.id
    }));
    return itens;
  });

  console.log('🏢 Opções de agências encontradas:');
  console.log(JSON.stringify(opcoes, null, 2));

  await navegador.close();
}

testarTermoBeloHorizonte().catch(console.error);
