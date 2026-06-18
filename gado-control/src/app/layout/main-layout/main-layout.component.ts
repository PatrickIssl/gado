import { Component } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AsyncPipe } from '@angular/common';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, AsyncPipe],
  templateUrl: './main-layout.component.html',
  styleUrl: './main-layout.component.scss',
})
export class MainLayoutComponent {
  readonly navItems = [
    { path: '/painel', label: 'Painel', icon: 'grid' as const },
    { path: '/vacas', label: 'Vacas', icon: 'cow' as const },
    { path: '/inseminacoes', label: 'Inseminações', icon: 'syringe' as const },
    { path: '/bezerros', label: 'Bezerros', icon: 'calf' as const },
  ];

  constructor(
    readonly auth: AuthService,
    private router: Router
  ) {}

  async sair(): Promise<void> {
    await this.auth.logout();
    await this.router.navigate(['/login']);
  }
}
