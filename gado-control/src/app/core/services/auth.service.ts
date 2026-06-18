import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { PerfilCompleto } from '../models/auth.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly perfilSubject = new BehaviorSubject<PerfilCompleto | null>(null);
  private initPromise: Promise<void> | null = null;

  readonly perfil$ = this.perfilSubject.asObservable();

  constructor(private supabase: SupabaseService) {
    this.supabase.db.auth.onAuthStateChange((_event, session) => {
      if (session) {
        void this.loadPerfil();
      } else {
        this.perfilSubject.next(null);
      }
    });
  }

  async init(): Promise<void> {
    if (!this.initPromise) {
      this.initPromise = this.doInit();
    }
    return this.initPromise;
  }

  private async doInit(): Promise<void> {
    const { data } = await this.supabase.db.auth.getSession();
    if (data.session) {
      await this.loadPerfil();
    }
  }

  async ensureSession(): Promise<boolean> {
    await this.init();
    const { data } = await this.supabase.db.auth.getSession();
    return !!data.session;
  }

  async ensurePerfil(): Promise<boolean> {
    if (!(await this.ensureSession())) return false;
    if (this.perfilSubject.value) return true;
    await this.loadPerfil();
    return !!this.perfilSubject.value;
  }

  get perfil(): PerfilCompleto | null {
    return this.perfilSubject.value;
  }

  get fazendaId(): string | null {
    return this.perfilSubject.value?.fazenda_id ?? null;
  }

  get fazendaNome(): string {
    return this.perfilSubject.value?.fazenda?.nome ?? '';
  }

  get nomeUsuario(): string {
    return this.perfilSubject.value?.nome ?? '';
  }

  requireFazendaId(): string {
    const id = this.fazendaId;
    if (!id) throw new Error('Fazenda não identificada. Faça login novamente.');
    return id;
  }

  async loadPerfil(): Promise<PerfilCompleto | null> {
    const { data: userData } = await this.supabase.db.auth.getUser();
    if (!userData.user) {
      this.perfilSubject.next(null);
      return null;
    }

    const { data, error } = await this.supabase.db
      .from('perfis')
      .select('*, fazenda:fazendas(*)')
      .eq('user_id', userData.user.id)
      .maybeSingle();

    if (error) throw error;

    if (!data) {
      this.perfilSubject.next(null);
      return null;
    }

    const perfil = data as PerfilCompleto;
    this.perfilSubject.next(perfil);
    return perfil;
  }

  async login(email: string, senha: string): Promise<void> {
    const { error } = await this.supabase.db.auth.signInWithPassword({
      email,
      password: senha,
    });
    if (error) throw error;
    await this.loadPerfil();
  }

  async cadastrar(
    email: string,
    senha: string,
    nome: string,
    nomeFazenda: string
  ): Promise<'ok' | 'confirmar_email'> {
    const { data, error } = await this.supabase.db.auth.signUp({
      email,
      password: senha,
    });
    if (error) throw error;

    if (!data.session) {
      return 'confirmar_email';
    }

    await this.registrarFazenda(nome, nomeFazenda);
    return 'ok';
  }

  async registrarFazenda(nome: string, nomeFazenda: string): Promise<void> {
    const { error } = await this.supabase.db.rpc('registrar_fazenda', {
      p_nome_fazenda: nomeFazenda.trim(),
      p_nome_usuario: nome.trim(),
    });
    if (error) throw error;
    await this.loadPerfil();
  }

  async logout(): Promise<void> {
    const { error } = await this.supabase.db.auth.signOut();
    if (error) throw error;
    this.perfilSubject.next(null);
  }
}
