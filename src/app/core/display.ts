export function asNumber(value: number | null | undefined, digits = 0): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('es-PE', {maximumFractionDigits: digits, minimumFractionDigits: digits}).format(value);
}
export function safePercent(value: number | null | undefined): string {
  return value === undefined || value === null ? '—' : `${asNumber(value, 1)}%`;
}
export function csvEscape(value: unknown): string {
  const s = String(value ?? '');
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
/** Exportación local: solo exporta los registros realmente devueltos por la API. */
export function downloadCsv(name: string, rows: Record<string, unknown>[]): void {
  if (rows.length === 0) return;
  const keys = Object.keys(rows[0]);
  const csv = [keys.join(','), ...rows.map(row => keys.map(k => csvEscape(row[k])).join(','))].join('\r\n');
  const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = name; a.click();
  URL.revokeObjectURL(url);
}
