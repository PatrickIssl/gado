import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { CioService } from './cio.service';
import { StatusVaca, Vaca, VacaFormData } from '../models/vaca.model';
import {
  calcularStatusAutomatico,
  emProtocoloAtivo,
  estaEmLactacao,
  protocoloVencido,
  statusAposProtocoloVencido,
} from '../utils/ciclo-vaca.utils';
import { todayISO } from '../utils/date.utils';

@Injectable({ providedIn: 'root' })
export class VacaService {
  constructor(
    private supabase: SupabaseService,
    private auth: AuthService,
    private cioService: CioService
  ) {}

  async listar(): Promise<Vaca[]> {
    const [vacasResult, mapaCios] = await Promise.all([
      this.supabase.db.from('vacas').select('*').order('numero', { ascending: true }),
      this.cioService.mapaUltimoCioPorVaca(),
    ]);

    if (vacasResult.error) throw vacasResult.error;

    const vacas = (vacasResult.data ?? []) as Vaca[];
    const enriquecidas = vacas.map((v) => ({
      ...v,
      ultimo_cio: mapaCios.get(v.id) ?? null,
    }));

    return Promise.all(enriquecidas.map((v) => this.sincronizarProtocoloVencido(v)));
  }

  async buscarPorId(id: string): Promise<Vaca | null> {
    const { data, error } = await this.supabase.db
      .from('vacas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const cios = await this.cioService.listarPorVaca(id);
    const vaca = {
      ...(data as Vaca),
      ultimo_cio: cios[0]?.data_cio ?? null,
    };
    return this.sincronizarProtocoloVencido(vaca);
  }

  async criar(form: VacaFormData): Promise<Vaca> {
    const payload = this.montarPayload(form);
    const { data, error } = await this.supabase.db
      .from('vacas')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data as Vaca;
  }

  async atualizar(id: string, form: Partial<VacaFormData>): Promise<Vaca> {
    const payload = this.montarPayload(form as VacaFormData);
    const { data, error } = await this.supabase.db
      .from('vacas')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Vaca;
  }

  private montarPayload(form: VacaFormData): Record<string, unknown> {
    const doente = form.doente ?? false;
    const payload: Record<string, unknown> = {
      fazenda_id: this.auth.requireFazendaId(),
      numero: form.numero,
      nome: form.nome,
      raca: form.raca ?? '',
      status: form.status,
      data_parto: form.data_parto || null,
      data_aborto: form.data_aborto || null,
      data_inseminacao_prenhez: null,
      data_ultima_inseminacao: form.data_ultima_inseminacao || null,
      data_inicio_protocolo_iatf: null,
      dias_protocolo_iatf: null,
      total_prenhezes: Math.max(0, form.total_prenhezes ?? 0),
      doente,
      doenca: doente && form.doenca?.trim() ? form.doenca.trim() : null,
    };

    if (form.status === 'prenha' && form.data_inseminacao_prenhez) {
      payload['data_inseminacao_prenhez'] = form.data_inseminacao_prenhez;
      payload['data_ultima_inseminacao'] = form.data_inseminacao_prenhez;
      payload['data_aborto'] = null;
    }

    if (form.status === 'em_protocolo_iatf') {
      payload['data_inicio_protocolo_iatf'] =
        form.data_inicio_protocolo_iatf || todayISO();
      payload['dias_protocolo_iatf'] = form.dias_protocolo_iatf ?? 11;
    }

    if (form.data_parto && form.status === 'vazia') {
      payload['status'] = 'lactacao';
    }

    return payload;
  }

  async excluir(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('vacas').delete().eq('id', id);
    if (error) throw error;
  }

  async registrarParto(vacaId: string): Promise<Vaca> {
    const atual = await this.buscarPorId(vacaId);
    const totalPrenhezes = (atual?.total_prenhezes ?? 0) + 1;

    const { data, error } = await this.supabase.db
      .from('vacas')
      .update({
        data_parto: todayISO(),
        status: 'lactacao' as StatusVaca,
        data_aborto: null,
        data_inseminacao_prenhez: null,
        data_ultima_inseminacao: null,
        data_inicio_protocolo_iatf: null,
        dias_protocolo_iatf: null,
        total_prenhezes: totalPrenhezes,
      })
      .eq('id', vacaId)
      .select()
      .single();

    if (error) throw error;
    return data as Vaca;
  }

  async entrarProtocoloIatf(vacaId: string, diasProtocolo: 10 | 11): Promise<Vaca> {
    const vacaAtual = await this.buscarPorId(vacaId);
    const manterLactacao = vacaAtual ? estaEmLactacao(vacaAtual) : false;

    const { data, error } = await this.supabase.db
      .from('vacas')
      .update({
        status: 'em_protocolo_iatf' as StatusVaca,
        data_inicio_protocolo_iatf: todayISO(),
        dias_protocolo_iatf: diasProtocolo,
      })
      .eq('id', vacaId)
      .select()
      .single();

    if (error) throw error;

    if (!manterLactacao && vacaAtual?.status === 'vazia') {
      return data as Vaca;
    }

    return {
      ...(data as Vaca),
      ultimo_cio: vacaAtual?.ultimo_cio ?? null,
    };
  }

  async limparProtocoloAposInseminacao(vacaId: string): Promise<void> {
    await this.supabase.db
      .from('vacas')
      .update({
        data_inicio_protocolo_iatf: null,
        dias_protocolo_iatf: null,
      })
      .eq('id', vacaId);
  }

  private async sincronizarProtocoloVencido(vaca: Vaca): Promise<Vaca> {
    let atual = this.aplicarStatusAutomatico(vaca);

    if (atual.status === 'em_protocolo_iatf' && protocoloVencido(atual)) {
      const novoStatus = statusAposProtocoloVencido(atual);
      const { data, error } = await this.supabase.db
        .from('vacas')
        .update({ status: novoStatus })
        .eq('id', atual.id)
        .select()
        .single();

      if (!error && data) {
        atual = {
          ...(data as Vaca),
          ultimo_cio: vaca.ultimo_cio,
        };
      }
    }

    return atual;
  }

  private aplicarStatusAutomatico(vaca: Vaca): Vaca {
    if (vaca.status === 'prenha') return vaca;
    if (emProtocoloAtivo(vaca)) return vaca;

    const statusCalculado = calcularStatusAutomatico(vaca);
    return { ...vaca, status: statusCalculado };
  }
}
