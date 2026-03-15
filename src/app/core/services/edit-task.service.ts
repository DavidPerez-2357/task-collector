import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TaskActive } from '@core/models/task.model';
import { TaskRepository } from '@core/repositories/task.repository';
import { CreateTaskService, CreateTaskInput } from '@core/services/create-task.service';

export type EditMode = 'global' | 'instance';

export interface EditRequest {
  task: TaskActive;
  mode: EditMode;
}

@Injectable({
  providedIn: 'root',
})
export class EditTaskService {
  private taskRepository = inject(TaskRepository);
  private createTaskService = inject(CreateTaskService);

  /** Emite la tarea que se quiere editar y el modo. */
  public editRequested$ = new Subject<EditRequest>();

  requestEdit(task: TaskActive, mode: EditMode = 'global'): void {
    this.editRequested$.next({ task, mode });
  }

  async updateTask(taskId: number, activeTaskId: number, data: CreateTaskInput): Promise<void> {
    await this.taskRepository.updateTask(taskId, activeTaskId, data);
    this.createTaskService.taskCreated$.next();
  }

  async updateTaskInstance(activeTaskId: number, dueDate?: string): Promise<void> {
    await this.taskRepository.updateTaskInstance(activeTaskId, dueDate);
    this.createTaskService.taskCreated$.next();
  }

  async deleteGlobalTask(taskId: number): Promise<void> {
    await this.taskRepository.deleteGlobalTask(taskId);
    this.createTaskService.taskCreated$.next();
  }
}
