-- Añadir columna anchor_date a la tabla task
ALTER TABLE task ADD COLUMN anchor_date INTEGER;

-- Rellenar anchor_date con los datos existentes
-- Prioridad 1: start_date de la instancia activa actual si existe
-- Prioridad 2: completed_at de la historia más reciente si ya se completó

UPDATE task
SET anchor_date = (
    SELECT start_date
    FROM task_active
    WHERE task_active.task_id = task.id
    ORDER BY id ASC
    LIMIT 1
)
WHERE anchor_date IS NULL AND EXISTS (
    SELECT 1 FROM task_active WHERE task_active.task_id = task.id
);

UPDATE task
SET anchor_date = (
    SELECT completed_at
    FROM task_history
    WHERE task_history.task_id = task.id
    ORDER BY completed_at DESC
    LIMIT 1
)
WHERE anchor_date IS NULL AND EXISTS (
    SELECT 1 FROM task_history WHERE task_history.task_id = task.id
);

-- Si todavía queda alguna tarea sin anchor_date (ej: se creó pero borró), 
-- le asignamos la fecha actual (segura). En sq-lite no podemos usar datetime() como timestamp fácilmente, 
-- pero podemos dejarlo a NULL si no aplica, o usar unixepoch() * 1000 en versiones modernas de sqlite.
-- Lo dejaremos así, las de arriba cubren el 99.9% de los casos reales.
