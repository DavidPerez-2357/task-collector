import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { Task, TaskActive } from '@core/models/task.model';
import { Category } from '@core/models/category.model';
import {
  DAY_MS,
  daysBetween,
  getStartOfToday,
  monthsBetween,
  weeksBetween,
} from '@core/utils/date.util';

@Injectable({
  providedIn: 'root',
})
export class TaskRepository {
  private databaseService = inject(DatabaseService);

  /**
   * Convierte una fila de la base de datos en un objeto TaskActive con tipos adecuados.
   * Devuelve el objeto mapeado listo para su uso en la aplicación.
   */
  private formatDBRowToTaskActive(row: any): TaskActive {
    const category: Category | null = row.category_id
      ? {
          id: Number(row.category_id),
          name: row.category_name,
          imageName: row.category_image_name,
        }
      : ({} as Category);

    return {
      // `row.id` proviene de ta.id (task_active.id). El id de la definición de la tarea viene en row.task_id
      taskActiveId: Number(row.id),
      id: Number(row.task_id),
      name: row.name,
      frequency: Number(row.frequency),
      interval: Number(row.interval),
      effort: Number(row.effort),
      category,
      startDate: Number(row.start_date),
      endDate: Number(row.end_date),
    } as TaskActive;
  }

  /**
   * Inserta una nueva definición de tarea en la tabla `task`.
   */
  async createTask(task: Omit<Task, 'id'> & { dueDate?: string; weekdays?: number[] }): Promise<void> {
    const todayStart = getStartOfToday();

    // Para tareas semanales con días seleccionados, la primera instancia
    // se pone en el próximo día de la semana coincidente (incluyendo hoy si aplica).
    let firstStart: number;
    let firstEnd: number;

    if (task.frequency === 2 /* Weekly */ && task.weekdays?.length) {
      firstStart = this.getNextWeekdayMs(task.weekdays, todayStart);
      firstEnd = firstStart + DAY_MS - 1;
    } else {
      firstStart = todayStart;
      firstEnd = this.parseDueDate(task.dueDate) ?? (todayStart + DAY_MS - 1);
    }

    return await this.databaseService.withConn(async (conn) => {
      const insertResult = await conn.run(
        `
        INSERT INTO task (name, frequency, interval, effort, category_id)
        VALUES (?, ?, ?, ?, ?)
      `,
        [task.name, task.frequency, task.interval, task.effort, task.category.id],
      );

      const newTaskId = insertResult?.changes?.lastId;

      if (newTaskId) {
        // Si es semanal y tiene días seleccionados, los guardamos
        if (task.frequency === 2 && task.weekdays?.length) {
          for (const weekday of task.weekdays) {
            await conn.run(
              `INSERT INTO weekly_recurrence (task_id, weekday) VALUES (?, ?)`,
              [newTaskId, weekday]
            );
          }
        }

        // Insertamos la primera instancia activa
        await conn.run(
          `INSERT INTO task_active (task_id, start_date, end_date) VALUES (?, ?, ?)`,
          [newTaskId, firstStart, firstEnd],
        );
      }
    });
  }

  /**
   * Dado un array de weekdays (0=Dom..6=Sáb) y un timestamp de inicio del día actual,
   * devuelve el timestamp del inicio del próximo día de semana coincidente (incluyendo hoy).
   */
  private getNextWeekdayMs(weekdays: number[], fromStartOfDay: number): number {
    if (!weekdays.length) return fromStartOfDay;
    let best: number | null = null;
    for (let offset = 0; offset < 7; offset++) {
      const d = new Date(fromStartOfDay);
      d.setDate(d.getDate() + offset);
      d.setHours(0, 0, 0, 0);
      if (weekdays.includes(d.getDay())) {
        const ms = d.getTime();
        if (best === null || ms < best) best = ms;
        break; // ya es el más próximo
      }
    }
    return best ?? fromStartOfDay;
  }

