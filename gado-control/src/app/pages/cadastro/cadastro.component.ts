import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-cadastro',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './cadastro.component.html',
  styleUrl: '../login/auth-pages.scss',
})
export class CadastroComponent {
  nome = '';
  nomeFazenda = '';
  email = '';
  senha = '';
  loading = false;
  erro = '';
  sucesso = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async cadastrar(): Promise<void> {
    if (!this.nome.trim() || !this.nomeFazenda.trim() || !this.email.trim() || !this.senha) {
      this.erro = 'Preencha todos os campos.';
      return;
    }
    if (this.senha.length < 6) {
      this.erro = 'A senha deve ter pelo menos 6 caracteres.';
      return;
    }

    this.loading = true;
    this.erro = '';
    this.sucesso = '';
    try {
      const result = await this.auth.cadastrar(
        this.email.trim(),
        this.senha,
        this.nome.trim(),
        this.nomeFazenda.trim()
      );

      if (result === 'confirmar_email') {
        this.sucesso =
          'Conta criada! Confirme seu e-mail e depois faça login para concluir o cadastro da fazenda.';
        return;
      }

      await this.router.navigate(['/painel']);
    } catch (e: unknown) {
      this.erro = e instanceof Error ? e.message : 'Erro ao criar conta.';
    } finally {
      this.loading = false;
    }
  }
}
