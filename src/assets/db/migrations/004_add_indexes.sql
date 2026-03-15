-- 004_add_indexes.sql
-- Índices para mejorar consultas frecuentes y evitar full table scans

-- Facilita búsquedas por rango de fechas y por task en task_active
CREATE INDEX IF NOT EXISTS idx_task_active_start_task ON task_active (start_date, task_id);
CREATE INDEX IF NOT EXISTS idx_task_active_end_date ON task_active (end_date);

-- Soporta consultas por task_id y completed_at en task_history (MAX(completed_at) y búsquedas por task)
CREATE INDEX IF NOT EXISTS idx_task_history_task_completed_at ON task_history (task_id, completed_at);

-- Acelera joins/consultas donde se busca por item_id en collection_item
CREATE INDEX IF NOT EXISTS idx_collection_item_item ON collection_item (item_id);

-- Indice para consultas de ventas por item
CREATE INDEX IF NOT EXISTS idx_sales_item ON sales (item_id);

-- (Ya existe idx_task_skips_task_start)

