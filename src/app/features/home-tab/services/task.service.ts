import { inject, Injectable } from '@angular/core';
import { TaskRepository } from '@core/repositories/task.repository';
import { TaskActive } from '@core/models/task.model';
import { DAY_MS } from '@core/utils/date.util';

@Injectable({
  providedIn: 'root',
})
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
    const endOfToday = startOfToday + DAY_MS;

    const today: TaskActive[] = [];
    const others: TaskActive[] = [];

    for (const task of tasks) {
      if (task.endDate >= startOfToday && task.endDate <= endOfToday) {
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
}
