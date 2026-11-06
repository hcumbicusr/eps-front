import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, merge } from 'rxjs';
import { DashboardApi, DashboardDetail, DashboardSummary } from '../../core/dashboard.api';
import { asNumber, safePercent, downloadCsv } from '../../core/display';

@Component({
  selector: 'sidi-strategic',
  standalone: true,
  template: `
    <section class="page-content">
      <div class="page-heading"><div class="heading-icon">▥</div><div><h1>Dashboard Estratégico</h1><p>Supervisión y análisis de mediciones, alertas y tendencias del sistema SIDI</p><span class="mini-pill">● Información de carácter demostrativo</span></div><div class="heading-right"><span class="date-chip">{{sourceLabel()}}</span><button class="primary-button" (click)="exportSummary()" [disabled]="!summary()">↓ Exportar resumen</button></div></div>
      <div class="section-header"><b>⊕ INDICADORES CLAVE DE GESTIÓN</b><span>Fuente: {{ sourceText() }}</span></div>
      @if (error()) {<div class="error-banner" role="status"><strong>API de dashboards no disponible.</strong> {{error()}} Las tarjetas mostrarán datos cuando el módulo backend esté conectado. <button class="secondary-button" (click)="refresh()">Reintentar</button></div>}
      <div class="kpi-grid three">
        <article class="metric-card"><div class="metric-top"><span class="square-icon">▣</span><small>MEDICIONES REGISTRADAS</small></div><div class="metric-number">{{n(summary()?.mediciones_total)}}</div><p>Lecturas cargadas en la base de demostración.</p><div class="metric-accent"></div><div class="metric-sub"><span>Clientes sintéticos distintos</span><b>{{n(summary()?.clientes_total)}}</b></div></article>
        <article class="metric-card"><div class="metric-top"><span class="square-icon">⚑</span><small>ALERTAS DE IRREGULARIDAD</small></div><div class="metric-number brand-blue">{{n(summary()?.alertas_total)}}</div><p>Registros de alerta asociados a mediciones demo.</p><div class="metric-accent"></div><div class="metric-sub"><span>Tasa de alertas</span><b>{{pct(summary()?.tasa_alertas_pct)}}</b></div></article>
        <article class="metric-card"><div class="metric-top"><span class="square-icon">◉</span><small>CONSUMO PROMEDIO</small></div><div class="metric-number">{{n(summary()?.consumo_promedio_m3, 1)}} <span class="metric-unit">m³</span></div><p>Promedio calculado desde registros sintéticos.</p><div class="metric-accent"></div><div class="metric-sub"><span>Lecturas estimadas</span><b>{{n(summary()?.lecturas_estimadas)}}</b></div></article>
      </div>
      @if (summary()?.origen === 'postgresql:sidi_live') {
        <section class="panel soft-panel"><div class="panel-head"><strong>ESTADO DE PROCESAMIENTO EN RABBITMQ / IA</strong><small>Actualización automática cada 5 s</small></div>
          <div class="mini-stat-grid">
            <div class="mini-stat"><small>EVALUADAS POR IA</small><b>{{n(summary()?.evaluadas_total)}}</b><span>Predicción calculada</span></div>
            <div class="mini-stat"><small>SIN PERFIL</small><b>{{n(summary()?.sin_perfil_total)}}</b><span>No pudo evaluarse</span></div>
            <div class="mini-stat"><small>ERRORES</small><b>{{n(summary()?.errores_total)}}</b><span>Revisar consumidor</span></div>
            <div class="mini-stat"><small>PENDIENTES</small><b>{{n(summary()?.pendientes_total)}}</b><span>Recepción no finalizada</span></div>
          </div>
        </section>
      }
      <section class="panel soft-panel"><div class="panel-head"><strong>▦ SOPORTE A LA GESTIÓN DE DATOS</strong><span>Indicadores no financieros</span></div><div class="mini-stat-grid"><div class="mini-stat"><small>Fuente de datos</small><b>{{ summary()?.origen || 'Sin conexión' }}</b><span>Identificación de procedencia</span></div><div class="mini-stat"><small>Tipo de registros</small><b>{{summary()?.es_demo ? 'Sintéticos' : 'Sin verificar'}}</b><span>Datos de proyecto educativo</span></div><div class="mini-stat"><small>Alertas contabilizadas</small><b>{{n(summary()?.alertas_total)}}</b><span>Clasificadas en la BD</span></div><div class="mini-stat"><small>Estado API</small><b>{{ loading() ? 'Consultando' : summary() ? 'Conectada' : 'Pendiente' }}</b><span>HTTP /api/dashboard</span></div></div></section>
      <section class="panel large-panel"><div class="panel-head"><div><small class="panel-overline">SERIE TEMPORAL DE DATOS</small><h2>Evolución mensual de mediciones y alertas</h2></div><button class="secondary-button" (click)="refresh()">↻ Actualizar</button></div>
        @if (detail()?.serie_mensual?.length) {
          <div class="chart-legend"><span><i class="legend-line blue"></i>Mediciones</span><span><i class="legend-line amber"></i>Alertas</span></div>
          <div class="bar-chart" role="img" aria-label="Gráfico de barras mensual con mediciones y alertas">
            @for (p of detail()!.serie_mensual; track p.mes) {
              <div class="bar-column"><div class="bar-stacks"><div class="bar main-bar" [style.height.%]="barPct(p.mediciones)" [title]="p.mediciones + ' mediciones'"></div><div class="bar alert-bar" [style.height.%]="barPct(p.alertas)" [title]="p.alertas + ' alertas'"></div></div><span>{{p.mes}}</span></div>
            }
          </div>
        } @else {<div class="chart-placeholder"><span>▤</span><strong>Serie temporal pendiente</strong><p>Este gráfico utilizará registros agregados de PostgreSQL cuando esté disponible la API.</p></div>}
      </section>
      <div class="two-panel-grid"><section class="panel"><div class="panel-head"><div><small class="panel-overline">DISTRIBUCIÓN</small><h2>Tipología de alertas</h2></div></div>
        @if (detail()?.tipologias?.length) {<div class="breakdown-list">@for (item of detail()!.tipologias; track item.etiqueta) {<div class="breakdown-row"><span>{{item.etiqueta}}</span><b>{{n(item.cantidad)}}</b><div class="progress-track"><div class="progress-fill" [style.width.%]="breakdownPct(item.cantidad)"></div></div></div>}</div>} @else {<div class="empty-panel">Sin tipologías disponibles desde la API.</div>}
      </section><section class="panel"><div class="panel-head"><div><small class="panel-overline">TERRITORIO SIMULADO</small><h2>Concentración por sector</h2></div></div>
        @if (detail()?.sectores?.length) {<div class="sector-list">@for (s of detail()!.sectores; track s.sector) {<div class="sector-row"><div class="sector-tag">▣</div><div class="sector-meta"><b>{{s.sector}}</b><small>{{n(s.mediciones)}} mediciones</small></div><strong>{{pct(s.riesgo_pct)}}</strong></div>}</div>} @else {<div class="empty-panel">Sin sectores disponibles desde la API.</div>}
      </section></div>
      <p class="data-note">Nota: no se muestran recuperación económica, agua no facturada ni reducción real de reclamos; dichos indicadores requieren fuentes verificadas que no forman parte del dataset sintético.</p>
    </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class StrategicPage implements OnInit {
  private readonly api = inject(DashboardApi);
  private readonly destroyRef = inject(DestroyRef);
  summary = signal<DashboardSummary | null>(null);
  detail = signal<DashboardDetail | null>(null);
  loading = signal(false);
  error = signal('');
  n = asNumber;
  pct = safePercent;
  ngOnInit(): void { this.refresh(); merge(interval(5000), this.api.sourceChanged$).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh()); }
  sourceLabel(): string { return this.api.source() === 'flujo' ? 'Flujo de IA · consulta automática' : 'Dataset precargado · demo'; }
  refresh(): void {
    this.loading.set(true); this.error.set('');
    this.api.summary().subscribe({next: x => {this.summary.set(x);this.loading.set(false);},error:()=>{this.loading.set(false);this.error.set('El endpoint GET /api/dashboard/resumen todavía no responde.');}});
    this.api.detail().subscribe({next: x=>this.detail.set(x),error:()=>this.error.set('El endpoint GET /api/dashboard/detalle todavía no responde.')});
  }
  sourceText(): string { return this.summary()?.origen || 'Pendiente de API PostgreSQL'; }
  barPct(x: number): number { const max = Math.max(1, ...(this.detail()?.serie_mensual || []).map(p=>p.mediciones)); return Math.max(2, 100*x/max); }
  breakdownPct(x: number): number {const max = Math.max(1, ...(this.detail()?.tipologias || []).map(p=>p.cantidad));return 100*x/max;}
  exportSummary(): void { const s=this.summary(); if(s) downloadCsv('sidi_resumen.csv',[{...s}]); }
}
