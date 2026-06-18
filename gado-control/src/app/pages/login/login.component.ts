import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './auth-pages.scss',
})
export class LoginComponent {
  email = '';
  senha = '';
  loading = false;
  erro = '';

  constructor(
    private auth: AuthService,
    private router: Router
  ) {}

  async entrar(): Promise<void> {
    if (!this.email.trim() || !this.senha) {
      this.erro = 'Informe e-mail e senha.';
      return;
    }
    this.loading = true;
    this.erro = '';
    try {
      await this.auth.login(this.email.trim(), this.senha);
      if (this.auth.perfil) {
        await this.router.navigate(['/painel']);
      } else {
        await this.router.navigate(['/completar-cadastro']);
      }
    } catch (e: unknown) {
      this.erro = e instanceof Error ? e.message : 'E-mail ou senha inválidos.';
    } finally {
      this.loading = false;
    }
  }
}
