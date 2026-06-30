import { DatasCiclo, LinhaData, StatusVaca, Vaca, VacaResumoVisual } from '../models/vaca.model';
import { addDays, addMonths, daysFromToday, todayISO } from './date.utils';

const MESES_LACTACAO = 7;
const DIAS_PERIODO_SECA = 60;
const DIAS_PRE_PARTO_ANTES_PARTO = 30;
const DIAS_SECAR_ANTES_PARTO = 60;
const DIAS_APOS_PARTO_INSEMINAR = 40;
const DIAS_VERIFICAR_PRENHEZ = 21;
const DIAS_GESTACAO = 283;
const DIAS_PROTOCOLO_IATF_PADRAO = 11;

const LABEL_SECAGEM = 'Secagem';
const LABEL_PREVISAO_PARTO = 'Previsão do parto';

function dataSecagem(datas: DatasCiclo): string | null {
  return datas.inicioSeca ?? datas.fimLactacao;
}

export function ultimoCio(vaca: Vaca): string | null {
  return vaca.ultimo_cio ?? null;
}

export function dataFimProtocoloIatf(vaca: Vaca): string | null {
  if (!vaca.data_inicio_protocolo_iatf) return null;
  const dias = vaca.dias_protocolo_iatf ?? DIAS_PROTOCOLO_IATF_PADRAO;
  return addDays(vaca.data_inicio_protocolo_iatf, dias);
}

export function emProtocoloAtivo(vaca: Vaca): boolean {
  if (vaca.status !== 'em_protocolo_iatf' || !vaca.data_inicio_protocolo_iatf) return false;
  const fim = dataFimProtocoloIatf(vaca);
  return fim ? todayISO() <= fim : false;
}

export function protocoloVencido(vaca: Vaca): boolean {
  if (!vaca.data_inicio_protocolo_iatf) return false;
  const fim = dataFimProtocoloIatf(vaca);
  return fim ? todayISO() > fim : false;
}

export function protocoloEncerradoPendenteInseminacao(vaca: Vaca): boolean {
  if (!protocoloVencido(vaca)) return false;
  if (ehPrenha(vaca) || aguardandoVerificarPrenhez(vaca)) return false;
  if (
    vaca.data_ultima_inseminacao &&
    vaca.data_inicio_protocolo_iatf &&
    vaca.data_ultima_inseminacao >= vaca.data_inicio_protocolo_iatf
  ) {
    return false;
  }
  return true;
}

function calcularDataInseminar40d(vaca: Vaca, prenha: boolean): string | null {
  if (prenha) return null;

  const porParto = vaca.data_parto
    ? addDays(vaca.data_parto, DIAS_APOS_PARTO_INSEMINAR)
    : null;
  const porAborto = vaca.data_aborto
    ? addDays(vaca.data_aborto, DIAS_APOS_PARTO_INSEMINAR)
    : null;

  if (porAborto && porParto) {
    return porAborto > porParto ? porAborto : porParto;
  }
  return porAborto ?? porParto;
}

export function usaReferenciaAbortoParaInseminar(vaca: Vaca): boolean {
  if (!vaca.data_aborto || ehPrenha(vaca)) return false;
  if (!vaca.data_parto) return true;
  const porAborto = addDays(vaca.data_aborto, DIAS_APOS_PARTO_INSEMINAR);
  const porParto = addDays(vaca.data_parto, DIAS_APOS_PARTO_INSEMINAR);
  return porAborto >= porParto;
}

export function labelInseminar40d(vaca: Vaca): string {
  return usaReferenciaAbortoParaInseminar(vaca)
    ? 'Inseminar (40d pós-aborto)'
    : 'Inseminar (40d pós-parto)';
}

