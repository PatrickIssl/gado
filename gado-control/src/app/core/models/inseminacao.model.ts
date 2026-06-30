export type TipoSemen = 'sexado' | 'convencional';

export interface Inseminacao {
  id: string;
  vaca_id: string;
  data_inseminacao: string;
  repetiu_cio: boolean;
  confirmada_prenhez: boolean;
  observacoes: string | null;
  touro: string | null;
  tipo_semen: TipoSemen | null;
  created_at?: string;
}

export interface InseminacaoFormData {
  vaca_id: string;
  data_inseminacao: string;
  observacoes?: string;
  touro?: string | null;
  tipo_semen?: TipoSemen | null;
}

export const TIPO_SEMEN_LABELS: Record<TipoSemen, string> = {
  sexado: 'Sexado',
  convencional: 'Convencional',
};
