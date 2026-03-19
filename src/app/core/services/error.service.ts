import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AppError, AppErrorKind } from '@core/types/error.types';

/**
 * Global error bus for the application.
 *
 * ## Usage
 *
 * ### User-facing error (validation / business logic)
 * ```ts
 * this.errorService.showUser('No tienes gemas suficientes.');
 * ```
 *
 * ### Technical / unexpected error (DB failure, network, etc.)
 * ```ts
 * } catch (e) {
 *   this.errorService.handle(e, 'Error al cargar la tienda.');
 * }
 * ```
 * `handle()` logs the original exception to the console and shows a
 * user-friendly fallback message in the error modal.
 *
 * ### Resetting the error state
 * ```ts
 * this.errorService.clear();
 * ```
 *
 * ### Subscribing in a component
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

  /** Emits the current {@link AppError} or `null` when there is no active error. */
  readonly error$: Observable<AppError | null> = this.errorSubject.asObservable();

  constructor() {}

  /**
   * Show a user-facing error message (e.g. validation or business-logic failures).
   * The message is displayed as-is in the error modal.
   */
  showUser(message: string): void {
    this.errorSubject.next({ kind: 'user', message });
  }

  /**
   * Handle an unexpected technical error.
   * Logs the original exception to the console and shows `fallbackMessage`
   * in the error modal with `kind: 'technical'`.
   *
   * @param error          – The caught exception (logged to console).
   * @param fallbackMessage – A user-friendly message to display in the UI.
   */
  handle(error: unknown, fallbackMessage: string): void {
    console.error(fallbackMessage, error);
    this.errorSubject.next({ kind: 'technical', message: fallbackMessage });
  }

  /**
   * @deprecated Use {@link showUser} for user-facing errors or
   *             {@link handle} for unexpected technical errors.
   *             Kept for backward compatibility – maps to {@link showUser}.
   */
  show(message: string): void {
    this.showUser(message);
  }

  /** Clear the current error state. */
  clear(): void {
    this.errorSubject.next(null);
  }

  /** Returns `true` if an error is currently active. */
  isError(): boolean {
    return this.errorSubject.getValue() !== null;
  }

  /** Returns the kind of the current error, or `null` if none. */
  currentKind(): AppErrorKind | null {
    return this.errorSubject.getValue()?.kind ?? null;
  }

  /** Returns the current error message, or `null` if none. */
  currentMessage(): string | null {
    return this.errorSubject.getValue()?.message ?? null;
  }
}
