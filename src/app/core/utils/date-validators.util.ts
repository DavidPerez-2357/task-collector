import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';

/**
 * Devuelve un ValidatorFn que rechaza fechas anteriores a hoy.
 * El formato esperado del valor del control es "YYYY-MM-DD".
 * Produce el error { pastDate: true } cuando la validación falla.
 * Produce el error { invalidDate: true } si el formato del valor es inválido.
 */
export function notInPast(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;
    if (!value) return null; // Validators.required se encargará si es obligatorio

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const selected = parseDateString(value);
    if (!selected) return { invalidDate: true };

    return selected < today ? { pastDate: true } : null;
  };
}

/**
 * Devuelve un ValidatorFn que rechaza fechas más de N años en el futuro respecto a hoy.
 * El formato esperado del valor del control es "YYYY-MM-DD".
 * Produce el error { tooFarInFuture: { maxYears: number } } cuando la validación falla.
 * Produce el error { invalidDate: true } si el formato del valor es inválido.
 * @param years Número máximo de años permitidos en el futuro.
 */
export function notTooFarInFuture(years: number): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const value: string = control.value;
    if (!value) return null;

    const maxDate = new Date();
    maxDate.setFullYear(maxDate.getFullYear() + years);
    maxDate.setHours(23, 59, 59, 999);

    const selected = parseDateString(value);
    if (!selected) return { invalidDate: true };

    return selected > maxDate ? { tooFarInFuture: { maxYears: years } } : null;
  };
}

/**
 * Convierte un string "YYYY-MM-DD" a un objeto Date en hora local (00:00:00).
 * Devuelve null si el formato es inválido o la fecha fue normalizada
 * (ej. "2024-02-30" no es válida y se descarta).
 */
function parseDateString(value: string): Date | null {
  const parts = value.split('-');
  if (parts.length !== 3) return null;

  const year = Number(parts[0]);
  const month = Number(parts[1]) - 1;
  const day = Number(parts[2]);

  const d = new Date(year, month, day);

  if (isNaN(d.getTime())) return null;

  // Verificar que la fecha no fue normalizada automáticamente (ej. 30 feb → 1 mar)
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;

  return d;
}
