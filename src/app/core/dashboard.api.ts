import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject, signal } from '@angular/core';
import { Observable, Subject } from 'rxjs';

export type DashboardSource = 'demo' | 'flujo';
export interface DashboardSummary {
  origen: string; es_demo: boolean; actualizado_en: string;
  mediciones_total: number; clientes_total: number; alertas_total: number;
  lecturas_estimadas: number; consumo_promedio_m3: number; tasa_alertas_pct: number;
  evaluadas_total: number; sin_perfil_total: number;
  errores_total: number; pendientes_total: number;
}
export interface MonthlyPoint { mes: string; mediciones: number; alertas: number; }
export interface BreakdownItem { etiqueta: string; cantidad: number; porcentaje?: number; }
export interface SectorItem { sector: string; mediciones: number; alertas: number; riesgo_pct: number; }
export interface AlertItem {
  id: number | string; fecha: string; cliente: string; sector: string;
  tipo: string; score_pct: number; estado: string;
}
export interface DashboardDetail {
  origen: string; es_demo: boolean;
  serie_mensual: MonthlyPoint[]; tipologias: BreakdownItem[]; sectores: SectorItem[];
}
export interface AlertPage { origen: string; es_demo: boolean; total: number; items: AlertItem[]; }

/** Angular consulta FastAPI vía Nginx; nunca accede a PostgreSQL directamente. */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/dashboard';
  private readonly sourceState = signal<DashboardSource>('flujo');
  private readonly changes = new Subject<void>();
  readonly source = this.sourceState.asReadonly();
  readonly sourceChanged$ = this.changes.asObservable();

  setSource(source: DashboardSource): void {
    if (source !== 'flujo' && source !== 'demo') return;
    if (source !== this.sourceState()) {
      this.sourceState.set(source);
      this.changes.next();
    }
  }
  private params(): HttpParams { return new HttpParams().set('fuente', this.source()); }
  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(this.base + '/resumen', { params: this.params() });
  }
  detail(): Observable<DashboardDetail> {
    return this.http.get<DashboardDetail>(this.base + '/detalle', { params: this.params() });
  }
  alerts(sector?: string, estado?: string): Observable<AlertPage> {
    let params = this.params();
    if (sector && sector !== 'todos') params = params.set('sector', sector);
    if (estado && estado !== 'todos') params = params.set('estado', estado);
    return this.http.get<AlertPage>(this.base + '/alertas', { params });
  }
}
