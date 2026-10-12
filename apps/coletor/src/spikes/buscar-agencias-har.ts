/**
 * Busca por agências de BH no HAR gravado
 * Regra: Código 100% em Português do Brasil.
 */

import * as fs from 'node:fs/promises';
import * as caminho from 'node:path';

async function buscarAgenciasNoHar() {
  const caminhoHar = caminho.resolve(process.cwd(), '../../fixtures/har/localiza-spike.har');
  const conteudoTexto = await fs.readFile(caminhoHar, 'utf-8');

  const termos = ['Confins', 'Pampulha', 'Tancredo Neves', 'CNF', 'PLU', 'Belo Horizonte'];

  console.log('🔍 Pesquisando termos de agências de BH dentro do HAR gravado...');

  for (const termo of termos) {
    const regex = new RegExp(termo, 'gi');
    const ocorrencias = (conteudoTexto.match(regex) || []).length;
    console.log(`• Termo "${termo}": ${ocorrencias} ocorrências encontradas no HAR.`);
  }

  // Se encontrar ocorrências, localizar em quais respostas estão
  const har = JSON.parse(conteudoTexto);
  console.log('\n🔎 Mapeando entradas do HAR contendo "Confins" ou "Pampulha":');

  for (const entrada of har.log.entries) {
    const textoResposta = entrada.response?.content?.text || '';
    if (/confins|pampulha|tancredo neves/i.test(textoResposta)) {
      console.log(`\n📍 Encontrado em: ${entrada.request.method} ${entrada.request.url}`);
      console.log(`   Tipo: ${entrada.response.content.mimeType}`);
      console.log(`   Tamanho: ${entrada.response.content.size}`);
    }
  }
}

buscarAgenciasNoHar().catch(console.error);
