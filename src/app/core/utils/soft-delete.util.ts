/**
 * Soft-delete / hard-delete convention
 * =====================================
 * Only the `task` table supports logical (soft) deletion via the `deleted` column
 * (INTEGER NOT NULL DEFAULT 0).
 *
 * Convention:
 *  - Soft delete  → `UPDATE task SET deleted = 1 WHERE id = ?`
 *  - Active query → always add `WHERE <alias>.deleted = 0` (or `AND deleted = 0`)
 *  - Hard delete  → used for transient/child rows (task_active, weekly_recurrence,
 *                   inventory, junction tables). These rows have no business value
 *                   once removed and do not need an audit trail.
 *
 * Use the helpers below instead of inlining literal SQL fragments so that any
 * future rename of the column only needs to change this one file.
 */

/** The name of the soft-delete flag column on the `task` table. */
export const SOFT_DELETE_COLUMN = 'deleted';

/**
 * SQL fragment for the SET clause when soft-deleting a task.
 * Usage: `UPDATE task SET ${SOFT_DELETE_SET} WHERE id = ?`
 */
export const SOFT_DELETE_SET = `${SOFT_DELETE_COLUMN} = 1`;

/**
 * Returns a SQL filter fragment that excludes soft-deleted task rows.
 *
 * @param tableAlias - Optional alias for the `task` table (e.g. `'t'`).
 *
 * Usage without alias: `WHERE ${sqlNotDeleted()}`
 * Usage with alias:    `WHERE ${sqlNotDeleted('t')}`
 */
export function sqlNotDeleted(tableAlias?: string): string {
  const col = tableAlias ? `${tableAlias}.${SOFT_DELETE_COLUMN}` : SOFT_DELETE_COLUMN;
  return `${col} = 0`;
}