export function calcularDatasCiclo(vaca: Vaca): DatasCiclo {
  const dataInsemPrenhez =
    vaca.data_inseminacao_prenhez ??
    (vaca.status === 'prenha' ? vaca.data_ultima_inseminacao : null);
  const prenha = vaca.status === 'prenha' && !!dataInsemPrenhez;

  let ultimoParto: string | null = vaca.data_parto;
  let fimLactacao: string | null = null;
  let partoPrevisto: string | null = null;
  let inicioSeca: string | null = null;
  let preParto: string | null = null;
  let fimSeca: string | null = null;
  let dataInseminar: string | null = null;
  let dataVerificarPrenhez: string | null = null;
  let partoPrevistoAprox: string | null = null;
  let diasParaVerificarPrenhez: number | null = null;

  if (vaca.data_parto) {
    fimLactacao = addMonths(vaca.data_parto, MESES_LACTACAO);
  }

  if (!prenha) {
    dataInseminar = calcularDataInseminar40d(vaca, false);
  }

  if (prenha && dataInsemPrenhez) {
    partoPrevisto = addDays(dataInsemPrenhez, DIAS_GESTACAO);
    inicioSeca = addDays(partoPrevisto, -DIAS_SECAR_ANTES_PARTO);
    preParto = addDays(partoPrevisto, -DIAS_PRE_PARTO_ANTES_PARTO);
    fimLactacao = inicioSeca;
  } else if (vaca.data_parto && fimLactacao) {
    inicioSeca = fimLactacao;
    fimSeca = addDays(inicioSeca, DIAS_PERIODO_SECA);
    preParto = addDays(fimSeca, -DIAS_PRE_PARTO_ANTES_PARTO);
  }

  if (vaca.data_ultima_inseminacao && vaca.status !== 'prenha') {
    dataVerificarPrenhez = addDays(vaca.data_ultima_inseminacao, DIAS_VERIFICAR_PRENHEZ);
    diasParaVerificarPrenhez = daysFromToday(dataVerificarPrenhez);
    partoPrevistoAprox = addDays(vaca.data_ultima_inseminacao, DIAS_GESTACAO);
  }

  return {
    ultimoParto,
    fimLactacao,
    partoPrevisto,
    partoPrevistoAprox,
    inicioSeca,
    preParto,
    fimSeca,
    dataInseminar,
    dataVerificarPrenhez,
    diasParaVerificarPrenhez,
  };
}

export function ehPrenha(vaca: Vaca): boolean {
  return (
    vaca.status === 'prenha' &&
    !!(vaca.data_inseminacao_prenhez ?? vaca.data_ultima_inseminacao)
  );
}

export function passouPrazoInseminar(vaca: Vaca, datas: DatasCiclo): boolean {
  if (!datas.dataInseminar) return true;
  return daysFromToday(datas.dataInseminar) <= 0;
}

export function aguardandoVerificarPrenhez(vaca: Vaca): boolean {
  if (ehPrenha(vaca) || !vaca.data_ultima_inseminacao) return false;
  const cio = ultimoCio(vaca);
  if (cio && cio > vaca.data_ultima_inseminacao) return false;
  return true;
}

export function podeInseminarAposCio(vaca: Vaca): boolean {
  if (ehPrenha(vaca) || aguardandoVerificarPrenhez(vaca)) return false;
  if (emProtocoloAtivo(vaca)) return false;

  if (protocoloEncerradoPendenteInseminacao(vaca)) return true;

  const cio = ultimoCio(vaca);
  if (!cio) return false;

  const datas = calcularDatasCiclo(vaca);
  if (datas.dataInseminar && !passouPrazoInseminar(vaca, datas)) return false;

  if (vaca.data_ultima_inseminacao && vaca.data_ultima_inseminacao >= cio) {
    return false;
  }

  return true;
}

export function podeRegistrarCio(vaca: Vaca): boolean {
  if (ehPrenha(vaca) || aguardandoVerificarPrenhez(vaca)) return false;
  if (podeInseminarAposCio(vaca)) return false;
  if (emProtocoloAtivo(vaca)) return false;

  const datas = calcularDatasCiclo(vaca);
  if (datas.dataInseminar) {
    return passouPrazoInseminar(vaca, datas);
  }

  return ['vazia', 'seca', 'pre_parto', 'lactacao'].includes(vaca.status);
}

