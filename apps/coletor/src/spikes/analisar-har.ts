/**
 * Analisador de arquivo HAR
 * Filtra e resume todas as chamadas de API/JSON registradas durante o fluxo de navegação.
 * Regra: Código 100% em Português do Brasil.
 */

import * as fs from 'node:fs/promises';
import * as caminho from 'node:path';

async function analisarHar() {
  const caminhoHar = caminho.resolve(process.cwd(), '../../fixtures/har/localiza-spike.har');
  const conteudoTexto = await fs.readFile(caminhoHar, 'utf-8');
  const har = JSON.parse(conteudoTexto);

  console.log(`📦 Total de requisições registradas no HAR: ${har.log.entries.length}`);

  const chamadasJson: Array<{ metodo: string; url: string; status: number; tamanho: number }> = [];

  for (const entrada of har.log.entries) {
    const tipoMime = entrada.response.content.mimeType || '';
    if (tipoMime.includes('application/json') || entrada.request.url.includes('/api/') || entrada.request.url.includes('.json')) {
      chamadasJson.push({
        metodo: entrada.request.method,
        url: entrada.request.url,
        status: entrada.response.status,
        tamanho: entrada.response.content.size || 0
      });
    }
  }

  console.log(`🔍 Chamadas com JSON ou /api/: ${chamadasJson.length}`);
  
  // Exibir amostras únicas de domínios e caminhos
  const urlsUnicas = Array.from(new Set(chamadasJson.map(c => `${c.metodo} ${c.url.split('?')[0]}`)));
  console.log('\n--- Amostra de Endpoints Encontrados ---');
  for (const u of urlsUnicas.slice(0, 30)) {
    console.log(`• ${u}`);
  }
}

analisarHar().catch(console.error);
