import { z } from 'zod';

export const FonteEnum = z.enum(['localiza', 'movida', 'unidas']);
export type Fonte = z.infer<typeof FonteEnum>;

export const PracaEnum = z.enum([
  'aeroporto_confins', // Aeroporto Internacional de Belo Horizonte (CNF)
  'pampulha',          // Agência Pampulha / Av. Antônio Carlos
  'rodoviaria_bh',     // Região Central / Rodoviária BH
  'savassi'            // Região Savassi / Centro-Sul BH
]);
export type Praca = z.infer<typeof PracaEnum>;

export const CategoriaEnum = z.enum([
  'economico',     // Grupo B / Compacto 1.0 (ex.: Mobi, Kwid, HB20)
  'intermediario', // Grupo C / Sedan / Hatch 1.6 / Automático (ex.: Onix Plus, Cronos)
  'suv'            // Grupo F / SUV Compacto (ex.: T-Cross, Renegade, Tracker)
]);
export type Categoria = z.infer<typeof CategoriaEnum>;

/**
 * Esquema padronizado de cotação de aluguel de veículos.
 * Aplica validações estritas de sanidade (preços positivos, datas coerentes).
 */
export const EsquemaCotacao = z.object({
  id: z.string().uuid().optional(),
  capturadoEm: z.coerce.date(),
  fonte: FonteEnum,
  praca: PracaEnum,
  categoria: CategoriaEnum,
  dataRetirada: z.coerce.date(),
  dataDevolucao: z.coerce.date(),
  duracaoDias: z.number().int().min(1, 'A duração mínima é de 1 dia').max(90, 'A duração máxima é de 90 dias'),
  antecedenciaDias: z.number().int().min(0, 'A antecedência não pode ser negativa').max(365),
  precoDiaria: z.number().positive('O preço da diária deve ser estritamente maior que zero'),
  precoTotal: z.number().positive('O preço total deve ser estritamente maior que zero'),
  disponivel: z.boolean().default(true),
  grupoOriginal: z.string().optional(), // ex: "Grupo B - Compacto Com Ar"
  modeloExemplo: z.string().optional(), // ex: "Fiat Mobi 1.0 ou similar"
  referenciaBruta: z.string().optional() // Identificador ou hash de rastreamento do payload original
});

export type Cotacao = z.infer<typeof EsquemaCotacao>;

/**
 * Tipos de anomalias detectáveis no mercado
 */
export const TipoAnomaliaEnum = z.enum([
  'pico_preco',                 // Aumento abrupto fora da distribuição histórica
  'concorrente_mais_barato',    // Concorrente com preço agressivamente menor
  'queda_disponibilidade',      // Indisponibilidade de grupo em praça crítica
  'mudanca_esquema'             // Alteração estrutural no payload capturado
]);
export type TipoAnomalia = z.infer<typeof TipoAnomaliaEnum>;

export const SeveridadeEnum = z.enum(['baixa', 'media', 'alta', 'critica']);
export type Severidade = z.infer<typeof SeveridadeEnum>;

/**
 * Esquema de insight de anomalia gerado pelo pipeline
 */
export const EsquemaInsightAnomalia = z.object({
  id: z.string().uuid().optional(),
  detectadoEm: z.coerce.date(),
  tipo: TipoAnomaliaEnum,
  severidade: SeveridadeEnum,
  praca: PracaEnum,
  categoria: CategoriaEnum,
  periodo: z.string(), // ex: "2026-10-20 até 2026-10-23"
  metricas: z.record(z.any()), // Objeto com zScore, mediana, mad, precoAtual, variacaoPercentual
  narrativa: z.string().min(10, 'A narrativa da anomalia deve ter no mínimo 10 caracteres'),
  status: z.enum(['novo', 'verificado_humano', 'rejeitado_humano']).default('novo')
});

export type InsightAnomalia = z.infer<typeof EsquemaInsightAnomalia>;
