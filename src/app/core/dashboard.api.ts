import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface DashboardSummary {
  origen: string;
  es_demo: boolean;
  actualizado_en: string;
  mediciones_total: number;
  clientes_total: number;
  alertas_total: number;
  lecturas_estimadas: number;
  consumo_promedio_m3: number;
  tasa_alertas_pct: number;
}
export interface MonthlyPoint { mes: string; mediciones: number; alertas: number; }
export interface BreakdownItem { etiqueta: string; cantidad: number; porcentaje?: number; }
export interface SectorItem { sector: string; mediciones: number; alertas: number; riesgo_pct: number; }
export interface AlertItem {
  id: number | string;
  fecha: string;
  cliente: string;
  sector: string;
  tipo: string;
  score_pct: number;
  estado: string;
}
export interface DashboardDetail {
  origen: string;
  es_demo: boolean;
  serie_mensual: MonthlyPoint[];
  tipologias: BreakdownItem[];
  sectores: SectorItem[];
}
export interface AlertPage {
  origen: string;
  es_demo: boolean;
  total: number;
  items: AlertItem[];
}

/** Contrato reservado para el futuro módulo GET /api/dashboard/* de eps_ai.
 * El frontend nunca se conecta directamente a PostgreSQL.
 */
@Injectable({ providedIn: 'root' })
export class DashboardApi {
  private readonly http = inject(HttpClient);
  private readonly base = '/api/dashboard';

  summary(): Observable<DashboardSummary> {
    return this.http.get<DashboardSummary>(`${this.base}/resumen`);
  }
  detail(): Observable<DashboardDetail> {
    return this.http.get<DashboardDetail>(`${this.base}/detalle`);
  }
  alerts(sector?: string, estado?: string): Observable<AlertPage> {
    let params = new HttpParams();
    if (sector && sector !== 'todos') params = params.set('sector', sector);
    if (estado && estado !== 'todos') params = params.set('estado', estado);
    return this.http.get<AlertPage>(`${this.base}/alertas`, { params });
  }
}
