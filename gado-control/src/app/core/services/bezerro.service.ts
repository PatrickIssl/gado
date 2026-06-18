import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { Bezerro, BezerroFormData } from '../models/bezerro.model';

@Injectable({ providedIn: 'root' })
export class BezerroService {
  constructor(private supabase: SupabaseService) {}

  async listar(): Promise<Bezerro[]> {
    const { data, error } = await this.supabase.db
      .from('bezerros')
      .select('*')
      .order('data_nascimento', { ascending: false });

    if (error) throw error;
    return (data ?? []) as Bezerro[];
  }

  async criar(form: BezerroFormData & { vaca_id: string }): Promise<Bezerro> {
    const { data, error } = await this.supabase.db
      .from('bezerros')
      .insert({
        vaca_id: form.vaca_id,
        nome: form.nome,
        sexo: form.sexo,
        data_nascimento: form.data_nascimento,
        desmamado: false,
        brucelose_aplicada: false,
      })
      .select()
      .single();

    if (error) throw error;
    return data as Bezerro;
  }

  async marcarDesmamado(id: string): Promise<Bezerro> {
    const { data, error } = await this.supabase.db
      .from('bezerros')
      .update({ desmamado: true })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Bezerro;
  }

  async registrarBrucelose(id: string, dataBrucelose: string): Promise<Bezerro> {
    const { data, error } = await this.supabase.db
      .from('bezerros')
      .update({
        brucelose_aplicada: true,
        data_brucelose: dataBrucelose,
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Bezerro;
  }

  async excluir(id: string): Promise<void> {
    const { error } = await this.supabase.db.from('bezerros').delete().eq('id', id);
    if (error) throw error;
  }
}
