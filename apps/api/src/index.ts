/**
 * Ponto de entrada principal da API FleetPulse AI.
 * Regra: Código 100% em Português do Brasil.
 */

import { criarServidor } from './servidor.js';

export * from './ferramentas/contrato-ferramenta.js';
export * from './ferramentas/ferramenta-consulta-sql.js';
export * from './ferramentas/ferramenta-busca-semantica.js';
export * from './ferramentas/ferramenta-calculo-gap.js';
export * from './agente/validador-resposta-chat.js';
export * from './agente/agente-observabilidade.js';
export * from './servidor.js';

const porta = Number(process.env.PORT || process.env.API_PORTA || 3001);
const host = process.env.HOST || '0.0.0.0';

// Inicia o servidor se executado diretamente
if (process.env.NODE_ENV !== 'test') {
  criarServidor({ ativarLogs: true })
    .then((servidor) => {
      servidor.listen({ port: porta, host }, (erro, endereco) => {
        if (erro) {
          console.error('[FleetPulse:API] Falha ao iniciar servidor:', erro);
          process.exit(1);
        }
        console.log(`[FleetPulse:API] Servidor ativo e operando em ${endereco}`);
      });
    })
    .catch((erro) => {
      console.error('[FleetPulse:API] Erro de inicialização:', erro);
      process.exit(1);
    });
}
