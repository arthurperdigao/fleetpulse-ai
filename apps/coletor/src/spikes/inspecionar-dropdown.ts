/**
 * Inspecionar estado da tela após digitar "Confins"
 * Captura screenshot e HTML para identificar seletores exatos.
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium } from 'playwright';
import * as caminho from 'node:path';
import * as fs from 'node:fs/promises';

async function inspecionarDropdown() {
  const pastaTmp = caminho.resolve(process.cwd(), '../../tmp');
  await fs.mkdir(pastaTmp, { recursive: true });

  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 }
  });

  const pagina = await contexto.newPage();

  await pagina.goto('https://www.localiza.com/brasil/pt-br', { waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(3000);

  const rotuloAgencia = pagina.getByLabel(/onde você quer retirar/i).or(pagina.locator('label[for="mat-input-2"]'));
  if (await rotuloAgencia.first().isVisible().catch(() => false)) {
    await rotuloAgencia.first().click();
  }

  const campoInput = pagina.locator('#mat-input-2');
  await campoInput.pressSequentially('Confins', { delay: 150 });
  await pagina.waitForTimeout(3000);

  // Capturar screenshot
  const caminhoScreenshot = caminho.join(pastaTmp, 'busca-confins.png');
  await pagina.screenshot({ path: caminhoScreenshot });
  console.log(`📸 Screenshot salvo em: ${caminhoScreenshot}`);

  // Inspecionar elementos visíveis relacionados a autocomplete, painéis ou opções
  const elementos = await pagina.evaluate(() => {
    const paineis = Array.from(document.querySelectorAll('.mat-mdc-autocomplete-panel, .cdk-overlay-pane, [role="listbox"], ul, li')).map(el => ({
      tag: el.tagName,
      classe: el.className,
      texto: el.textContent?.trim().substring(0, 100)
    })).filter(el => el.texto && el.texto.length > 0);

    return paineis.slice(0, 20);
  });

  console.log('📋 Elementos de overlay/opções encontrados:');
  console.log(JSON.stringify(elementos, null, 2));

  await navegador.close();
}

inspecionarDropdown().catch(console.error);
