import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { Task, TaskActive } from '@core/models/task.model';
import { Category } from '@core/models/category.model';
import {
  DAY_MS,
  daysBetween,
  getStartOfToday,
  getStartOfDayMs,
  getNextWeekdayMs,
  parseDueDateToEndOfDay
} from '@core/utils/date.util';

@Injectable({
  providedIn: 'root',
})
export class TaskRepository {
  private databaseService = inject(DatabaseService);

  /**
   * Convierte una fila de la base de datos en un objeto TaskActive con tipos adecuados.
   */
  private formatDBRowToTaskActive(row: any): TaskActive {
    const category: Category = {
      id: Number(row.category_id),
      name: row.category_name,
      imageName: row.category_image_name,
    };

    return {
      taskActiveId: Number(row.id),
      id: Number(row.task_id),
      name: row.name,
      frequency: Number(row.frequency),
      interval: Number(row.interval),
      effort: Number(row.effort),
      category,
      startDate: Number(row.start_date),
      endDate: Number(row.end_date),
      weekdays: row.weekdays ? String(row.weekdays).split(',').map(Number) : undefined,
    };
  }

  /**
   * Inserta una nueva definición de tarea en la tabla `task` y su primera instancia.
   */
  async createTask(
    task: Omit<Task, 'id'> & { dueDate?: string; weekdays?: number[] },
  ): Promise<void> {
    const todayStart = getStartOfToday();

    let firstStart: number;
    let firstEnd: number;

    if (task.frequency === 2 /* Weekly */ && task.weekdays?.length) {
      firstStart = getNextWeekdayMs(task.weekdays, todayStart);
      firstEnd = firstStart + DAY_MS - 1;
    } else {
      firstEnd = parseDueDateToEndOfDay(task.dueDate) ?? (todayStart + DAY_MS - 1);
      firstStart = getStartOfDayMs(firstEnd);
    }

    const anchorDate = task.frequency === 3 ? firstEnd : null;
    const categoryId = task.category?.id ?? null;

    return await this.databaseService.withConn(async (conn) => {
      const insertResult = await conn.run(
        `
        INSERT INTO task (name, frequency, interval, effort, category_id, anchor_date)
        VALUES (?, ?, ?, ?, ?, ?)
      `,
        [task.name, task.frequency, task.interval, task.effort, categoryId, anchorDate],
      );

      const newTaskId = insertResult?.changes?.lastId;

      if (newTaskId) {
        if (task.frequency === 2 && task.weekdays?.length) {
          for (const weekday of task.weekdays) {
            await conn.run(`INSERT INTO weekly_recurrence (task_id, weekday) VALUES (?, ?)`, [
              newTaskId,
              weekday,
            ]);
          }
        }

        await conn.run(`INSERT INTO task_active (task_id, start_date, end_date) VALUES (?, ?, ?)`, [
          newTaskId,
          firstStart,
          firstEnd,
        ]);
      }
    });
  }

