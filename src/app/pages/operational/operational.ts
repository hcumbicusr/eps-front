import { ChangeDetectionStrategy, Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, merge } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { AlertItem, AlertPage, DashboardApi, DashboardDetail, DashboardSummary } from '../../core/dashboard.api';
import { asNumber, downloadCsv, safePercent } from '../../core/display';

@Component({
  selector: 'sidi-operational',
  standalone: true,
  imports: [FormsModule],
  template: `
    <section class="page-content">
      <div class="page-heading"><div class="heading-icon pale">⚡</div><div><h1>Dashboard Operativo</h1><p>Detección de irregularidades, alertas y priorización de registros para revisión</p><span class="mini-pill">● Motor de IA · Visualización demostrativa</span></div><div class="heading-right"><span class="date-chip">{{sourceLabel()}}</span><button class="primary-button" [disabled]="!alerts()?.items?.length" (click)="exportAlerts()">↓ Exportar casos</button></div></div>
      <section class="filter-panel panel"><div class="panel-head"><strong>⚑ SEGMENTACIÓN TERRITORIAL Y ESTADO</strong><small>Filtros aplicados en la consulta API</small></div><div class="filter-grid"><label>SECTOR <select [(ngModel)]="sector"><option value="todos">Todos los sectores</option>@for (s of detail()?.sectores || []; track s.sector) {<option [value]="s.sector">{{s.sector}}</option>}</select></label><label>ESTADO DE REVISIÓN <select [(ngModel)]="estado"><option value="todos">Todos los estados</option><option value="PENDIENTE_CAMPO">Pendiente de campo</option><option value="EN_REVISION">En revisión</option><option value="CERRADO">Cerrado</option></select></label><label>FUENTE <div class="readonly-field">{{summary()?.origen || 'Pendiente de API'}}</div></label><button class="primary-button filter-submit" (click)="applyFilters()">Aplicar filtros</button></div><p class="filter-footer"><span class="status-dot"></span> Sectores y clasificaciones son sintéticos. No representan geolocalización ni telemetría SCADA real.</p></section>
      @if (error()) {<div class="error-banner" role="status"><strong>API todavía no disponible.</strong> {{error()}} <button class="secondary-button" (click)="refresh()">Reintentar</button></div>}
      <div class="kpi-grid four">
        <article class="metric-card"><div class="metric-top"><span class="square-icon">▤</span><small>LECTURAS PROCESADAS</small></div><div class="metric-number">{{n(summary()?.mediciones_total)}}</div><p>Mediciones sintéticas registradas</p><div class="metric-accent"></div></article>
        <article class="metric-card alert-metric"><div class="metric-top"><span class="square-icon warn">⚠</span><small>ALERTAS DE IRREGULARIDAD</small></div><div class="metric-number red">{{n(summary()?.alertas_total)}}</div><p>Casos registrados para revisión</p><div class="metric-accent red-line"></div></article>
        <article class="metric-card"><div class="metric-top"><span class="square-icon success">◉</span><small>TASA DE ALERTAS</small></div><div class="metric-number">{{pct(summary()?.tasa_alertas_pct)}}</div><p>Relación agregada de datos demo</p><div class="metric-accent green-line"></div></article>
        <article class="metric-card"><div class="metric-top"><span class="square-icon">⇢</span><small>CONSUMO PROMEDIO</small></div><div class="metric-number">{{n(summary()?.consumo_promedio_m3,1)}} <span class="metric-unit">m³</span></div><p>Valor basado en lecturas en BD</p><div class="metric-accent"></div></article>
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
      <section class="panel geo-panel"><div class="panel-head"><div><small class="panel-overline">CONCENTRACIÓN TERRITORIAL</small><h2>Irregularidades simuladas por sector</h2><p>No es un mapa geográfico; representa una priorización tabular agregada.</p></div><span class="pill-blue">SIDI · Datos demo</span></div>
        <div class="geo-content"><div class="fake-map" aria-label="Ilustración esquemática sin geolocalización real"><div class="map-grid"></div><span class="map-ribbon">ESQUEMA ILUSTRATIVO</span><svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid meet" aria-hidden="true"><path d="M-5 196 C80 120 144 215 229 105 S365 70 410 35" fill="none" stroke="#bac9da" stroke-width="9"/><path d="M0 206 C98 133 166 223 241 114 S367 82 410 44" fill="none" stroke="#e4ecf5" stroke-width="4"/><path d="M58 0 L110 240 M205 0 L185 240 M320 0 L280 240 M0 72 H400 M0 164 H400" fill="none" stroke="#dce5ed" stroke-dasharray="4 4"/></svg><div class="map-marker m1">A1</div><div class="map-marker m2">A2</div><div class="map-marker m3">A3</div><div class="map-marker m4">A4</div></div>
        <div class="geo-ranking"><h3>Ranking de sectores</h3>@if(detail()?.sectores?.length){@for(s of detail()!.sectores; track s.sector){<div class="ranking-row"><span><b>{{s.sector}}</b><small>{{n(s.mediciones)}} lecturas · {{n(s.alertas)}} alertas</small></span><strong>{{pct(s.riesgo_pct)}}</strong></div>}} @else {<div class="empty-panel">Ranking pendiente de PostgreSQL.</div>}</div></div>
      </section>
      <section class="panel large-panel"><div class="panel-head"><div><small class="panel-overline">TELEMETRÍA · SERIE AGREGADA</small><h2>Cronograma de lecturas y alertas</h2></div><span class="pill-blue">Consulta mensual</span></div>
        @if(detail()?.serie_mensual?.length){<div class="bar-chart" role="img" aria-label="Gráfico de mediciones y alertas por mes">@for (p of detail()!.serie_mensual;track p.mes){<div class="bar-column"><div class="bar-stacks"><div class="bar main-bar" [style.height.%]="barPct(p.mediciones)" [title]="p.mediciones + ' mediciones'"></div><div class="bar alert-bar" [style.height.%]="barPct(p.alertas)" [title]="p.alertas + ' alertas'"></div></div><span>{{p.mes}}</span></div>}</div>}@else{<div class="chart-placeholder"><span>▤</span><strong>Serie pendiente</strong><p>La API proporcionará datos agregados desde PostgreSQL.</p></div>}
      </section>
      <section class="panel cases-panel"><div class="panel-head"><div><small class="panel-overline">VALIDACIÓN POSTERIOR</small><h2>Casos prioritarios para revisión</h2><p>La predicción es una alerta preliminar; no confirma fraude.</p></div><button class="secondary-button" (click)="applyFilters()">↻ Actualizar tabla</button></div>
        <div class="table-scroll"><table><thead><tr><th>ID</th><th>Fecha</th><th>Cliente</th><th>Sector</th><th>Tipo</th><th>Score</th><th>Estado</th></tr></thead><tbody>
          @for(item of alerts()?.items || [];track item.id){<tr><td><b>{{item.id}}</b></td><td>{{item.fecha}}</td><td>{{item.cliente}}</td><td>{{item.sector}}</td><td>{{item.tipo}}</td><td><span class="score-pill">{{pct(item.score_pct)}}</span></td><td><span class="state-pill">{{item.estado}}</span></td></tr>}
          @if(!alerts()?.items?.length){<tr><td colspan="7" class="no-rows">{{loading() ? 'Cargando casos…' : 'No se recibieron casos para los filtros seleccionados.'}}</td></tr>}
        </tbody></table></div><div class="table-foot"><span>Registros disponibles: {{n(alerts()?.total)}}</span><span>Origen: {{alerts()?.origen || 'pendiente'}}</span></div>
      </section>
      <p class="data-note">Nota: no se atribuye valor económico, recuperación de ingresos ni métricas de campo reales a los datos demostrativos. El flujo RabbitMQ/IA y los datos precargados son fuentes distintas; esta vista no acredita fraude real.</p>
    </section>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OperationalPage implements OnInit {
  private readonly api = inject(DashboardApi);
  private readonly destroyRef = inject(DestroyRef);
  summary = signal<DashboardSummary | null>(null);
  detail = signal<DashboardDetail | null>(null);
  alerts = signal<AlertPage | null>(null);
  error = signal('');
  loading = signal(false);
  sector = 'todos';
  estado = 'todos';
  n = asNumber;
  pct = safePercent;
  ngOnInit(): void { this.refresh(); merge(interval(5000), this.api.sourceChanged$).pipe(takeUntilDestroyed(this.destroyRef)).subscribe(() => this.refresh()); }
  sourceLabel(): string { return this.api.source() === 'flujo' ? 'Flujo RabbitMQ / IA · sintético' : 'Semilla demo · sintética'; }
  refresh(): void {
    this.loading.set(true); this.error.set('');
    this.api.summary().subscribe({next:s=>this.summary.set(s),error:()=>this.error.set('No responde GET /api/dashboard/resumen.')});
    this.api.detail().subscribe({next:d=>this.detail.set(d),error:()=>this.error.set('No responde GET /api/dashboard/detalle.')});
    this.applyFilters();
  }
  applyFilters(): void {
    this.loading.set(true);
    this.api.alerts(this.sector,this.estado).subscribe({next:a=>{this.alerts.set(a);this.loading.set(false);},error:()=>{this.loading.set(false);this.error.set('No responde GET /api/dashboard/alertas.');}});
  }
  barPct(x:number):number { const max = Math.max(1,...(this.detail()?.serie_mensual||[]).map(p=>p.mediciones));return Math.max(2,100*x/max); }
  exportAlerts():void { const a=this.alerts(); if(a?.items?.length) downloadCsv('sidi_alertas.csv',a.items.map(x=>({...x}) as Record<string,unknown>)); }
}
