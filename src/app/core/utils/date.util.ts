export const DAY_MS = 86400000;

/**
 * Devuelve el timestamp de las 00:00:00 del día actual (local).
 */
export function getStartOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Trunca cualquier timestamp a las 00:00:00 de su respectivo día.
 * Fundamental para que las matemáticas de días sean exactas sin importar la hora.
 */
export function getStartOfDayMs(timestamp: number): number {
  const d = new Date(timestamp);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

/**
 * Calcula la diferencia estricta en DÍAS DE CALENDARIO.
 * (Corrige el bug de las tareas nocturnas y previene errores por cambio de horario DST)
 */
export function daysBetween(fromMs: number, toMs: number): number {
  const startFrom = getStartOfDayMs(fromMs);
  const startTo = getStartOfDayMs(toMs);
  
  // Usamos Math.round porque los cambios de horario (DST) pueden hacer que 
  // la diferencia real sea 23.99 horas o 24.01 horas.
  return Math.round((startTo - startFrom) / DAY_MS);
}

/**
 * Calcula la diferencia en SEMANAS DE CALENDARIO completas.
 */
export function weeksBetween(fromMs: number, toMs: number): number {
  return Math.floor(daysBetween(fromMs, toMs) / 7);
}

/**
 * Calcula la diferencia estricta de MESES DE CALENDARIO.
 * Si from = 31 Enero y to = 1 Febrero, devuelve 1.
 */
export function monthsBetween(fromMs: number, toMs: number): number {
  const f = new Date(fromMs);
  const t = new Date(toMs);
  return (t.getFullYear() - f.getFullYear()) * 12 + (t.getMonth() - f.getMonth());
}

// ---------------------------------------------------------------------------
// FUNCIONES EXTRAÍDAS DEL REPOSITORIO (Refactorización)
// ---------------------------------------------------------------------------

/**
 * Encuentra el timestamp (a las 00:00) del siguiente día de la semana solicitado.
 * @param weekdays Array de días (0=Domingo, 1=Lunes...) ej: [1, 3] para Lunes y Miércoles
 * @param fromMs Timestamp desde donde empezamos a buscar (suele ser hoy)
 */
export function getNextWeekdayMs(weekdays: number[], fromMs: number): number {
  if (!weekdays || weekdays.length === 0) return fromMs;

  const d = new Date(getStartOfDayMs(fromMs));
  const todayWeekday = d.getDay(); // 0-6

  // Ordenamos los días de menor a mayor (Domingo a Sábado)
  const sortedWeekdays = [...weekdays].sort((a, b) => a - b);

  // Buscamos el primer día de la semana configurado que sea MAYOR que el día actual
  const nextDay = sortedWeekdays.find((day) => day > todayWeekday);
  const firstDay = sortedWeekdays[0];

  if (nextDay !== undefined) {
    // El siguiente día está en esta misma semana
    d.setDate(d.getDate() + (nextDay - todayWeekday));
  } else if (firstDay !== undefined) {
    // El siguiente día está en la semana que viene (volvemos a empezar el ciclo)
    d.setDate(d.getDate() + (7 - todayWeekday + firstDay));
  }

  return d.getTime();
}

/**
 * Convierte un string de fecha "YYYY-MM-DD" al timestamp del final de ese día (23:59:59.999).
 * Devuelve null si no hay fecha o el formato es inválido.
 */
export function parseDueDateToEndOfDay(dueDate?: string): number | null {
  if (!dueDate) return null;
  
  const parts = dueDate.split('-');
  if (parts.length !== 3) return null; // Protección contra strings mal formados
  
  const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  
  if (isNaN(d.getTime())) return null; // Protección contra fechas inválidas
  
  d.setHours(23, 59, 59, 999);
  return d.getTime();
}