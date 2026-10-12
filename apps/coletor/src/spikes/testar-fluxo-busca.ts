/**
 * Teste do Fluxo Completo de Busca da Localiza
 * Preenche Agência (Confins), datas e submete a busca para capturar a resposta JSON de grupos e tarifas.
 * Regra: Código 100% em Português do Brasil.
 */

import { chromium, type Response } from 'playwright';
import * as fs from 'node:fs/promises';
import * as caminho from 'node:path';

async function testarFluxoBusca() {
  console.log('🚀 Iniciando teste do fluxo de busca Localiza (Confins)...');

  const navegador = await chromium.launch({
    headless: true,
    args: ['--disable-blink-features=AutomationControlled']
  });

  const contexto = await navegador.newContext({
    locale: 'pt-BR',
    timezoneId: 'America/Sao_Paulo',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 }
  });

  const pagina = await contexto.newPage();
  const endpointsInteressantes: Array<{ url: string; metodo: string; status: number; dados: any }> = [];

  pagina.on('response', async (resposta: Response) => {
    try {
      const tipo = resposta.headers()['content-type'] || '';
      const url = resposta.url();
      if (tipo.includes('application/json') && resposta.status() === 200) {
        if (/agencia|agency|pesquisa|search|disponibilidade|carros|vehicles|grupos|groups|rate|cotacao|aluguel/i.test(url)) {
          const corpo = await resposta.json().catch(() => null);
          if (corpo) {
            endpointsInteressantes.push({
              url,
              metodo: resposta.request().method(),
              status: resposta.status(),
              dados: corpo
            });
            console.log(`🎯 [API Detectada] ${resposta.request().method()} ${url}`);
          }
        }
      }
    } catch {
      // Ignorar erros de ciclo de vida de rede
    }
  });

  try {
    await pagina.goto('https://www.localiza.com/brasil/pt-br', { waitUntil: 'domcontentloaded' });
    await pagina.waitForTimeout(3000);

    // Fechar banner de cookies se existir
    const botaoCookies = pagina.locator('button:has-text("Aceitar"), button:has-text("Prosseguir")');
    if (await botaoCookies.first().isVisible().catch(() => false)) {
      await botaoCookies.first().click();
      console.log('🍪 Banner de cookies aceito.');
    }

    // Campo de agência de retirada (Angular Material MDC: o mat-label flutuante intercepta cliques diretos no input)
    console.log('📍 Focando no campo de agência de retirada...');
    const rotuloAgencia = pagina.getByLabel(/onde você quer retirar/i).or(pagina.locator('label[for="mat-input-2"]'));
    if (await rotuloAgencia.first().isVisible().catch(() => false)) {
      await rotuloAgencia.first().click();
    } else {
      const campoAgencia = pagina.locator('#mat-input-2');
      await campoAgencia.click({ force: true });
    }

    const campoInput = pagina.locator('#mat-input-2');
    await campoInput.pressSequentially('Confins', { delay: 100 });
    console.log('⌨️  Texto "Confins" preenchido.');
    await pagina.waitForTimeout(2500);


    // Aguardar opções do autocompletar (Angular Material mat-option)
    const opcaoAutocompletar = pagina.locator('mat-option, [role="option"]').first();
    if (await opcaoAutocompletar.isVisible().catch(() => false)) {
      const textoOpcao = await opcaoAutocompletar.innerText();
      console.log(`📍 Selecionando opção: "${textoOpcao.trim()}"`);
      await opcaoAutocompletar.click();
    } else {
      console.log('⚠️ Nenhuma opção do autocompletar visível imediatamente.');
    }

    await pagina.waitForTimeout(1500);

    // Localizar botão de pesquisa/continuar
    console.log('🔎 Localizando botão de busca...');
    const botaoBusca = pagina.locator('button:has-text("Continuar"), button:has-text("Buscar"), button:has-text("Pesquisar"), button:has-text("Ver carros")').first();
    
    if (await botaoBusca.isVisible().catch(() => false)) {
      console.log('🖱️ Clicando no botão de busca...');
      await botaoBusca.click();
      await pagina.waitForTimeout(6000);
    } else {
      console.log('⚠️ Botão de busca não encontrado diretamente, verificando formulário...');
    }

    console.log(`\n📊 Total de endpoints de negócio capturados: ${endpointsInteressantes.length}`);

    // Gravar evidências
    const pastaTmp = caminho.resolve(process.cwd(), '../../tmp');
    await fs.mkdir(pastaTmp, { recursive: true });
    await fs.writeFile(
      caminho.join(pastaTmp, 'evidencias-busca-localiza.json'),
      JSON.stringify(endpointsInteressantes, null, 2),
      'utf-8'
    );
    console.log('📁 Evidências salvas em tmp/evidencias-busca-localiza.json');

  } catch (erro) {
    console.error('❌ Erro durante o fluxo de busca:', erro);
  } finally {
    await contexto.close();
    await navegador.close();
    console.log('🏁 Fluxo concluído.');
  }
}

testarFluxoBusca().catch(console.error);
