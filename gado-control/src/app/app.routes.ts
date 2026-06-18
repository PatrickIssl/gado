import { Routes } from '@angular/router';
import { MainLayoutComponent } from './layout/main-layout/main-layout.component';

export const routes: Routes = [
  {
    path: '',
    component: MainLayoutComponent,
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
          import('./pages/inseminacoes/inseminacoes.component').then((m) => m.InseminacoesComponent),
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
