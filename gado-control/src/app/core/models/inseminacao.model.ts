export interface Inseminacao {
  id: string;
  vaca_id: string;
  data_inseminacao: string;
  repetiu_cio: boolean;
  confirmada_prenhez: boolean;
  observacoes: string | null;
  created_at?: string;
}

export interface InseminacaoFormData {
  vaca_id: string;
  data_inseminacao: string;
  observacoes?: string;
}
