import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { AuthService } from './auth.service';
import { Inseminacao, InseminacaoFormData } from '../models/inseminacao.model';
import { StatusVaca, Vaca } from '../models/vaca.model';
import { estaEmLactacao } from '../utils/ciclo-vaca.utils';

@Injectable({ providedIn: 'root' })
export class InseminacaoService {
  constructor(
    private supabase: SupabaseService,
    private auth: AuthService
  ) {}

  async listar(): Promise<Inseminacao[]> {
    const { data, error } = await this.supabase.db
      .from('inseminacoes')
      .select('*')
      .order('data_inseminacao', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Inseminacao[];
  }

  async listarPorVaca(vacaId: string): Promise<Inseminacao[]> {
    const { data, error } = await this.supabase.db
      .from('inseminacoes')
      .select('*')
      .eq('vaca_id', vacaId)
      .order('data_inseminacao', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Inseminacao[];
  }

  async registrar(form: InseminacaoFormData, vaca?: Vaca): Promise<Inseminacao> {
    const { data: insem, error } = await this.supabase.db
      .from('inseminacoes')
      .insert({
        fazenda_id: this.auth.requireFazendaId(),
        vaca_id: form.vaca_id,
        data_inseminacao: form.data_inseminacao,
        observacoes: form.observacoes ?? null,
        touro: form.touro?.trim() || null,
        tipo_semen: form.tipo_semen ?? null,
        repetiu_cio: false,
        confirmada_prenhez: false,
      })
      .select()
      .single();

    if (error) throw error;

    const novoStatus: StatusVaca =
      vaca && (estaEmLactacao(vaca) || vaca.status === 'lactacao')
        ? 'lactacao'
        : 'vazia';

    await this.supabase.db
      .from('vacas')
      .update({
        data_ultima_inseminacao: form.data_inseminacao,
        status: novoStatus,
        data_inicio_protocolo_iatf: null,
        dias_protocolo_iatf: null,
      })
      .eq('id', form.vaca_id);

    return insem as Inseminacao;
  }

  /** Cadastro inicial com prenhez já confirmada (ex.: lactando e prenha no wizard). */
  async registrarPrenhezConfirmada(
    form: InseminacaoFormData & { touro: string; tipo_semen: NonNullable<InseminacaoFormData['tipo_semen']> }
  ): Promise<Inseminacao> {
    const { data: insem, error } = await this.supabase.db
      .from('inseminacoes')
      .insert({
        fazenda_id: this.auth.requireFazendaId(),
        vaca_id: form.vaca_id,
        data_inseminacao: form.data_inseminacao,
        observacoes: form.observacoes ?? 'Prenhez confirmada no cadastro',
        touro: form.touro.trim(),
        tipo_semen: form.tipo_semen,
        repetiu_cio: false,
        confirmada_prenhez: true,
      })
      .select()
      .single();

    if (error) throw error;
    return insem as Inseminacao;
  }

  async marcarRepetiuCio(id: string, vacaId: string): Promise<Inseminacao> {
    const { data, error } = await this.supabase.db
      .from('inseminacoes')
      .update({ repetiu_cio: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const vaca = await this.supabase.db.from('vacas').select('*').eq('id', vacaId).single();
    const manterLactacao = vaca.data && estaEmLactacao(vaca.data as Vaca);

    await this.supabase.db
      .from('vacas')
      .update({
        data_ultima_inseminacao: null,
        data_inicio_protocolo_iatf: null,
        dias_protocolo_iatf: null,
        status: (manterLactacao ? 'lactacao' : 'vazia') as StatusVaca,
      })
      .eq('id', vacaId);

    return data as Inseminacao;
  }

  async confirmarPrenhez(id: string, vacaId: string): Promise<Inseminacao> {
    const { data: insem, error } = await this.supabase.db
      .from('inseminacoes')
      .update({ confirmada_prenhez: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    const inseminacao = insem as Inseminacao;

    await this.supabase.db
      .from('vacas')
      .update({
        status: 'prenha' as StatusVaca,
        data_inseminacao_prenhez: inseminacao.data_inseminacao,
        data_ultima_inseminacao: inseminacao.data_inseminacao,
        data_inicio_protocolo_iatf: null,
        dias_protocolo_iatf: null,
      })
      .eq('id', vacaId);

    return inseminacao;
  }
}
