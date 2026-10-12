/**
 * Teste com Aceite Explícito de Cookies antes da busca
 * Hipótese: O banner da Securiti.ai bloqueia o serviço de agências até o consentimento.
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium } from 'playwright';
import * as caminho from 'node:path';
import * as fs from 'node:fs/promises';

async function testarComConsentimentoCookies() {
  const pastaTmp = caminho.resolve(process.cwd(), '../../tmp');
  await fs.mkdir(pastaTmp, { recursive: true });

  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 }
  });

  const pagina = await contexto.newPage();

  pagina.on('request', req => {
    const u = req.url();
    if (/agencia|agency|branch|location|search|autocomplete/i.test(u)) {
      console.log(`📡 [REQ Agência] ${req.method()} ${u}`);
    }
  });

  pagina.on('response', async resp => {
    const u = resp.url();
    if (/agencia|agency|branch|location|search|autocomplete/i.test(u)) {
      console.log(`📥 [RESP Agência ${resp.status()}] ${u}`);
      try {
        const corpo = await resp.text();
        console.log(`   Corpo (${corpo.length} bytes): ${corpo.substring(0, 250)}`);
      } catch {}
    }
  });

  console.log('🌐 Acessando Localiza...');
  await pagina.goto('https://www.localiza.com/brasil/pt-br', { waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(3000);

  // Localizar e clicar no botão "Manter cookies"
  console.log('🍪 Procurando botão de consentimento de cookies...');
  const botaoManterCookies = pagina.locator('button:has-text("Manter cookies")').first();
  if (await botaoManterCookies.isVisible({ timeout: 5000 }).catch(() => false)) {
    console.log('🍪 Clicando em "Manter cookies"...');
    await botaoManterCookies.click();
    await pagina.waitForTimeout(2000);
  } else {
    console.log('⚠️ Botão "Manter cookies" não encontrado diretamente pelo texto.');
  }

  // Clicar no input de agência
  console.log('📍 Clicando no campo de agência...');
  const campoAgencia = pagina.locator('#mat-input-2');
  await campoAgencia.click({ force: true });
  await pagina.waitForTimeout(1000);

  console.log('⌨️ Digitando "Confins"...');
  await campoAgencia.pressSequentially('Confins', { delay: 150 });
  await pagina.waitForTimeout(4000);

  // Capturar screenshot após aceite de cookies
  const caminhoScreenshot = caminho.join(pastaTmp, 'busca-apos-cookies.png');
  await pagina.screenshot({ path: caminhoScreenshot });
  console.log(`📸 Screenshot salvo em: ${caminhoScreenshot}`);

  await navegador.close();
}

testarComConsentimentoCookies().catch(console.error);
