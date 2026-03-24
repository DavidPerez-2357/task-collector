/**
 * Convención de soft-delete / hard-delete
 * =======================================
 * Solo la tabla `task` soporta eliminación lógica (soft delete) mediante la columna
 * `deleted` (INTEGER NOT NULL DEFAULT 0).
 *
 * Convención:
 *  - Soft delete    → `UPDATE task SET deleted = 1 WHERE id = ?`
 *  - Consulta activa → siempre añadir `WHERE <alias>.deleted = 0` (o `AND deleted = 0`)
 *  - Hard delete    → se usa para filas transitorias/hijas (task_active, weekly_recurrence,
 *                      inventory, tablas de unión). Estas filas no tienen valor de negocio
 *                      una vez eliminadas y no necesitan un historial de auditoría.
 *
 * Usa los helpers de abajo en lugar de incrustar fragmentos SQL literales para que
 * cualquier futuro renombrado de la columna solo requiera cambiar este archivo.
 */

/** Nombre de la columna de marca de soft-delete en la tabla `task`. */
export const SOFT_DELETE_COLUMN = 'deleted';

/**
 * Fragmento SQL para la cláusula SET al hacer soft-delete de una tarea.
 * Uso: `UPDATE task SET ${SOFT_DELETE_SET} WHERE id = ?`
 */
export const SOFT_DELETE_SET = `${SOFT_DELETE_COLUMN} = 1`;

/**
 * Devuelve un fragmento SQL de filtro que excluye filas soft-deleted de la tabla `task`.
 *
 * @param tableAlias - Alias opcional para la tabla `task` (por ejemplo `'t'`).
 *
 * Uso sin alias: `WHERE ${sqlNotDeleted()}`
 * Uso con alias: `WHERE ${sqlNotDeleted('t')}`
 */
export function sqlNotDeleted(tableAlias?: string): string {
  const col = tableAlias ? `${tableAlias}.${SOFT_DELETE_COLUMN}` : SOFT_DELETE_COLUMN;
  return `${col} = 0`;
}