  /**
   * Actualiza la definición de una tarea existente y su end_date en task_active.
   */
  async updateTask(taskId: number, activeTaskId: number, task: Omit<Task, 'id'> & { dueDate?: string }): Promise<void> {
    const end = this.parseDueDate(task.dueDate);

    return await this.databaseService.withConn(async (conn) => {
      await conn.run(
        `UPDATE task SET name = ?, frequency = ?, interval = ?, effort = ?, category_id = ? WHERE id = ?`,
        [task.name, task.frequency, task.interval, task.effort, task.category.id, taskId],
      );

      if (end !== null) {
        await conn.run(
          `UPDATE task_active SET end_date = ? WHERE id = ?`,
          [end, activeTaskId],
        );
      }
    });
  }

  /**
   * Actualiza solo una instancia específica de la tarea (nombre en la vista y fecha límite).
   * No toca la definición global.
   */
  async updateTaskInstance(activeTaskId: number, name: string, dueDate?: string): Promise<void> {
    const end = this.parseDueDate(dueDate);
    return await this.databaseService.withConn(async (conn) => {
      // Nota: la tabla task_active no tiene nombre, el nombre viene de la tabla task.
      // Si queremos que SOLO esta instancia tenga un nombre diferente, tendríamos que 
      // modificar el esquema o crear una excepción. 
      // Por ahora, actualizaremos el end_date. Si el usuario quiere cambiar el nombre
      // de "solo esta vez", implicaría complicar el modelo.
      // Implementaremos el cambio de fecha límite por ahora.
      if (end !== null) {
        await conn.run(
          `UPDATE task_active SET end_date = ? WHERE id = ?`,
          [end, activeTaskId],
        );
      }
    });
  }