  /**
   * Actualiza la definición de una tarea existente y su end_date en task_active.
   */
  async updateTask(
    taskId: number,
    activeTaskId: number,
    task: Omit<Task, 'id'> & { dueDate?: string; weekdays?: number[] },
  ): Promise<void> {
    const end = parseDueDateToEndOfDay(task.dueDate);
    const todayStart = getStartOfToday();

    return await this.databaseService.withConn(async (conn) => {
      const oldTaskRes = await conn.query(
        `SELECT frequency, interval, anchor_date FROM task WHERE id = ?`,
        [taskId]
      );
      const oldActiveRes = await conn.query(
        `SELECT start_date, end_date FROM task_active WHERE id = ?`,
        [activeTaskId]
      );
      
      const oldTask = oldTaskRes.values?.[0];
      const oldActive = oldActiveRes.values?.[0];
      
      let oldWeekdays: number[] = [];
      if (oldTask && Number(oldTask.frequency) === 2) {
        const rw = await conn.query(`SELECT weekday FROM weekly_recurrence WHERE task_id = ?`, [taskId]);
        oldWeekdays = rw.values?.map((r: any) => Number(r.weekday)) ?? [];
      }

      const recurrenceChanged = !oldTask || 
        Number(oldTask.frequency) !== task.frequency || 
        Number(oldTask.interval) !== task.interval ||
        JSON.stringify(oldWeekdays.sort()) !== JSON.stringify((task.weekdays || []).sort());

      let newAnchorDate: number | null = null;
      if (task.frequency === 3) {
        if (!recurrenceChanged && oldTask?.anchor_date && !end) {
          newAnchorDate = Number(oldTask.anchor_date);
        } else {
          newAnchorDate = end ?? (todayStart + DAY_MS - 1);
        }
      }

      const categoryId = task.category?.id ?? null;

      await conn.run(
        `UPDATE task SET name = ?, frequency = ?, interval = ?, effort = ?, category_id = ?, anchor_date = ? WHERE id = ?`,
        [task.name, task.frequency, task.interval, task.effort, categoryId, newAnchorDate, taskId],
      );

      await conn.run(`DELETE FROM weekly_recurrence WHERE task_id = ?`, [taskId]);

      if (task.frequency === 2 /* Weekly */ && task.weekdays?.length) {
        for (const weekday of task.weekdays) {
          await conn.run(`INSERT INTO weekly_recurrence (task_id, weekday) VALUES (?, ?)`, [taskId, weekday]);
        }
        
        const currentIsFuture = oldActive && Number(oldActive.start_date) >= todayStart;
        
        if (!recurrenceChanged && currentIsFuture) {
          // No hacemos nada
        } else {
          const newStart = getNextWeekdayMs(task.weekdays, todayStart);
          const newEnd = newStart + DAY_MS - 1;
          
          await conn.run(
            `UPDATE task_active SET start_date = ?, end_date = ? WHERE id = ?`, 
            [newStart, newEnd, activeTaskId]
          );
        }
      } else if (end !== null) {
        const newStart = getStartOfDayMs(end);
        await conn.run(
          `UPDATE task_active SET start_date = ?, end_date = ? WHERE id = ?`, 
          [newStart, end, activeTaskId]
        );
      }
    });
  }

  /**
   * Actualiza solo una instancia específica de la tarea (fecha límite).
   */
  async updateTaskInstance(activeTaskId: number, dueDate?: string): Promise<void> {
    const end = parseDueDateToEndOfDay(dueDate);
    
    return await this.databaseService.withConn(async (conn) => {
      if (end !== null) {
        await conn.run(
          `UPDATE task_active SET end_date = ? WHERE id = ?`, 
          [end, activeTaskId]
        );
      }
    });
  }

