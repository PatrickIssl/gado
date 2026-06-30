export interface Bezerro {
  id: string;
  vaca_id: string;
  nome: string;
  numero_brinco: string | null;
  sexo: 'macho' | 'femea';
  data_nascimento: string;
  desmamado: boolean;
  brucelose_aplicada?: boolean;
  data_brucelose?: string | null;
  created_at?: string;
}

export interface BezerroFormData {
  nome: string;
  numero_brinco: string;
  sexo: 'macho' | 'femea';
  data_nascimento: string;
}

export interface ProgramaLeite {
  fase: string;
  litrosManha: number;
  litrosTarde: number;
  litrosTotal: number;
  descricao: string;
}
