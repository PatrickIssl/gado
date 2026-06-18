export interface Cio {
  id: string;
  vaca_id: string;
  data_cio: string;
  observacoes: string | null;
  created_at?: string;
}

export interface CioFormData {
  vaca_id: string;
  data_cio: string;
  observacoes?: string;
}