  /**
   * Elimina la tarea global (plantilla) y opcionalmente su instancia activa.
   */
  async deleteGlobalTask(taskId: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(`UPDATE task SET deleted = 1 WHERE id = ?`, [taskId]);
      await conn.run(`DELETE FROM task_active WHERE task_id = ?`, [taskId]);
    });
  }

  /**
   * Obtiene todas las tareas activas (task_active) no eliminadas.
   */
  async getActiveTasks(): Promise<TaskActive[]> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(
        `
        SELECT ta.id, t.id as task_id, t.name, t.frequency, t.interval, t.effort,
               ta.start_date, ta.end_date,
               c.id as category_id, c.name as category_name, c.image_name as category_image_name,
               GROUP_CONCAT(wr.weekday) as weekdays
        FROM task_active ta
        JOIN task t ON ta.task_id = t.id
        JOIN category c ON t.category_id = c.id
        LEFT JOIN weekly_recurrence wr ON t.id = wr.task_id
        WHERE t.deleted = 0
        GROUP BY ta.id
        ORDER BY ta.end_date
      `,
        [],
      );

      const values = res.values || [];
      return values.map((r: any) => this.formatDBRowToTaskActive(r));
    });
  }

  // =========================================================================
  // MÉTODOS SOLICITADOS POR EL TASK RECURRENCE SERVICE Y ACTION SERVICE
  // =========================================================================

  async getLastCronRunDate(): Promise<string | null> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(`SELECT last_cron_run FROM player_state LIMIT 1`, []);
      return res.values?.[0]?.last_cron_run ? String(res.values[0].last_cron_run) : null;
    });
  }

  async updateLastCronRunDate(dateStr: string): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(`UPDATE player_state SET last_cron_run = ?`, [dateStr]);
    });
  }

  async getGlobalRecurringTasks(): Promise<{ id: number; frequency: number; interval: number; anchorDate?: number }[]> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(
        `SELECT id, frequency, interval, anchor_date FROM task WHERE frequency != 0 AND deleted = 0`,
        [],
      );

      return (res.values ?? []).map((r: any) => ({
        id: Number(r.id),
        frequency: Number(r.frequency),
        interval: Number(r.interval),
        anchorDate: r.anchor_date ? Number(r.anchor_date) : undefined,
      }));
    });
  }

  async getActiveTasksTodaySet(taskIds: number[], start: number, end: number): Promise<Set<number>> {
    if (!taskIds || taskIds.length === 0) return new Set<number>();

    return await this.databaseService.withConn(async (conn) => {
      const placeholders = taskIds.map(() => '?').join(',');

      // EL ARREGLO: Volvemos a la comprobación de solapamiento.
      // "Si la tarea empezó antes del fin de hoy, y su fecha límite es después del inicio de hoy... 
      // significa que sigue viva en pantalla, así que NO crees otra nueva".
      const res = await conn.query(
        `SELECT DISTINCT task_id
         FROM task_active
         WHERE task_id IN (${placeholders})
           AND start_date <= ? AND end_date >= ?`,
        [...taskIds, end, start],
      );

      const set = new Set<number>();
      for (const r of res.values ?? []) {
        set.add(Number((r as any).task_id));
      }
      return set;
    });
  }

  async getSkippedTasksTodaySet(taskIds: number[], start: number, end: number): Promise<Set<number>> {
    if (!taskIds || taskIds.length === 0) return new Set<number>();

    return await this.databaseService.withConn(async (conn) => {
      const placeholders = taskIds.map(() => '?').join(',');
      
      const res = await conn.query(
        `SELECT DISTINCT task_id 
         FROM task_skips 
         WHERE task_id IN (${placeholders}) 
           AND start_date >= ? AND start_date <= ?`,
        [...taskIds, start, end]
      );
      
      return new Set((res.values ?? []).map((r: any) => Number(r.task_id)));
    });
  }

  async getTaskDefinition(taskId: number): Promise<any> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(`SELECT id, frequency, interval, anchor_date FROM task WHERE id = ?`, [taskId]);
      if (!res.values?.length) return null;
      const r = res.values[0];
      return { 
        id: Number(r.id), frequency: Number(r.frequency), 
        interval: Number(r.interval), anchorDate: r.anchor_date ? Number(r.anchor_date) : undefined 
      };
    });
  }

  async getLastCompletedDueDate(taskId: number): Promise<number | null> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(`SELECT MAX(end_date) as last_due FROM task_history WHERE task_id = ?`, [taskId]);
      return res.values?.[0]?.last_due ? Number(res.values[0].last_due) : null;
    });
  }

  async getTaskWeekdays(taskId: number): Promise<number[]> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(`SELECT weekday FROM weekly_recurrence WHERE task_id = ?`, [taskId]);
      return (res.values ?? []).map((r: any) => Number(r.weekday));
    });
  }

  async getActiveTaskDatesSet(taskId: number, startMs: number, endMs: number): Promise<Set<number>> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(`SELECT start_date FROM task_active WHERE task_id = ? AND start_date >= ? AND start_date <= ?`, [taskId, startMs, endMs]);
      return new Set((res.values ?? []).map((r: any) => Number(r.start_date)));
    });
  }

  async getSkippedTaskDatesSet(taskId: number, startMs: number, endMs: number): Promise<Set<number>> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(`SELECT start_date FROM task_skips WHERE task_id = ? AND start_date >= ? AND start_date <= ?`, [taskId, startMs, endMs]);
      return new Set((res.values ?? []).map((r: any) => Number(r.start_date)));
    });
  }

  async insertActiveTaskSingle(taskId: number, start: number, end: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(`INSERT INTO task_active (task_id, start_date, end_date) VALUES (?, ?, ?)`, [taskId, start, end]);
    });
  }

  async skipTaskActiveById(
    taskActiveId: number,
    skippedAt: number,
    reason = 'user_deleted',
  ): Promise<{ taskId: number; startDate: number }> { 
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(
        `SELECT task_id, start_date, end_date FROM task_active WHERE id = ?`,
        [taskActiveId],
      );
      
      const values = res.values || [];
      if (!values.length) throw new Error(`task_active with id ${taskActiveId} not found`);

      const r: any = values[0];
      const taskId = Number(r.task_id);
      const startDate = Number(r.start_date);
      const endDate = Number(r.end_date);

      const set = [
        {
          statement: `INSERT INTO task_skips (task_id, start_date, end_date, skipped_at, reason) VALUES (?, ?, ?, ?, ?)`,
          values: [taskId, startDate, endDate, skippedAt, reason],
        },
        {
          statement: `DELETE FROM task_active WHERE id = ?`,
          values: [taskActiveId],
        },
      ];

      await conn.executeSet(set, true);
      return { taskId, startDate };
    });
  }

  async getWeeklyRecurrenceMap(taskIds: number[]): Promise<Map<number, number[]>> {
    const map = new Map<number, number[]>();
    if (!taskIds || taskIds.length === 0) return map;

    return await this.databaseService.withConn(async (conn) => {
      const placeholders = taskIds.map(() => '?').join(',');
      const res = await conn.query(
        `SELECT task_id, weekday FROM weekly_recurrence WHERE task_id IN (${placeholders})`,
        taskIds,
      );

      for (const r of res.values ?? []) {
        const taskId = Number((r as any).task_id);
        const weekday = Number((r as any).weekday);
        const arr = map.get(taskId) ?? [];
        arr.push(weekday);
        map.set(taskId, arr);
      }
      return map;
    });
  }

  async getLastCompletionsDueDateMap(taskIds: number[]): Promise<Map<number, number>> {
    const map = new Map<number, number>();
    if (!taskIds || taskIds.length === 0) return map;

    return await this.databaseService.withConn(async (conn) => {
      const placeholders = taskIds.map(() => '?').join(',');
      const res = await conn.query(
        `SELECT task_id, MAX(end_date) AS last_due_date
         FROM task_history
         WHERE task_id IN (${placeholders})
         GROUP BY task_id`,
        taskIds,
      );

      for (const r of res.values ?? []) {
        map.set(Number((r as any).task_id), Number((r as any).last_due_date));
      }
      return map;
    });
  }

  async insertActiveTasksBatch(taskIds: number[], start: number, end: number): Promise<void> {
    if (!taskIds || taskIds.length === 0) return;

    return await this.databaseService.withConn(async (conn) => {
      const placeholders = taskIds.map(() => '(?, ?, ?)').join(',');
      const params: any[] = [];

      for (const id of taskIds) {
        params.push(id, start, end);
      }

      await conn.run(
        `INSERT INTO task_active (task_id, start_date, end_date) VALUES ${placeholders}`,
        params,
      );
    });
  }

  async postponeTaskActiveById(taskActiveId: number, ms: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(
        `UPDATE task_active SET end_date = end_date + ? WHERE id = ?`, 
        [ms, taskActiveId]
      );
    });
  }

  async setTaskActiveDatesById(taskActiveId: number, start: number, end: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(`UPDATE task_active SET end_date = ? WHERE id = ?`, [
        end, // Ignoramos el 'start' que llega para proteger el ciclo
        taskActiveId,
      ]);
    });
  }

  async deleteTaskActiveById(taskActiveId: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(`DELETE FROM task_active WHERE id = ?`, [taskActiveId]);
    });
  }

  async completeTaskActiveById(taskActiveId: number, completedAt: number): Promise<{ taskId: number; startDate: number; endDate: number }> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(
        `SELECT task_id, start_date, end_date FROM task_active WHERE id = ?`,
        [taskActiveId],
      );
      
      const values = res.values || [];
      if (!values.length) throw new Error(`task_active with id ${taskActiveId} not found`);

      const r: any = values[0];
      const taskId = Number(r.task_id);
      const startDate = Number(r.start_date); // Ancla del ciclo (00:00:00)
      const currentEndDate = Number(r.end_date); // Fecha límite actual (puede haber sido pospuesta)

      // El retraso lo calculamos contra la fecha límite actual (si la pospuso legalmente, no cuenta como retraso)
      const daysLate = Math.max(0, daysBetween(currentEndDate, completedAt));

      // LA CORRECCIÓN: Calculamos el end_date original del ciclo matemáticamente
      const originalCycleEndDate = startDate + DAY_MS - 1; 

      const set = [
        {
          // Ahora SÍ guardamos un timestamp de 23:59:59 coherente con el nombre de la columna
          statement: `INSERT INTO task_history (task_id, completed_at, end_date, days_late) VALUES (?, ?, ?, ?)`,
          values: [taskId, completedAt, originalCycleEndDate, daysLate],
        },
        {
          statement: `DELETE FROM task_active WHERE id = ?`,
          values: [taskActiveId],
        },
      ];

      await conn.executeSet(set, true);
      
      // Devolvemos el end_date original para que el Cerebro calcule el futuro correctamente
      return { taskId, startDate, endDate: originalCycleEndDate };
    });
  }
}