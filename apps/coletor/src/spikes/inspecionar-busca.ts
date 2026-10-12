/**
 * Inspecionar elementos da busca de reserva da Localiza
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium } from 'playwright';

async function inspecionarBuscaLocaliza() {
  console.log('🔍 Inspecionando formulário de reserva da Localiza...');

  const navegador = await chromium.launch({ headless: true });
  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36'
  });

  const pagina = await contexto.newPage();

  // Monitorar todas as requisições disparadas pela digitação ou clique
  pagina.on('request', requisicao => {
    const url = requisicao.url();
    if (!url.includes('google') && !url.includes('facebook') && !url.includes('datadog') && !url.includes('insider')) {
      console.log(`➡️  [Req] ${requisicao.method()} ${url.substring(0, 100)}`);
    }
  });

  await pagina.goto('https://www.localiza.com/brasil/pt-br', { waitUntil: 'domcontentloaded' });
  await pagina.waitForTimeout(3000);

  // Buscar campos de texto ou botões na tela
  const campos = await pagina.evaluate(() => {
    const inputs = Array.from(document.querySelectorAll('input')).map(i => ({
      id: i.id,
      name: i.name,
      placeholder: i.placeholder,
      tipo: i.type,
      ariaLabel: i.getAttribute('aria-label')
    }));
    const botoes = Array.from(document.querySelectorAll('button')).map(b => ({
      texto: b.innerText?.trim(),
      id: b.id,
      ariaLabel: b.getAttribute('aria-label')
    })).filter(b => b.texto && b.texto.length < 40);

    return { inputs, botoes: botoes.slice(0, 15) };
  });

  console.log('\n--- Inputs Encontrados ---');
  console.log(JSON.stringify(campos.inputs, null, 2));

  console.log('\n--- Amostra de Botões ---');
  console.log(JSON.stringify(campos.botoes, null, 2));

  await navegador.close();
}

inspecionarBuscaLocaliza().catch(console.error);
