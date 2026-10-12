/**
 * Exibir onde "Belo Horizonte" ocorre no HAR
 * Regra: Código 100% em Português do Brasil.
 */

import * as fs from 'node:fs/promises';
import * as caminho from 'node:path';

async function localizarBH() {
  const caminhoHar = caminho.resolve(process.cwd(), '../../fixtures/har/localiza-spike.har');
  const conteudoTexto = await fs.readFile(caminhoHar, 'utf-8');
  const har = JSON.parse(conteudoTexto);

  for (const entrada of har.log.entries) {
    const texto = entrada.response?.content?.text || '';
    if (texto.includes('Belo Horizonte')) {
      console.log(`📍 URL: ${entrada.request.method} ${entrada.request.url}`);
      console.log(`MimeType: ${entrada.response?.content?.mimeType}`);
      // mostrar trecho
      const idx = texto.indexOf('Belo Horizonte');
      console.log(`Trecho: ${texto.substring(Math.max(0, idx - 100), Math.min(texto.length, idx + 100))}\n`);
    }
  }
}

localizarBH().catch(console.error);
