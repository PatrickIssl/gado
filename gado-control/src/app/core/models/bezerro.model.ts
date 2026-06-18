export interface Bezerro {
  id: string;
  vaca_id: string;
  nome: string;
  sexo: 'macho' | 'femea';
  data_nascimento: string;
  desmamado: boolean;
  created_at?: string;
}

export interface BezerroFormData {
  nome: string;
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