  /**
   * Elimina la tarea global (plantilla) y opcionalmente su instancia activa.
   */
  async deleteGlobalTask(taskId: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      // 1. Marcar como borrada globalmente
      await conn.run(`UPDATE task SET deleted = 1 WHERE id = ?`, [taskId]);
      
      // 2. Eliminar cualquier instancia activa relacionada
      await conn.run(`DELETE FROM task_active WHERE task_id = ?`, [taskId]);
    });
  }

  /**
   * Convierte una fecha "YYYY-MM-DD" al timestamp del final de ese día (23:59:59.999).
   * Devuelve null si no hay fecha.
   */
  private parseDueDate(dueDate?: string): number | null {
    if (!dueDate) return null;
    const parts = dueDate.split('-');
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }


  /**
   * Obtiene todas las tareas activas (task_active) no eliminadas y las mapea a TaskActive.
   * Devuelve la lista ordenada por `end_date`.
   */
  async getActiveTasks(): Promise<TaskActive[]> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(
        `
        SELECT ta.id, t.id as task_id, t.name, t.frequency, t.interval, t.effort, t.deleted,
               ta.start_date, ta.end_date,
               c.id as category_id, c.name as category_name, c.image_name as category_image_name
        FROM task_active ta
        JOIN task t ON ta.task_id = t.id
        LEFT JOIN category c ON t.category_id = c.id
        WHERE t.deleted = 0
        ORDER BY ta.end_date
      `,
        [],
      );

      const values = res.values || [];
      return values.map((r: any) => this.formatDBRowToTaskActive(r));
    });
  }

  /**
   * Comprueba si ya existen tareas recurrentes creadas para hoy en `task_active`.
   * Devuelve true si hay al menos una tarea recurrente creada hoy.
   */
  async checkIfRecurringTasksWereCreatedToday(): Promise<boolean> {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = startOfToday.getTime() + 86400000;

    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(
        `
          SELECT t.name FROM task t
          JOIN task_active ta ON t.id = ta.task_id
          WHERE t.frequency != 0 AND t.deleted = 0 AND ta.start_date >= ? AND ta.start_date < ?
      `,
        [startOfToday.getTime(), endOfToday],
      );

      const values = res.values || [];
      console.table(values);
      return values.length > 0;
    });
  }

  /**
   * Crea las instancias en `task_active` que deben existir hoy según la recurrencia y el historial.
   * Calcula qué tareas corresponden usando `task_history` y `weekly_recurrence`, y las inserta en bloque.
   */
  async createRecurringTasksForToday(): Promise<void> {
    const start = getStartOfToday();
    const end = start + DAY_MS - 1; // Hoy a las 23:59:59.999

    await this.databaseService.withConn(async (conn) => {
      const tasks = await this.getRecurringTasks(conn);
      if (!tasks.length) return;

      const taskIds = tasks.map((t) => t.id);

      const [lastCompletedByTask, activeToday, weekdaysByTask, skippedToday] = await Promise.all([
        this.getLastCompletions(conn, taskIds),
        this.getActiveTasksToday(conn, taskIds, start, end),
        this.getWeeklyRecurrence(conn, taskIds),
        this.getSkippedTasksToday(conn, taskIds, start, end),
      ]);

      const todayWeekday = new Date(start).getDay();

      const tasksToCreate = tasks
        .filter((t) => !activeToday.has(t.id))
        .filter((t) => !skippedToday.has(t.id))
        .filter((t) =>
          this.shouldCreateTaskToday(
            t,
            lastCompletedByTask.get(t.id) ?? null,
            weekdaysByTask.get(t.id) ?? [],
            todayWeekday,
            start,
          ),
        )
        .map((t) => t.id);

      if (!tasksToCreate.length) return;

      await this.insertActiveTasks(conn, tasksToCreate, start, end);
    });
  }

  /**
   * Recupera las tareas con recurrencia desde la tabla `task`.
   * Devuelve id, frecuencia e intervalo de cada tarea recurrente activa.
   */
  private async getRecurringTasks(
    conn: any,
  ): Promise<{ id: number; frequency: number; interval: number }[]> {
    const res = await conn.query(
      `SELECT id, frequency, interval FROM task WHERE frequency != 0 AND deleted = 0`,
      [],
    );

    return (res.values ?? []).map((r: any) => ({
      id: Number(r.id),
      frequency: Number(r.frequency),
      interval: Number(r.interval),
    }));
  }

  /**
   * Devuelve un Set con los IDs de tareas que ya tienen una instancia activa hoy en `task_active`.
   * Acepta una lista de IDs y un rango start/end en milisegundos para el día.
   */
  private async getActiveTasksToday(conn: any, taskIds: number[], start: number, end: number) {
    const placeholders = taskIds.map(() => '?').join(',');

    const res = await conn.query(
      `SELECT task_id
     FROM task_active
     WHERE start_date >= ?
       AND start_date < ?
       AND task_id IN (${placeholders})`,
      [start, end, ...taskIds],
    );

    const set = new Set<number>();

    for (const r of res.values ?? []) {
      set.add(Number((r as any).task_id));
    }

    return set;
  }

  /**
   * Devuelve un Set con los IDs de tareas que tienen un skip (usuario borró) en el rango dado.
   */
  private async getSkippedTasksToday(conn: any, taskIds: number[], start: number, end: number) {
    if (!taskIds.length) return new Set<number>();
    const placeholders = taskIds.map(() => '?').join(',');

    const res = await conn.query(
      `SELECT task_id FROM task_skips WHERE start_date >= ? AND start_date < ? AND task_id IN (${placeholders})`,
      [start, end, ...taskIds],
    );

    const set = new Set<number>();
    for (const r of res.values ?? []) set.add(Number((r as any).task_id));
    return set;
  }

  /**
   * Registra un skip (el usuario borró/omitió la instancia activa) y borra la fila de task_active en una transacción.
   */
  async skipTaskActiveById(
    taskActiveId: number,
    skippedAt: number,
    reason = 'user_deleted',
  ): Promise<void> {
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
      await this.generateNextRecurrence(conn, taskId, startDate);
    });
  }

  /**
   * Recupera las reglas de recurrencia semanal desde `weekly_recurrence` agrupadas por task_id.
   * Devuelve un Map donde la clave es task_id y el valor es el array de weekdays (0..6).
   */
  private async getWeeklyRecurrence(conn: any, taskIds: number[]) {
    const placeholders = taskIds.map(() => '?').join(',');

    const res = await conn.query(
      `SELECT task_id, weekday
     FROM weekly_recurrence
     WHERE task_id IN (${placeholders})`,
      taskIds,
    );

    const map = new Map<number, number[]>();

    for (const r of res.values ?? []) {
      const taskId = Number((r as any).task_id);
      const weekday = Number((r as any).weekday);

      const arr = map.get(taskId) ?? [];
      arr.push(weekday);
      map.set(taskId, arr);
    }

    return map;
  }

  /**
   * Obtiene la última fecha de completado por tarea desde `task_history`.
   * Devuelve un Map con task_id => timestamp de la última finalización.
   */
  private async getLastCompletions(conn: any, taskIds: number[]) {
    const placeholders = taskIds.map(() => '?').join(',');

    const res = await conn.query(
      `SELECT task_id, MAX(completed_at) AS last_completed
     FROM task_history
     WHERE task_id IN (${placeholders})
     GROUP BY task_id`,
      taskIds,
    );

    const map = new Map<number, number>();

    for (const r of res.values ?? []) {
      map.set(Number((r as any).task_id), Number((r as any).last_completed));
    }

    return map;
  }

  /**
   * Decide si una tarea recurrente debe crear una instancia hoy según frecuencia e historial.
   * Revisa casos diarios, semanales y mensuales usando las utilidades de fecha.
   */
  private shouldCreateTaskToday(
    task: { id: number; frequency: number; interval: number },
    lastCompleted: number | null,
    weekdays: number[],
    todayWeekday: number,
    today: number,
  ): boolean {
    switch (task.frequency) {
      case 1: // daily
        if (lastCompleted == null) return true;
        return daysBetween(lastCompleted, today) >= task.interval;

      case 2: // weekly
        if (weekdays.length && !weekdays.includes(todayWeekday)) return false;

        if (lastCompleted == null) return true;
        return weeksBetween(lastCompleted, today) >= task.interval;

      case 3: // monthly
        if (lastCompleted == null) return true;
        return monthsBetween(lastCompleted, today) >= task.interval;

      default:
        return false;
    }
  }

  /**
   * Inserta varias filas en `task_active` en un único batch.
   * Recibe una lista de taskIds y el rango start/end para las filas a crear.
   */
  private async insertActiveTasks(conn: any, taskIds: number[], start: number, end: number) {
    const placeholders = taskIds.map(() => '(?, ?, ?)').join(',');

    const params: any[] = [];

    for (const id of taskIds) {
      params.push(id, start, end);
    }

    await conn.run(
      `INSERT INTO task_active (task_id,start_date,end_date)
     VALUES ${placeholders}`,
      params,
    );
  }

  /**
   * Posponer una instancia en `task_active` sumando milisegundos a start_date y end_date.
   * Usado para la acción "+1 día" en el panel de acciones.
   */
  async postponeTaskActiveById(taskActiveId: number, ms: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(
        `UPDATE task_active SET end_date = end_date + ? WHERE id = ?`,
        [ms, taskActiveId],
      );
    });
  }

  /**
   * Actualiza start_date y end_date de una instancia en `task_active` por su id.
   * Usado para mover una tarea a "hoy".
   */
  async setTaskActiveDatesById(taskActiveId: number, start: number, end: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(`UPDATE task_active SET start_date = ?, end_date = ? WHERE id = ?`, [
        start,
        end,
        taskActiveId,
      ]);
    });
  }

  /**
   * Elimina una instancia de `task_active` por su id.
   */
  async deleteTaskActiveById(taskActiveId: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(`DELETE FROM task_active WHERE id = ?`, [taskActiveId]);
    });
  }

  /**
   * Marca una instancia activa como completada: inserta fila en task_history y elimina la fila en task_active.
   * Calcula days_late comparando end_date con completedAt.
   */
  async completeTaskActiveById(taskActiveId: number, completedAt: number): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(`SELECT task_id, start_date, end_date FROM task_active WHERE id = ?`, [
        taskActiveId,
      ]);
      const values = res.values || [];
      if (!values.length) throw new Error(`task_active with id ${taskActiveId} not found`);

      const r: any = values[0];
      const taskId = Number(r.task_id);
      const startDate = Number(r.start_date);
      const endDate = Number(r.end_date);

      const daysLate = Math.max(0, daysBetween(endDate, completedAt));

      const set = [
        {
          statement: `INSERT INTO task_history (task_id, completed_at, days_late) VALUES (?, ?, ?)`,
          values: [taskId, completedAt, daysLate],
        },
        {
          statement: `DELETE FROM task_active WHERE id = ?`,
          values: [taskActiveId],
        },
      ];

      await conn.executeSet(set, true);
      await this.generateNextRecurrence(conn, taskId, startDate);
    });
  }

  /**
   * Genera la siguiente recurrencia de una tarea en task_active comprobando los 365 días próximos
   * a partir del día siguiente al indicado. Optimizada para no hacer consultas dentro del bucle.
   */
  private async generateNextRecurrence(conn: any, taskId: number, afterDateMs: number): Promise<void> {
    // 1. Cargamos la configuración global de la tarea
    const resCount = await conn.query(`SELECT id, frequency, interval FROM task WHERE id = ? AND frequency != 0 AND deleted = 0`, [taskId]);
    if (!resCount.values?.length) return;
    
    const task = {
      id: Number(resCount.values[0].id),
      frequency: Number(resCount.values[0].frequency),
      interval: Number(resCount.values[0].interval),
    };

    // 2. Historial y días de la semana
    const rc = await conn.query(`SELECT MAX(completed_at) AS last_completed FROM task_history WHERE task_id = ?`, [taskId]);
    const lastCompleted = rc.values?.[0]?.last_completed ? Number(rc.values[0].last_completed) : null;

    const rw = await conn.query(`SELECT weekday FROM weekly_recurrence WHERE task_id = ?`, [taskId]);
    const weekdays = rw.values?.map((r: any) => Number(r.weekday)) ?? [];

    // 3. Definimos el rango de fechas (Hoy + 1 hasta Hoy + 366)
    let d = new Date(afterDateMs);
    d.setDate(d.getDate() + 1);
    d.setHours(0, 0, 0, 0);
    
    const startRangeMs = d.getTime();
    
    const endRangeDate = new Date(startRangeMs);
    endRangeDate.setDate(endRangeDate.getDate() + 365);
    const endRangeMs = endRangeDate.getTime();

    // 4. LA MAGIA: Traemos todas las instancias futuras y las saltadas de golpe a la memoria (Sets)
    const activeRes = await conn.query(
      `SELECT start_date FROM task_active WHERE task_id = ? AND start_date >= ? AND start_date < ?`, 
      [taskId, startRangeMs, endRangeMs]
    );
    const activeSet = new Set((activeRes.values || []).map((r: any) => Number(r.start_date)));

    const skipsRes = await conn.query(
      `SELECT start_date FROM task_skips WHERE task_id = ? AND start_date >= ? AND start_date < ?`, 
      [taskId, startRangeMs, endRangeMs]
    );
    const skipsSet = new Set((skipsRes.values || []).map((r: any) => Number(r.start_date)));

    // 5. Bucle puro en memoria (Pasa de tardar segundos a tardar milisegundos)
    for (let offset = 0; offset < 365; offset++) {
      const todayWeekday = d.getDay();
      const dMs = d.getTime();
      
      const shouldCreate = this.shouldCreateTaskToday(task, lastCompleted, weekdays, todayWeekday, dMs);
      
      if (shouldCreate) {
        // Si ya hay una tarea creada para este día, paramos (ya está cubierta)
        if (activeSet.has(dMs)) {
          break;
        }

        // Si el usuario ya la había borrado/saltado este día concreto, pasamos al siguiente día
        if (skipsSet.has(dMs)) {
          d.setDate(d.getDate() + 1);
          d.setHours(0, 0, 0, 0);
          continue;
        }

        // Si debe crearse, no está activa y no está cancelada, ¡la insertamos en BD y rompemos el bucle!
        const start = dMs;
        const end = start + DAY_MS - 1;
        await conn.run(`INSERT INTO task_active (task_id, start_date, end_date) VALUES (?, ?, ?)`, [taskId, start, end]);
        break;
      }
      
      d.setDate(d.getDate() + 1);
      d.setHours(0, 0, 0, 0);
    }
  }
}
