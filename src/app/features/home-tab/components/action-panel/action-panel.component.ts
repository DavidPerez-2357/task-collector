import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BoardComponent } from '@shared/components/board/board.component';
import { TaskActive } from '@core/models/task.model';
import { IonIcon } from '@ionic/angular/standalone';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ConfirmModalComponent } from '@shared/components/confirm-modal/confirm-modal.component';
import { EditTaskService } from '@core/services/edit-task.service';
import { DAY_MS, getStartOfToday } from '@core/utils/date.util';
import { AsyncActionGuard } from '@core/utils/async-action-guard.util';
import { TaskService } from '@features/home-tab/services/task.service';
import { ToastService } from '@core/services/toast.service';
import { AudioService } from '@core/services/audio.service';
import { ErrorService } from '@core/services/error.service';

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

  private editTaskService = inject(EditTaskService);

  @Output() didClose = new EventEmitter<boolean>();
  @Output() acquired = new EventEmitter<TaskActive | null>();

  private taskService = inject(TaskService);
  private toast = inject(ToastService);
  private errorService = inject(ErrorService);
  private audioService = inject(AudioService);

  // Guards async actions against concurrent execution
  readonly guard = new AsyncActionGuard();

  // Estado para mostrar el modal de confirmación
  confirmDeleteOpen = false;
  confirmDeleteGlobalOpen = false;

  get canPostpone(): boolean {
    if (!this.selectedTask) return false;
    const endDate = new Date(this.selectedTask.endDate);
    endDate.setHours(0, 0, 0, 0);
    // Permitir posponer si la tarea es para hoy o el futuro
    return endDate.getTime() >= getStartOfToday();
  }

  protected closePanel(changed: boolean = false): void {
    this.isOpen = false;
    this.didClose.emit(changed);
  }

  protected async completeTask(): Promise<void> {
    if (!this.selectedTask) return;
    await this.guard.run(async () => {
      try {
        const completedAt = Date.now();
        await this.taskService.completeTaskActiveById(this.selectedTask!.taskActiveId, completedAt);
        await this.audioService.playCompletedTask();

        await this.toast.success('Tarea completada');

        // Emitir evento para que el padre muestre el modal del item adquirido
        // TODO: la lógica para elegir exactamente qué item dar al completar la tarea
        // debe implementarse en el padre (HomeTab) o en un servicio dedicado.
        this.acquired.emit(this.selectedTask);

        this.closePanel(true);
      } catch (e) {
        console.error('Error al completar la tarea:', e);
        this.errorService.show('Error al completar la tarea');
      }
    });
  }

  protected editInstance(): void {
    if (!this.selectedTask) return;
    this.editTaskService.requestEdit(this.selectedTask, 'instance');
    this.closePanel(false);
  }

  protected editGlobal(): void {
    if (!this.selectedTask) return;
    this.editTaskService.requestEdit(this.selectedTask, 'global');
    this.closePanel(false);
  }

  // deleteActiveTask implemented below as async

  protected async postponeTask(): Promise<void> {
    if (!this.selectedTask) return;
    await this.guard.run(async () => {
      try {
        await this.taskService.postponeTaskById(this.selectedTask!.taskActiveId, DAY_MS);

        await this.toast.success('Tarea pospuesta +1 día');

        this.closePanel(true);
      } catch (e) {
        console.error('Error al posponer la tarea:', e);
        this.errorService.show('Error al posponer la tarea');
      }
    });
  }

  protected async doToday(): Promise<void> {
    if (!this.selectedTask) return;

    const start = getStartOfToday();
    const end = start + DAY_MS - 1; // Hoy a las 23:59:59.999

    await this.guard.run(async () => {
      try {
        await this.taskService.setTaskActiveDatesById(this.selectedTask!.taskActiveId, start, end);

        await this.toast.success('Tarea movida a hoy');

        this.closePanel(true);
      } catch (e) {
        console.error('Error al mover la tarea a hoy:', e);
        this.errorService.show('Error al mover la tarea a hoy');
      }
    });
  }

  protected async deleteActiveTask(): Promise<void> {
    if (!this.selectedTask) return;
    await this.guard.run(async () => {
      try {
        // Para evitar que la tarea recurrente sea recreada al recargar,
        // registramos un 'skip' y borramos la instancia en la base de datos.
        const skippedAt = Date.now();
        await this.taskService.skipTaskActiveById(this.selectedTask!.taskActiveId, skippedAt);
        await this.audioService.playRemoveTask();

        await this.toast.success('Tarea eliminada');

        this.closePanel(true);
      } catch (e) {
        console.error('Error al eliminar la tarea activa:', e);
        this.errorService.show('Error al eliminar la tarea');
      }
    });
  }

  protected async deleteGlobalTask(): Promise<void> {
    if (!this.selectedTask) return;
    await this.guard.run(async () => {
      try {
        await this.editTaskService.deleteGlobalTask(this.selectedTask!.id);
        await this.audioService.playRemoveTask();
        await this.toast.success('Tarea eliminada globalmente');
        this.closePanel(true);
      } catch (e) {
        console.error('Error al eliminar la tarea global:', e);
        this.errorService.show('Error al eliminar la tarea global');
      }
    });
  }

  protected async onDeleteConfirmed(confirmed: boolean): Promise<void> {
    this.confirmDeleteOpen = false;
    if (confirmed) {
      await this.deleteActiveTask();
    }
  }

  protected async onDeleteGlobalConfirmed(confirmed: boolean): Promise<void> {
    this.confirmDeleteGlobalOpen = false;
    if (confirmed) {
      await this.deleteGlobalTask();
    }
  }
}
