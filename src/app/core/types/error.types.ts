/**
 * Distinguishes between user-facing errors and internal technical errors.
 *
 * - `'user'`      – A business-logic or validation error that the user can act on
 *                   (e.g. "No tienes gemas suficientes").  Show the exact message.
 * - `'technical'` – An unexpected internal error (DB failure, network, etc.).
 *                   The original exception is logged to the console; the user
 *                   sees a generic, non-technical fallback message.
 */
export type AppErrorKind = 'user' | 'technical';

/** Structured error object emitted by {@link ErrorService}. */
export interface AppError {
  kind: AppErrorKind;
  /** Human-readable message to display in the UI. */
  message: string;
}