export function precisaProtocoloIatf(vaca: Vaca): boolean {
  if (
    ehPrenha(vaca) ||
    emProtocoloAtivo(vaca) ||
    protocoloEncerradoPendenteInseminacao(vaca) ||
    aguardandoVerificarPrenhez(vaca)
  ) {
    return false;
  }
  const datas = calcularDatasCiclo(vaca);
  if (!datas.dataInseminar || !passouPrazoInseminar(vaca, datas)) return false;
  return !ultimoCio(vaca);
}

export function montarLinhasDatas(vaca: Vaca): LinhaData[] {
  const datas = calcularDatasCiclo(vaca);
  const linhas: LinhaData[] = [];
  const prenha = ehPrenha(vaca);
  const inseminada = !!vaca.data_ultima_inseminacao;
  const passouInseminar = passouPrazoInseminar(vaca, datas);
  const cio = ultimoCio(vaca);

  if (datas.ultimoParto) {
    linhas.push({ id: 'ultimo_parto', label: 'Último parto', data: datas.ultimoParto });
  }

  if (vaca.data_aborto) {
    linhas.push({ id: 'aborto', label: 'Aborto', data: vaca.data_aborto });
  }

  if (emProtocoloAtivo(vaca)) {
    const fim = dataFimProtocoloIatf(vaca)!;
    linhas.push({
      id: 'protocolo_iatf',
      label: `Protocolo IATF (${vaca.dias_protocolo_iatf ?? DIAS_PROTOCOLO_IATF_PADRAO}d)`,
      data: fim,
      destaque: 'warn',
    });
  }

  if (!prenha && datas.dataInseminar && !emProtocoloAtivo(vaca) && !aguardandoVerificarPrenhez(vaca)) {
    const podeInsem = podeInseminarAposCio(vaca);
    const podeProtocolo = precisaProtocoloIatf(vaca);
    linhas.push({
      id: 'inseminar',
      label: protocoloEncerradoPendenteInseminacao(vaca)
        ? 'Inseminar (após protocolo)'
        : labelInseminar40d(vaca),
      data: podeInsem && cio ? cio : datas.dataInseminar,
      destaque: podeInsem || podeProtocolo ? 'action' : undefined,
      mostrarBotaoInseminar: podeInsem,
      mostrarBotaoProtocolo: podeProtocolo,
    });
  }

  if (!prenha && datas.dataVerificarPrenhez && inseminada) {
    linhas.push({
      id: 'verificar_prenhez',
      label: 'Verificar prenhez (21d)',
      data: datas.dataVerificarPrenhez,
    });
  }

  if (prenha && estaEmLactacao(vaca) && datas.inicioSeca) {
    linhas.push({
      id: 'secagem',
      label: LABEL_SECAGEM,
      data: datas.inicioSeca,
      destaque: 'warn',
    });
  } else if (!prenha && dataSecagem(datas)) {
    linhas.push({ id: 'secagem', label: LABEL_SECAGEM, data: dataSecagem(datas)! });
  }

  if (datas.preParto) {
    linhas.push({ id: 'pre_parto', label: 'Pré-parto', data: datas.preParto });
  }

  if (prenha && datas.partoPrevisto) {
    linhas.push({
      id: 'parto_previsto',
      label: LABEL_PREVISAO_PARTO,
      data: datas.partoPrevisto,
      destaque: 'highlight',
    });
  } else if (inseminada && !prenha && datas.partoPrevistoAprox) {
    linhas.push({
      id: 'parto_previsto_aprox',
      label: `${LABEL_PREVISAO_PARTO} (aprox.)`,
      data: datas.partoPrevistoAprox,
      destaque: 'highlight',
    });
  } else if (!inseminada && passouInseminar && datas.fimSeca) {
    linhas.push({ id: 'previsao_parto', label: LABEL_PREVISAO_PARTO, data: datas.fimSeca });
  }

  linhas.sort((a, b) => a.data.localeCompare(b.data));
  return linhas;
}

