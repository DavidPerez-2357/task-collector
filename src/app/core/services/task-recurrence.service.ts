import { Injectable, inject } from '@angular/core';
import { TaskRepository } from '@core/repositories/task.repository';
import { DAY_MS, daysBetween, getStartOfDayMs, monthsBetween } from '@core/utils/date.util';

@Injectable({
  providedIn: 'root'
})
export class TaskRecurrenceService {
  private taskRepository = inject(TaskRepository);

  /**
   * EL CRON JOB DIARIO
   */
  async executeDailyCronJob(): Promise<void> {
    const todayStr = new Date().toDateString();
    
    // 1. GATEKEEPER 100% BASE DE DATOS (Adiós LocalStorage)
    const lastRun = await this.taskRepository.getLastCronRunDate();
    if (lastRun === todayStr) {
      return; // El Cron ya corrió hoy, abortamos inmediatamente.
    }

    const start = getStartOfDayMs(Date.now());
    const end = start + DAY_MS - 1;

    // 2. Pedimos los datos "tontos" al repositorio
    const tasks = await this.taskRepository.getGlobalRecurringTasks();
    if (!tasks.length) {
      // Si no hay tareas, guardamos que el cron corrió hoy y salimos
      await this.taskRepository.updateLastCronRunDate(todayStr);
      return;
    }

    const taskIds = tasks.map(t => t.id);

    // Pedimos mapas de estado en paralelo para máxima velocidad
    const [lastCompletions, activeToday, weeklyRecurrences, skippedToday] = await Promise.all([
      this.taskRepository.getLastCompletionsDueDateMap(taskIds), 
      this.taskRepository.getActiveTasksTodaySet(taskIds, start, end),
      this.taskRepository.getWeeklyRecurrenceMap(taskIds),
      this.taskRepository.getSkippedTasksTodaySet(taskIds, start, end)
    ]);

    const todayWeekday = new Date(start).getDay();

    // 3. El Cerebro evalúa qué tareas merecen nacer hoy
    const tasksToCreate = tasks
      .filter(t => !activeToday.has(t.id)) 
      .filter(t => !skippedToday.has(t.id)) 
      .filter(t => this.evaluateTaskForToday(
        t,
        lastCompletions.get(t.id) ?? null,
        weeklyRecurrences.get(t.id) ?? [],
        todayWeekday,
        start
      ))
      .map(t => t.id);

    // 4. Ordenamos al repositorio guardar las elegidas
    if (tasksToCreate.length > 0) {
      await this.taskRepository.insertActiveTasksBatch(tasksToCreate, start, end);
    }

    // 5. Sellamos el Cron por hoy en la Base de Datos
    await this.taskRepository.updateLastCronRunDate(todayStr);
  }

  /**
   * EL PROYECTOR DE FUTURO
   */
  async generateNextInstances(taskId: number, afterDateMs: number): Promise<void> {
    const task = await this.taskRepository.getTaskDefinition(taskId);
    if (!task || task.frequency === 0) return;

    // Pediremos la fecha límite de la última completada
    const lastCompleted = await this.taskRepository.getLastCompletedDueDate(taskId);
    const weekdays = await this.taskRepository.getTaskWeekdays(taskId);

    let d = new Date(getStartOfDayMs(afterDateMs) + DAY_MS);
    const startRangeMs = d.getTime();
    const endRangeMs = startRangeMs + (365 * DAY_MS); 

    const activeSet = await this.taskRepository.getActiveTaskDatesSet(taskId, startRangeMs, endRangeMs);
    const skipsSet = await this.taskRepository.getSkippedTaskDatesSet(taskId, startRangeMs, endRangeMs);

    for (let offset = 0; offset < 365; offset++) {
      const todayWeekday = d.getDay();
      const dMs = d.getTime();

      const shouldCreate = this.evaluateTaskForToday(task, lastCompleted, weekdays, todayWeekday, dMs);

      if (shouldCreate) {
        if (activeSet.has(dMs)) break; 
        
        if (skipsSet.has(dMs)) {
          d.setTime(d.getTime() + DAY_MS);
          continue; 
        }

        const end = dMs + DAY_MS - 1;
        await this.taskRepository.insertActiveTaskSingle(taskId, dMs, end);
        break;
      }

      d.setTime(d.getTime() + DAY_MS);
    }
  }

  /**
   * EL MOTOR MATEMÁTICO (Aislado y Limpio)
   */
  private evaluateTaskForToday(
    task: any,
    lastCompletedDueDateMs: number | null,
    weekdays: number[],
    todayWeekday: number,
    todayMs: number
  ): boolean {
    
    // --- DIARIA ---
    if (task.frequency === 1) { 
      if (!lastCompletedDueDateMs) return true;
      return daysBetween(lastCompletedDueDateMs, todayMs) >= task.interval;
    }

    // --- SEMANAL ---
    if (task.frequency === 2) { 
      if (weekdays.length > 0 && !weekdays.includes(todayWeekday)) return false;
      if (!lastCompletedDueDateMs) return true;

      const getStartOfWeek = (ts: number) => {
        const date = new Date(ts);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(date.setDate(diff)).setHours(0, 0, 0, 0);
      };

      const lastWeekStart = getStartOfWeek(lastCompletedDueDateMs);
      const thisWeekStart = getStartOfWeek(todayMs);
      const calendarWeeksDiff = Math.round((thisWeekStart - lastWeekStart) / (7 * DAY_MS));

      if (calendarWeeksDiff === 0) {
        if (daysBetween(lastCompletedDueDateMs, todayMs) === 0) return false;
        return true; 
      }

      return calendarWeeksDiff >= task.interval;
    }

    // --- MENSUAL ---
    if (task.frequency === 3) { 
      if (!task.anchorDate) return false; 
      
      const currentD = new Date(todayMs);
      const anchorD = new Date(task.anchorDate);
      
      const lastDayOfCurrentMonth = new Date(currentD.getFullYear(), currentD.getMonth() + 1, 0).getDate();
      const expectedDay = Math.min(anchorD.getDate(), lastDayOfCurrentMonth);

      // 1. ¿Toca crearla hoy según el calendario?
      if (currentD.getDate() !== expectedDay) return false;
      
      if (!lastCompletedDueDateMs) return true;

      // 2. ¡La Magia! Como lastCompletedDueDateMs es la FECHA LÍMITE del último ciclo que completaste
      const diff = monthsBetween(lastCompletedDueDateMs, todayMs);
      
      return diff >= task.interval;
    }

    return false;
  }
}