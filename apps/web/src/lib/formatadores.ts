/**
 * Utilitários de formatação e internacionalização pt-BR para o FleetPulse AI.
 * 
 * Regras:
 * - Padrão brasileiro estrito: R$ 195,00; 62,5%; sinal de menos tipográfico (−); datas dd/MM.
 * - Números tabulares e rótulos amigáveis sem jargões internos.
 */

const formatadorMoeda = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const formatadorDecimal = new Intl.NumberFormat('pt-BR', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1
});

const formatadorInteiroPadrao = new Intl.NumberFormat('pt-BR');

export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined || isNaN(valor)) return 'R$ 0,00';
  return formatadorMoeda.format(valor);
}

export function formatarPercentual(valor: number | null | undefined, comSinal = true): string {
  if (valor === null || valor === undefined || isNaN(valor)) return '0,0%';
  const formatado = formatadorDecimal.format(Math.abs(valor));
  if (valor < 0 && comSinal) {
    return `−${formatado}%`; // Sinal de menos tipográfico U+2212
  }
  if (valor > 0 && comSinal) {
    return `+${formatado}%`;
  }
  return `${formatado}%`;
}

export function formatarDataCurta(dataValor: Date | string): string {
  const data = typeof dataValor === 'string' ? new Date(dataValor) : dataValor;
  if (isNaN(data.getTime())) return '--/--';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(data);
}

export function formatarInteiro(valor: number): string {
  return formatadorInteiroPadrao.format(valor);
}

export function rotuloPraca(praca: string): string {
  switch (praca) {
    case 'aeroporto_confins':
      return 'Aeroporto de Confins';
    case 'pampulha':
      return 'Pampulha';
    case 'savassi':
      return 'Savassi';
    case 'rodoviaria_bh':
      return 'Rodoviária de BH';
    default:
      return praca.replace('_', ' ');
  }
}

export function rotuloCategoria(categoria: string): string {
  switch (categoria) {
    case 'economico':
    case 'economico_com_ar':
      return 'Econômico';
    case 'intermediario':
    case 'sedan_medio':
      return 'Sedan / Intermediário';
    case 'suv':
    case 'suv_compacto':
      return 'SUV';
    default:
      return categoria.replace('_', ' ');
  }
}

export function rotuloFonte(fonte: string): string {
  switch (fonte.toLowerCase()) {
    case 'localiza':
      return 'Localiza';
    case 'movida':
      return 'Movida';
    case 'unidas':
      return 'Unidas';
    default:
      return fonte;
  }
}

export function rotuloSeveridade(severidade: string): { texto: string; nivel: 'critico' | 'atencao' | 'ok' } {
  switch (severidade) {
    case 'critica':
      return { texto: 'Crítico', nivel: 'critico' };
    case 'alta':
      return { texto: 'Atenção alta', nivel: 'critico' };
    case 'media':
      return { texto: 'Atenção', nivel: 'atencao' };
    case 'baixa':
    default:
      return { texto: 'Informativo', nivel: 'ok' };
  }
}