export function montarResumoVaca(vaca: Vaca): VacaResumoVisual {
  const datas = calcularDatasCiclo(vaca);
  const prenha = ehPrenha(vaca);
  const cio = ultimoCio(vaca);

  let proximaAcao: VacaResumoVisual['proximaAcao'] = null;

  if (emProtocoloAtivo(vaca)) {
    proximaAcao = {
      id: 'protocolo_iatf',
      titulo: 'Inseminar ao fim do protocolo',
      data: dataFimProtocoloIatf(vaca)!,
      variante: 'warn',
    };
  } else if (protocoloEncerradoPendenteInseminacao(vaca)) {
    proximaAcao = {
      id: 'inseminar',
      titulo: 'Inseminar (após protocolo)',
      data: dataFimProtocoloIatf(vaca) ?? todayISO(),
      variante: 'action',
    };
  } else if (podeInseminarAposCio(vaca)) {
    proximaAcao = {
      id: 'inseminar',
      titulo: 'Inseminar agora',
      data: cio ?? todayISO(),
      variante: 'action',
    };
  } else if (aguardandoVerificarPrenhez(vaca) && datas.dataVerificarPrenhez) {
    const dias = daysFromToday(datas.dataVerificarPrenhez);
    proximaAcao = {
      id: 'verificar_prenhez',
      titulo: dias <= 0 ? 'Verificar prenhez' : 'Verificar prenhez em',
      data: datas.dataVerificarPrenhez,
      variante: dias <= 0 ? 'action' : 'neutral',
    };
  } else if (precisaProtocoloIatf(vaca) && datas.dataInseminar) {
    proximaAcao = {
      id: 'protocolo_iatf',
      titulo: 'Colocar em protocolo IATF',
      data: datas.dataInseminar,
      variante: 'warn',
    };
  } else if (podeRegistrarCio(vaca) && datas.dataInseminar) {
    proximaAcao = {
      id: 'cio',
      titulo: 'Aguardando cio',
      data: datas.dataInseminar,
      variante: 'neutral',
    };
  } else if (prenha && datas.partoPrevisto) {
    proximaAcao = {
      id: 'parto_previsto',
      titulo: LABEL_PREVISAO_PARTO,
      data: datas.partoPrevisto,
      variante: 'highlight',
    };
  } else if (datas.dataInseminar && !passouPrazoInseminar(vaca, datas)) {
    proximaAcao = {
      id: 'inseminar',
      titulo: usaReferenciaAbortoParaInseminar(vaca)
        ? 'Inseminar após aborto'
        : 'Inseminar após parto',
      data: datas.dataInseminar,
      variante: 'neutral',
    };
  }

  const candidatos: VacaResumoVisual['marcos'] = [];

  if (datas.ultimoParto && proximaAcao?.id !== 'ultimo_parto') {
    candidatos.push({ id: 'ultimo_parto', label: 'Último parto', data: datas.ultimoParto });
  }

  if (prenha && estaEmLactacao(vaca) && datas.inicioSeca && proximaAcao?.id !== 'secagem') {
    candidatos.push({ id: 'secagem', label: LABEL_SECAGEM, data: datas.inicioSeca });
  }

  if (prenha && datas.partoPrevisto && proximaAcao?.id !== 'parto_previsto') {
    candidatos.push({ id: 'parto_previsto', label: LABEL_PREVISAO_PARTO, data: datas.partoPrevisto });
  } else if (
    vaca.data_ultima_inseminacao &&
    !prenha &&
    datas.partoPrevistoAprox &&
    proximaAcao?.id !== 'parto_previsto_aprox'
  ) {
    candidatos.push({
      id: 'parto_previsto_aprox',
      label: `${LABEL_PREVISAO_PARTO} (aprox.)`,
      data: datas.partoPrevistoAprox,
    });
  }

  const secagem = dataSecagem(datas);
  if (!prenha && secagem && proximaAcao?.id !== 'secagem') {
    candidatos.push({ id: 'secagem', label: LABEL_SECAGEM, data: secagem });
  }

  if (!prenha && datas.preParto && proximaAcao?.id !== 'pre_parto') {
    candidatos.push({ id: 'pre_parto', label: 'Pré-parto', data: datas.preParto });
  }

  if (
    !prenha &&
    datas.dataVerificarPrenhez &&
    vaca.data_ultima_inseminacao &&
    proximaAcao?.id !== 'verificar_prenhez'
  ) {
    candidatos.push({
      id: 'verificar_prenhez',
      label: 'Verificar prenhez',
      data: datas.dataVerificarPrenhez,
    });
  }

  if (
    !prenha &&
    datas.fimSeca &&
    !vaca.data_ultima_inseminacao &&
    proximaAcao?.id !== 'previsao_parto'
  ) {
    candidatos.push({ id: 'previsao_parto', label: LABEL_PREVISAO_PARTO, data: datas.fimSeca });
  }

  const marcos = candidatos
    .filter((m) => !proximaAcao || m.data !== proximaAcao.data || m.id !== proximaAcao.id)
    .sort((a, b) => a.data.localeCompare(b.data));

  return { proximaAcao, marcos };
}

