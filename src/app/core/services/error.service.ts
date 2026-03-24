import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppError, AppErrorKind } from '@core/types/error.types';

/**
 * Bus global de errores de la aplicación.
 *
 * ## Uso
 *
 * ### Error visible para el usuario (validación / lógica de negocio)
 * ```ts
 * this.errorService.showUser('No tienes gemas suficientes.');
 * ```
 *
 * ### Error técnico / inesperado (fallo de BD, red, etc.)
 * ```ts
 * } catch (e) {
 *   this.errorService.handle(e, 'Error al cargar la tienda.');
 * }
 * ```
 * `handle()` registra la excepción original en consola y muestra un
 * mensaje de fallback amigable en el modal de error.
 *
 * ### Limpiar el estado de error
 * ```ts
 * this.errorService.clear();
 * ```
 *
 * ### Suscribirse en un componente
 * ```ts
 * error$ = this.errorService.error$;          // Observable<AppError | null>
 * errorOpen$ = this.errorService.error$.pipe(map((e) => !!e));
 * ```
 */
@Injectable({
  providedIn: 'root',
})
export class ErrorService {
  private errorSubject = new BehaviorSubject<AppError | null>(null);

  /** Emite el {@link AppError} actual o `null` cuando no hay ningún error activo. */
  readonly error$: Observable<AppError | null> = this.errorSubject.asObservable();

  constructor() {}

  /**
   * Muestra un mensaje de error visible para el usuario (p. ej. validaciones o fallos de lógica de negocio).
   * El mensaje se muestra tal cual en el modal de error.
   */
  showUser(message: string): void {
    this.errorSubject.next({ kind: 'user', message });
  }

  /**
   * Gestiona un error técnico inesperado.
   * Registra la excepción original en consola y muestra `fallbackMessage`
   * en el modal de error con `kind: 'technical'`.
   *
   * @param error          – La excepción capturada (se registra en consola).
   * @param fallbackMessage – Mensaje amigable para mostrar en la UI.
   */
  handle(error: unknown, fallbackMessage: string): void {
    console.error(fallbackMessage, error);
    this.errorSubject.next({ kind: 'technical', message: fallbackMessage });
  }

  /** Limpia el estado de error actual. */
  clear(): void {
    this.errorSubject.next(null);
  }

  /** Devuelve `true` si hay un error activo en este momento. */
  isError(): boolean {
    return this.errorSubject.getValue() !== null;
  }

  /** Devuelve el tipo del error actual, o `null` si no hay ninguno. */
  currentKind(): AppErrorKind | null {
    return this.errorSubject.getValue()?.kind ?? null;
  }

  /** Devuelve el mensaje de error actual, o `null` si no hay ninguno. */
  currentMessage(): string | null {
    return this.errorSubject.getValue()?.message ?? null;
  }
}
