import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';
import { authGuard, completarCadastroGuard, guestGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'cadastro',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./pages/cadastro/cadastro.component').then((m) => m.CadastroComponent),
  },
  {
    path: 'completar-cadastro',
    canActivate: [completarCadastroGuard],
    loadComponent: () =>
      import('./pages/cadastro/completar-cadastro.component').then(
        (m) => m.CompletarCadastroComponent
      ),
  },
  {
    path: '',
    component: MainLayoutComponent,
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'painel', pathMatch: 'full' },
      {
        path: 'painel',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then((m) => m.DashboardComponent),
      },
      {
        path: 'vacas',
        loadComponent: () =>
          import('./pages/vacas/vacas.component').then((m) => m.VacasComponent),
      },
      {
        path: 'inseminacoes',
        loadComponent: () =>
          import('./pages/inseminacoes/inseminacoes.component').then(
            (m) => m.InseminacoesComponent
          ),
      },
      {
        path: 'bezerros',
        loadComponent: () =>
          import('./pages/bezerros/bezerros.component').then((m) => m.BezerrosComponent),
      },
    ],
  },
  { path: '**', redirectTo: 'painel' },
];
