import { ProgramaLeite } from '../models/bezerro.model';
import { addDays, daysSince } from './date.utils';

const DIAS_BEZERREIRO = 90;

export function diasNoBezerreiro(dataNascimento: string): number {
  return daysSince(dataNascimento);
}

export function dataSaidaBezerreiro(dataNascimento: string): string {
  return addDays(dataNascimento, DIAS_BEZERREIRO);
}

export function diasRestantesBezerreiro(dataNascimento: string): number {
  return DIAS_BEZERREIRO - diasNoBezerreiro(dataNascimento);
}

export function programaLeiteAtual(dataNascimento: string): ProgramaLeite {
  const dias = diasNoBezerreiro(dataNascimento);

  if (dias < 0) {
    return {
      fase: 'Não nascido',
      litrosManha: 0,
      litrosTarde: 0,
      litrosTotal: 0,
      descricao: 'Aguardando nascimento',
    };
  }

  if (dias <= 30) {
    return {
      fase: '1º mês',
      litrosManha: 3,
      litrosTarde: 3,
      litrosTotal: 6,
      descricao: '6L/dia — 3L manhã + 3L tarde',
    };
  }

  if (dias <= 60) {
    return {
      fase: '2º mês',
      litrosManha: 2,
      litrosTarde: 2,
      litrosTotal: 4,
      descricao: '4L/dia — 2L manhã + 2L tarde',
    };
  }

  if (dias <= 90) {
    return {
      fase: '3º mês (desmame)',
      litrosManha: 3,
      litrosTarde: 0,
      litrosTotal: 3,
      descricao: '3L manhã — desmame ao final do mês',
    };
  }

  return {
    fase: 'Desmamado',
    litrosManha: 0,
    litrosTarde: 0,
    litrosTotal: 0,
    descricao: 'Sem leite — desmame concluído',
  };
}

export function estaDesmamado(dataNascimento: string): boolean {
  return diasNoBezerreiro(dataNascimento) > 90;
}

export { DIAS_BEZERREIRO };
