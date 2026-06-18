import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Cio, CioFormData } from '../models/cio.model';

@Injectable({ providedIn: 'root' })
export class CioService {
  constructor(private supabase: SupabaseService) {}

  async listar(): Promise<Cio[]> {
    const { data, error } = await this.supabase.db
      .from('cios')
      .select('*')
      .order('data_cio', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Cio[];
  }

  async listarPorVaca(vacaId: string): Promise<Cio[]> {
    const { data, error } = await this.supabase.db
      .from('cios')
      .select('*')
      .eq('vaca_id', vacaId)
      .order('data_cio', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Cio[];
  }

  async registrar(form: CioFormData): Promise<Cio> {
    const { data, error } = await this.supabase.db
      .from('cios')
      .insert({
        vaca_id: form.vaca_id,
        data_cio: form.data_cio,
        observacoes: form.observacoes ?? null,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Cio;
  }

  async mapaUltimoCioPorVaca(): Promise<Map<string, string>> {
    const cios = await this.listar();
    const mapa = new Map<string, string>();
    for (const cio of cios) {
      if (!mapa.has(cio.vaca_id)) {
        mapa.set(cio.vaca_id, cio.data_cio);
      }
    }
    return mapa;
  }
}
