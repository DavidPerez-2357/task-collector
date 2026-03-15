import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TaskRepository } from '@core/repositories/task.repository';
import { Task } from '@core/models/task.model';

export type CreateTaskInput = Omit<Task, 'id'> & { dueDate?: string; weekdays?: number[] };

@Injectable({
  providedIn: 'root',
})
export class CreateTaskService {
  private taskRepository = inject(TaskRepository);

  public taskCreated$ = new Subject<void>();

  async createTask(task: Omit<Task, 'id'> & { dueDate?: string; weekdays?: number[] }): Promise<void> {
    await this.taskRepository.createTask(task);
    this.taskCreated$.next();
  }
}
