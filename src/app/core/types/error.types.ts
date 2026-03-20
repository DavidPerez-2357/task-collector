/**
 * Distingue entre errores visibles para el usuario y errores técnicos internos.
 *
 * - `'user'`      – Error de lógica de negocio o validación sobre el que el usuario puede actuar
 *                   (p. ej. "No tienes gemas suficientes"). Se muestra el mensaje exacto.
 * - `'technical'` – Error interno inesperado (fallo de BD, red, etc.).
 *                   La excepción original se registra en consola; el usuario
 *                   ve un mensaje de fallback genérico y no técnico.
 */
export type AppErrorKind = 'user' | 'technical';

/** Objeto de error estructurado emitido por {@link ErrorService}. */
export interface AppError {
  kind: AppErrorKind;
  /** Mensaje legible para mostrar en la UI. */
  message: string;
}
