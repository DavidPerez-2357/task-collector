import { inject, Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { TaskActive } from '@core/models/task.model';
import { TaskRepository } from '@core/repositories/task.repository';
import { CreateTaskInput } from '@core/services/create-task.service';
import { CreateTaskService } from '@core/services/create-task.service';

@Injectable({
  providedIn: 'root',
})
export class EditTaskService {
  private taskRepository = inject(TaskRepository);
  private createTaskService = inject(CreateTaskService);

  /** Emite la tarea que se quiere editar. TabsPage escucha y abre el modal. */
  public editRequested$ = new Subject<TaskActive>();

  requestEdit(task: TaskActive): void {
    this.editRequested$.next(task);
  }

  async updateTask(taskId: number, activeTaskId: number, data: CreateTaskInput): Promise<void> {
    await this.taskRepository.updateTask(taskId, activeTaskId, data);
    // Reutilizamos el mismo Subject para recargar el home tab
    this.createTaskService.taskCreated$.next();
  }
}
