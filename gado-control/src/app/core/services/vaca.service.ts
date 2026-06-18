import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
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
    const { data, error } = await this.supabase.db
      .from('vacas')
      .insert({
        numero: form.numero,
        nome: form.nome,
        raca: form.raca,
        status: form.status,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Vaca;
  }

  async atualizar(id: string, form: Partial<VacaFormData>): Promise<Vaca> {
    const { data, error } = await this.supabase.db
      .from('vacas')
      .update(form)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Vaca;
  }

  async excluir(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('vacas').delete().eq('id', id);
    if (error) throw error;
  }

  async registrarParto(vacaId: string): Promise<Vaca> {
    const { data, error } = await this.supabase.db
      .from('vacas')
      .update({
        data_parto: todayISO(),
        status: 'lactacao' as StatusVaca,
        data_inseminacao_prenhez: null,
        data_ultima_inseminacao: null,
        data_inicio_protocolo_iatf: null,
        dias_protocolo_iatf: null,
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
