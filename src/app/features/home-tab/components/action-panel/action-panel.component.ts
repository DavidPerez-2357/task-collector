import { Component, EventEmitter, Input, Output, inject } from '@angular/core';
import { BoardComponent } from '@shared/components/board/board.component';
import { TaskActive } from '@core/models/task.model';
import { IonIcon } from '@ionic/angular/standalone';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { addIcons } from 'ionicons';
import {
  checkmarkCircleOutline,
  createOutline,
  trashOutline,
  calendarOutline,
  sunnyOutline,
  arrowForwardOutline,
  repeatOutline,
  starOutline,
  closeOutline,
  closeCircleOutline,
} from 'ionicons/icons';
import { DAY_MS, getStartOfToday } from '@core/utils/date.util';
import { TaskService } from '@features/home-tab/services/task.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-action-panel',
  templateUrl: './action-panel.component.html',
  styleUrls: ['./action-panel.component.scss'],
  imports: [BoardComponent, IonIcon, ButtonComponent, ConfirmModalComponent],
})
export class ActionPanelComponent {
  @Input() isOpen = false;
  @Input() selectedTask: TaskActive | null = null;
  @Input() isTodayTask = false;

  @Output() didClose = new EventEmitter<void>();
  @Output() acquired = new EventEmitter<TaskActive | null>();

  private taskService = inject(TaskService);
  private toast = inject(ToastService);

  // Indicador para deshabilitar botones mientras hay una operación en curso
  isBusy = false;

  // Estado para mostrar el modal de confirmación
  confirmDeleteOpen = false;

  constructor() {
    addIcons({
      checkmarkCircleOutline,
      createOutline,
      trashOutline,
      calendarOutline,
      sunnyOutline,
      arrowForwardOutline,
      repeatOutline,
      starOutline,
      closeOutline,
      closeCircleOutline,
    });
  }

  get canPostpone(): boolean {
    if (!this.selectedTask) return false;
    const endDate = new Date(this.selectedTask.endDate);
    endDate.setHours(0, 0, 0, 0);
    return endDate.getTime() >= getStartOfToday() + DAY_MS;
  }

  protected closePanel(): void {
    this.isOpen = false;
    this.didClose.emit();
  }

  protected async completeTask(): Promise<void> {
    if (!this.selectedTask || this.isBusy) return;

    this.isBusy = true;
    try {
      const completedAt = Date.now();
      await this.taskService.completeTaskActiveById(this.selectedTask.taskActiveId, completedAt);

      await this.toast.success('Tarea completada');

      // Emitir evento para que el padre muestre el modal del item adquirido
      // TODO: la lógica para elegir exactamente qué item dar al completar la tarea
      // debe implementarse en el padre (HomeTab) o en un servicio dedicado.
      this.acquired.emit(this.selectedTask);

      this.closePanel();
    } catch (e) {
      console.error('Error al completar la tarea:', e);
      await this.toast.error('Error al completar la tarea');
    } finally {
      this.isBusy = false;
    }
  }

  protected editTask(): void {
    // TODO
  }

  // deleteActiveTask implemented below as async

  protected async postponeTask(): Promise<void> {
    if (!this.selectedTask || this.isBusy) return;

    this.isBusy = true;
    try {
      await this.taskService.postponeTaskById(this.selectedTask.taskActiveId, DAY_MS);

      await this.toast.success('Tarea pospuesta +1 día');

      this.closePanel();
    } catch (e) {
      console.error('Error al posponer la tarea:', e);
      await this.toast.error('Error al posponer la tarea');
    } finally {
      this.isBusy = false;
    }
  }

  protected async doToday(): Promise<void> {
    if (!this.selectedTask || this.isBusy) return;

    const start = getStartOfToday();
    const end = start + DAY_MS;

    this.isBusy = true;
    try {
      await this.taskService.setTaskActiveDatesById(this.selectedTask.taskActiveId, start, end);

      await this.toast.success('Tarea movida a hoy');

      this.closePanel();
    } catch (e) {
      console.error('Error al mover la tarea a hoy:', e);
      await this.toast.error('Error al mover la tarea a hoy');
    } finally {
      this.isBusy = false;
    }
  }

  protected async deleteActiveTask(): Promise<void> {
    if (!this.selectedTask || this.isBusy) return;

    this.isBusy = true;
    try {
      // Para evitar que la tarea recurrente sea recreada al recargar,
      // registramos un 'skip' y borramos la instancia en la base de datos.
      const skippedAt = Date.now();
      await this.taskService.skipTaskActiveById(this.selectedTask.taskActiveId, skippedAt);

      await this.toast.success('Tarea eliminada');

      this.closePanel();
    } catch (e) {
      console.error('Error al eliminar la tarea activa:', e);
      await this.toast.error('Error al eliminar la tarea');
    } finally {
      this.isBusy = false;
    }
  }

  protected async onDeleteConfirmed(confirmed: boolean): Promise<void> {
    this.confirmDeleteOpen = false;
    if (confirmed) {
      await this.deleteActiveTask();
    }
  }
}
