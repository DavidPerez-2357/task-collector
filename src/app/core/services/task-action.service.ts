import { Injectable, inject } from '@angular/core';
import { TaskRepository } from '@core/repositories/task.repository';
import { TaskRecurrenceService } from './task-recurrence.service';

@Injectable({
  providedIn: 'root'
})
export class TaskActionService {
  private taskRepository = inject(TaskRepository);
  private taskRecurrenceService = inject(TaskRecurrenceService);

  /**
   * Completa una tarea, la guarda en el historial y orquesta la creación de la siguiente.
   */
  async completeTask(activeTaskId: number, completedAt: number = Date.now()): Promise<void> {
    // 1. El Almacenero hace la transacción en BD y nos devuelve los datos
    const { taskId, endDate } = await this.taskRepository.completeTaskActiveById(activeTaskId, completedAt);
    
    // 2. El Cerebro proyecta el futuro basándose en la Fecha Límite (Magia Mensual)
    await this.taskRecurrenceService.generateNextInstances(taskId, endDate);
  }

  /**
   * Salta una tarea (skip), la borra de la pantalla y orquesta la creación de la siguiente.
   */
  async skipTask(activeTaskId: number, skippedAt: number = Date.now(), reason: string = 'user_deleted'): Promise<void> {
    // 1. El Almacenero borra la tarea, guarda el salto y nos devuelve los datos
    const { taskId, startDate } = await this.taskRepository.skipTaskActiveById(activeTaskId, skippedAt, reason);
    
    // 2. El Cerebro proyecta el futuro basándose en el inicio de la que hemos saltado
    await this.taskRecurrenceService.generateNextInstances(taskId, startDate);
  }

  /**
   * Pospone una tarea activa sumándole un tiempo determinado (ej. +1 día).
   */
  async postponeTask(activeTaskId: number, msToPostpone: number): Promise<void> {
    // Posponer no requiere recalcular toda la cadena futura, solo mueve la instancia viva actual.
    await this.taskRepository.postponeTaskActiveById(activeTaskId, msToPostpone);
  }
}