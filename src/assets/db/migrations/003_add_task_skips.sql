-- 003_add_task_skips.sql
-- Registra instancias activas que el usuario eliminó/omitió para evitar recreación por la lógica de recurrencia

CREATE TABLE IF NOT EXISTS task_skips (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id INTEGER NOT NULL,
  start_date INTEGER NOT NULL,
  end_date INTEGER NOT NULL,
  skipped_at INTEGER NOT NULL,
  reason TEXT DEFAULT 'user_deleted',
  FOREIGN KEY (task_id) REFERENCES task(id) ON DELETE CASCADE
);

-- Índice para buscar rápidamente skips por task y rango de fechas
CREATE INDEX IF NOT EXISTS idx_task_skips_task_start ON task_skips (task_id, start_date);

