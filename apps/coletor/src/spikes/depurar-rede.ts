/**
 * Depurador de rede detalhado para o input de agência
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium } from 'playwright';

async function depurarRedeAoDigitar() {
  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const pagina = await contexto.newPage();

  pagina.on('request', req => {
    const u = req.url();
    if (!u.includes('.png') && !u.includes('.jpg') && !u.includes('.svg') && !u.includes('.css') && !u.includes('clarity') && !u.includes('doubleclick') && !u.includes('bing') && !u.includes('adnxs') && !u.includes('google')) {
      console.log(`📡 [REQ] ${req.method()} ${u}`);
    }
  });

  pagina.on('response', resp => {
    const u = resp.url();
    if (resp.status() >= 400) {
      console.log(`⚠️ [FALHA ${resp.status()}] ${resp.request().method()} ${u}`);
    }
  });

  await pagina.goto('https://www.localiza.com/brasil/pt-br', { waitUntil: 'networkidle' });

  console.log('--- Página estabilizada. Digitando "BH"... ---');

  const rotuloAgencia = pagina.getByLabel(/onde você quer retirar/i).or(pagina.locator('label[for="mat-input-2"]'));
  if (await rotuloAgencia.first().isVisible().catch(() => false)) {
    await rotuloAgencia.first().click();
  }

  const campoInput = pagina.locator('#mat-input-2');
  await campoInput.pressSequentially('BH', { delay: 200 });
  await pagina.waitForTimeout(4000);

  await navegador.close();
}

depurarRedeAoDigitar().catch(console.error);
