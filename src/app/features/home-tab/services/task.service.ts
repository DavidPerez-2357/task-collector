import { inject, Injectable } from '@angular/core';
import { TaskRepository } from '@core/repositories/task.repository';
import { TaskActive } from '@core/models/task.model';
import { DAY_MS } from '@core/utils/date.util';

@Injectable()
export class TaskService {
  private taskRepository = inject(TaskRepository);

  async getActiveTasks(): Promise<TaskActive[]> {
    return await this.taskRepository.getActiveTasks();
  }

  /**
   * Separa las tareas activas en las de hoy y las que no.
   */
  async getTodayAndOtherTasks(): Promise<{ today: TaskActive[]; others: TaskActive[] }> {
    const tasks = await this.getActiveTasks();

    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const startOfNextDay = startOfToday + DAY_MS;

    const today: TaskActive[] = [];
    const others: TaskActive[] = [];

    for (const task of tasks) {
      if (task.endDate >= startOfToday && task.endDate < startOfNextDay) {
        today.push(task);
      } else {
        others.push(task);
      }
    }

    return { today, others };
  }

  async checkIfRecurringTasksWereCreatedToday(): Promise<boolean> {
    return await this.taskRepository.checkIfRecurringTasksWereCreatedToday();
  }

  async createRecurringTasksForToday(): Promise<void> {
    return await this.taskRepository.createRecurringTasksForToday();
  }

  /**
   * Pospone una instancia activa de tarea sumando ms a start_date y end_date.
   */
  async postponeTaskById(taskActiveId: number, ms: number): Promise<void> {
    return await this.taskRepository.postponeTaskActiveById(taskActiveId, ms);
  }

  /**
   * Establece start_date y end_date de una instancia activa por id.
   * Usado para la acción "Hacer hoy".
   */
  async setTaskActiveDatesById(taskActiveId: number, start: number, end: number): Promise<void> {
    return await this.taskRepository.setTaskActiveDatesById(taskActiveId, start, end);
  }

  /**
   * Elimina una instancia activa de tarea por su id.
   */
  async deleteTaskActiveById(taskActiveId: number): Promise<void> {
    return await this.taskRepository.deleteTaskActiveById(taskActiveId);
  }

  /**
   * Marca una instancia activa como completada (mueve a historial).
   */
  async completeTaskActiveById(taskActiveId: number, completedAt: number): Promise<void> {
    return await this.taskRepository.completeTaskActiveById(taskActiveId, completedAt);
  }

  /**
   * Registra un skip (usuario eliminó la instancia) y borra la instancia en una transacción.
   */
  async skipTaskActiveById(
    taskActiveId: number,
    skippedAt: number,
    reason = 'user_deleted',
  ): Promise<void> {
    return await this.taskRepository.skipTaskActiveById(taskActiveId, skippedAt, reason);
  }
}
