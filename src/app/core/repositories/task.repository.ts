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
   * No devuelve valor, lanza si hay error durante la inserción.
   */
  async createTask(task: Omit<Task, 'id'>): Promise<void> {
    return await this.databaseService.withConn(async (conn) => {
      await conn.run(
        `
        INSERT INTO task (name, frequency, interval, effort, category_id)
        VALUES (?, ?, ?, ?, ?)
      `,
        [task.name, task.frequency, task.interval, task.effort, task.category.id],
      );
    });
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
    const end = start + DAY_MS;

    await this.databaseService.withConn(async (conn) => {
      const tasks = await this.getRecurringTasks(conn);
      if (!tasks.length) return;

      const taskIds = tasks.map((t) => t.id);

      const [lastCompletedByTask, activeToday, weekdaysByTask] = await Promise.all([
        this.getLastCompletions(conn, taskIds),
        this.getActiveTasksToday(conn, taskIds, start, end),
        this.getWeeklyRecurrence(conn, taskIds),
      ]);

      const todayWeekday = new Date(start).getDay();

      const tasksToCreate = tasks
        .filter((t) => !activeToday.has(t.id))
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
}
