import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
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
}
