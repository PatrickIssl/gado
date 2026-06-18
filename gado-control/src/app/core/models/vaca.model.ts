export type StatusVaca =
  | 'vazia'
  | 'prenha'
  | 'lactacao'
  | 'seca'
  | 'pre_parto'
  | 'em_protocolo_iatf';

export interface Vaca {
  id: string;
  numero: string;
  nome: string;
  raca: string;
  status: StatusVaca;
  data_parto: string | null;
  data_ultima_inseminacao: string | null;
  data_inseminacao_prenhez: string | null;
  data_inicio_protocolo_iatf: string | null;
  dias_protocolo_iatf: number | null;
  /** Preenchido via tabela cios (não é coluna persistida em vacas). */
  ultimo_cio?: string | null;
  created_at?: string;
}

export interface VacaFormData {
  numero: string;
  nome: string;
  raca: string;
  status: StatusVaca;
}

export interface DatasCiclo {
  ultimoParto: string | null;
  fimLactacao: string | null;
  partoPrevisto: string | null;
  partoPrevistoAprox: string | null;
  inicioSeca: string | null;
  preParto: string | null;
  fimSeca: string | null;
  dataInseminar: string | null;
  dataVerificarPrenhez: string | null;
  diasParaVerificarPrenhez: number | null;
}

export type DestaqueLinhaData = 'action' | 'warn' | 'highlight';

export type VarianteResumo = 'action' | 'warn' | 'highlight' | 'neutral';

export interface VacaResumoVisual {
  proximaAcao: {
    id: string;
    titulo: string;
    data: string;
    variante: VarianteResumo;
  } | null;
  marcos: Array<{
    id: string;
    label: string;
    data: string;
  }>;
}

export interface LinhaData {
  id: string;
  label: string;
  data: string;
  destaque?: DestaqueLinhaData;
  mostrarBotaoInseminar?: boolean;
  mostrarBotaoProtocolo?: boolean;
}

export const STATUS_LABELS: Record<StatusVaca, string> = {
  vazia: 'Vazia',
  prenha: 'Prenha',
  lactacao: 'Lactação',
  seca: 'Seca',
  pre_parto: 'Pré-Parto',
  em_protocolo_iatf: 'Em Protocolo IATF',
};

export const STATUS_OPTIONS: StatusVaca[] = [
  'vazia',
  'prenha',
  'lactacao',
  'seca',
  'pre_parto',
  'em_protocolo_iatf',
];
