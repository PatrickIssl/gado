import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-completar-cadastro',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './completar-cadastro.component.html',
  styleUrl: '../login/auth-pages.scss',
})
export class CompletarCadastroComponent {
  nome = '';
  nomeFazenda = '';
  loading = false;
  erro = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async concluir(): Promise<void> {
    if (!this.nome.trim() || !this.nomeFazenda.trim()) {
      this.erro = 'Informe seu nome e o nome da fazenda.';
      return;
    }
    this.loading = true;
    this.erro = '';
    try {
      await this.auth.registrarFazenda(this.nome.trim(), this.nomeFazenda.trim());
      await this.router.navigate(['/painel']);
    } catch (e: unknown) {
      this.erro = e instanceof Error ? e.message : 'Erro ao vincular fazenda.';
    } finally {
      this.loading = false;
    }
  }

  async sair(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
