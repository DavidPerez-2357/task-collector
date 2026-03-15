-- 007_add_missing_recurrence_columns.sql
-- Añadir last_cron_run a player_state para controlar la ejecución diaria del cron
ALTER TABLE player_state ADD COLUMN last_cron_run TEXT;

-- Añadir end_date a task_history para permitir cálculos de recurrencia basados en la fecha límite histórica
ALTER TABLE task_history ADD COLUMN end_date INTEGER;

-- Rellenar de forma aproximada el end_date histórico con el completed_at para evitar nulos en tareas viejas
UPDATE task_history SET end_date = completed_at WHERE end_date IS NULL;
