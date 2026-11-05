import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'login' },
  { path: 'login', loadComponent: () => import('./pages/login/login').then(m => m.LoginPage) },
  {
    path: '',
    loadComponent: () => import('./layout/shell').then(m => m.Shell),
    children: [
      { path: 'estrategico', title: 'SIDI · Dashboard Estratégico', loadComponent: () => import('./pages/strategic/strategic').then(m => m.StrategicPage) },
      { path: 'operativo', title: 'SIDI · Dashboard Operativo', loadComponent: () => import('./pages/operational/operational').then(m => m.OperationalPage) }
    ]
  },
  { path: '**', redirectTo: 'login' }
];
