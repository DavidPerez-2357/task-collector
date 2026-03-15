
ALTER TABLE task ADD COLUMN anchor_date INTEGER;


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
