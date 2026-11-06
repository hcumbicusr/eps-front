import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DashboardApi } from '../core/dashboard.api';
import { RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

@Component({
  selector: 'sidi-shell',
  standalone: true,
  imports: [RouterLink, RouterLinkActive, RouterOutlet, FormsModule],
  template: `
    <div class="app-shell">
      <aside class="sidebar">
        <a class="brand" routerLink="/estrategico" aria-label="SIDI · Inicio">
          <span class="brand-symbol">◈</span>
          <span><strong>SIDI <small>EPS</small></strong><em>Sistema Inteligente de<br>Detección de Irregularidades</em></span>
        </a>
        <div class="entity-selector"><span class="entity-label">ENTIDAD PRESTADORA</span><strong>EPS · Entorno demostrativo</strong></div>
        <p class="nav-caption">MÓDULOS EJECUTIVOS</p>
        <nav aria-label="Navegación principal">
          <a class="nav-item" routerLink="/estrategico" routerLinkActive="active"><span class="nav-icon">▥</span><span>Dashboard Estratégico</span></a>
          <a class="nav-sub" routerLink="/estrategico">Indicadores y evolución</a>
          <a class="nav-sub" routerLink="/estrategico">Diagnóstico institucional</a>
          <p class="nav-caption section">OPERACIONES & CONTROL</p>
          <a class="nav-item" routerLink="/operativo" routerLinkActive="active"><span class="nav-icon">⚡</span><span>Dashboard Operativo</span></a>
          <a class="nav-sub" routerLink="/operativo">Alertas y casos prioritarios</a>
          <a class="nav-sub" routerLink="/operativo">Concentración por sector</a>
        </nav>
        <div class="sidebar-bottom"><div class="status-dot"></div><span><b>AMBIENTE DE DEMOSTRACIÓN</b><small>Datos por API · sin validación EPS real</small></span></div>
      </aside>
      <div class="main-column">
        <header class="topbar">
          <div class="breadcrumb">▣ <strong>Plataforma SIDI</strong><span class="crumb-sep">/</span><span>Panel de seguimiento</span></div>
          <div class="top-actions"><label class="sidi-source-select">Origen <select aria-label="Fuente del dashboard" [ngModel]="dashboardApi.source()" (ngModelChange)="dashboardApi.setSource($event)"><option value="flujo">Flujo RabbitMQ / IA</option><option value="demo">Semilla demo</option></select></label><span class="mode-pill">● DEMO</span><span class="avatar" aria-hidden="true">S</span><span class="user-info">Usuario de demostración<br><small>Entorno educativo</small></span><a class="exit-link" routerLink="/login">Salir</a></div>
        </header>
        <main id="main-content"><router-outlet /></main>
        <footer>SIDI © 2026 · Investigación aplicada con datos sintéticos · Prototipo no desplegado en una EPS</footer>
      </div>
    </div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Shell { readonly dashboardApi = inject(DashboardApi); }