export function textoDiasRelativo(data: string): string {
  const dias = daysFromToday(data);
  if (dias === 0) return 'hoje';
  if (dias === 1) return 'amanhã';
  if (dias > 0) return `em ${dias}d`;
  if (dias === -1) return 'ontem';
  return `há ${Math.abs(dias)}d`;
}

export function estaEmLactacao(vaca: Vaca): boolean {
  if (!vaca.data_parto) return false;
  const datas = calcularDatasCiclo(vaca);
  if (!datas.fimLactacao) return false;
  return todayISO() < datas.fimLactacao;
}

export function statusesExibicao(vaca: Vaca): StatusVaca[] {
  const badges: StatusVaca[] = [];

  if (emProtocoloAtivo(vaca)) {
    badges.push('em_protocolo_iatf');
  }

  if (estaEmLactacao(vaca)) {
    badges.push('lactacao');
  }

  if (vaca.status === 'prenha') {
    badges.push('prenha');
  } else if (badges.length === 0) {
    badges.push(vaca.status === 'em_protocolo_iatf' ? 'lactacao' : vaca.status);
  } else if (vaca.status !== 'lactacao' && vaca.status !== 'em_protocolo_iatf') {
    if (!badges.includes(vaca.status)) {
      badges.push(vaca.status);
    }
  }

  return badges.length ? badges : [vaca.status];
}

export function statusAposProtocoloVencido(vaca: Vaca): StatusVaca {
  return estaEmLactacao(vaca) ? 'lactacao' : 'vazia';
}

export function calcularStatusAutomatico(vaca: Vaca): StatusVaca {
  const hoje = todayISO();
  const datas = calcularDatasCiclo(vaca);

  if (vaca.status === 'prenha') return 'prenha';

  if (vaca.status === 'em_protocolo_iatf' && protocoloVencido(vaca)) {
    return statusAposProtocoloVencido(vaca);
  }

  if (vaca.status === 'em_protocolo_iatf' && emProtocoloAtivo(vaca)) {
    return 'em_protocolo_iatf';
  }

  if (vaca.data_parto) {
    if (hoje < datas.fimLactacao!) return 'lactacao';
    if (datas.fimSeca && hoje >= datas.preParto! && hoje < datas.fimSeca) return 'pre_parto';
    if (datas.inicioSeca && hoje >= datas.inicioSeca && datas.fimSeca && hoje < datas.fimSeca) {
      return 'seca';
    }
    if (datas.fimSeca && hoje >= datas.fimSeca) return 'vazia';
  }

  return vaca.status;
}

export function dataInseminacaoAposParto(dataParto: string): string {
  return addDays(dataParto, DIAS_APOS_PARTO_INSEMINAR);
}

export function dataVerificacaoPrenhez(dataInseminacao: string): string {
  return addDays(dataInseminacao, DIAS_VERIFICAR_PRENHEZ);
}

export function dataPartoPrevisto(dataInseminacao: string): string {
  return addDays(dataInseminacao, DIAS_GESTACAO);
}

export {
  DIAS_APOS_PARTO_INSEMINAR,
  DIAS_VERIFICAR_PRENHEZ,
  DIAS_GESTACAO,
  DIAS_SECAR_ANTES_PARTO,
  MESES_LACTACAO,
  DIAS_PERIODO_SECA,
  DIAS_PROTOCOLO_IATF_PADRAO,
};
