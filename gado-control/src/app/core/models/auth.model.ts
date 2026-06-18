export interface Fazenda {
  id: string;
  nome: string;
  created_at?: string;
}

export interface Perfil {
  id: string;
  user_id: string;
  fazenda_id: string;
  nome: string;
  created_at?: string;
  fazenda?: Fazenda;
}

export interface PerfilCompleto extends Perfil {
  fazenda: Fazenda;
}

export interface LoginFormData {
  email: string;
  senha: string;
}

export interface CadastroFormData {
  email: string;
  senha: string;
  nome: string;
  nomeFazenda: string;
}

export interface CompletarCadastroFormData {
  nome: string;
  nomeFazenda: string;
}
