import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, ViewWillEnter, ViewWillLeave } from '@ionic/angular/standalone';
import { TaskComponent } from '@features/home-tab/components/task/task.component';
import { TaskActive } from '@core/models/task.model';
import { ActionPanelComponent } from '@features/home-tab/components/action-panel/action-panel.component';
import { UIService } from '@core/services/ui.service';
import { TaskService } from '@features/home-tab/services/task.service';
import { GemCounterComponent } from '@shared/components/gem-counter/gem-counter.component';
import { PlayerStateService } from '@core/services/player-state.service';
import { ItemAcquiredModalComponent } from '@shared/components/item-acquired-modal/item-acquired-modal.component';
import { ItemInventory } from '@core/models/item.model';
import { ItemService } from '@features/home-tab/services/item.service';

@Component({
  selector: 'app-home-tab',
  templateUrl: 'home-tab.component.html',
  styleUrls: ['home-tab.component.scss'],
  providers: [TaskService, ItemService],
  imports: [
    IonContent,
    TaskComponent,
    ActionPanelComponent,
    GemCounterComponent,
    ItemAcquiredModalComponent,
  ],
})
export class HomeTabComponent implements ViewWillEnter, ViewWillLeave {
  @ViewChild(IonContent) private content!: IonContent;

  private readonly uiService = inject(UIService);
  private readonly taskService = inject(TaskService);
  private readonly playerStateService = inject(PlayerStateService);
  private readonly itemService = inject(ItemService);

  playerGems = 0;

  isActionPanelVisible = false;
  selectedTask: TaskActive | null = null;

  todayTasks: TaskActive[] = [];
  otherTasks: TaskActive[] = [];

  loading = false;

  // Estado para mostrar el modal de item conseguido
  isItemAcquiredModalOpen = false;
  acquiredItem: ItemInventory | null = null;
  acquiredAmount = 1;

  async ionViewWillEnter(): Promise<void> {
    await this.taskService.createRecurringTasksForToday();

    await this.loadTasks();
    this.playerGems = await this.playerStateService.getCoins();
  }

  async loadTasks(): Promise<void> {
    this.loading = true;
    try {
      const { today, others } = await this.taskService.getTodayAndOtherTasks();
      this.todayTasks = today;
      this.otherTasks = others;
    } catch (e) {
      console.error('Error cargando tareas:', e);
    } finally {
      this.loading = false;
    }
  }

  ionViewWillLeave(): void {
    this.uiService.show();
  }

  isSelectedTaskToday = false;

  handleTaskClick(task: TaskActive, isTodayTask: boolean): void {
    this.uiService.hide();
    this.isActionPanelVisible = true;
    this.selectedTask = task;
    this.isSelectedTaskToday = isTodayTask;
    console.log(
      `Tarea seleccionada: ${task.name} (taskId: ${task.id}, activeId: ${task.taskActiveId}), Es tarea de hoy: ${isTodayTask}`,
    );
    this.scrollToTask(task.taskActiveId);
  }

  private async scrollToTask(taskId: number): Promise<void> {
    try {
      const el = document.getElementById('task-' + taskId);
      if (!el) return;

      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    } catch (e) {
      console.warn('Error al hacer scroll a la tarea:', e);
    }
  }

  actionPanelClosed(): void {
    // Mostrar los corner buttons al cerrar el panel de acciones
    this.uiService.show();

    // Ocultar el panel de acciones
    this.isActionPanelVisible = false;
    this.selectedTask = null;

    // Recargar tareas para reflejar cambios realizados desde el panel de acciones
    void this.loadTasks();
  }

  // Abre el modal de item conseguido
  showItemAcquired(item: ItemInventory, amount: number = 1) {
    this.acquiredItem = item;
    this.acquiredAmount = amount;
    this.isItemAcquiredModalOpen = true;
  }

  onAcquiredAcknowledged() {
    this.isItemAcquiredModalOpen = false;
    this.acquiredItem = null;
    this.acquiredAmount = 1;
  }

  // Handler cuando ActionPanel emite que se ha adquirido un item al completar la tarea
  async handleAcquired(task: TaskActive | null) {
    if (!task) return;

    // Delegamos al ItemService para determinar la reward (rareza/shiny), añadirla al inventario
    // y devolver la fila de inventario resultante.
    try {
      const item = await this.itemService.grantItemForCompletedTask(task);
      if (!item) return;

      // Mostrar modal con el item obtenido
      this.showItemAcquired(item, 1);
    } catch (e) {
      console.error('Error al otorgar item por completar tarea:', e);
    }
  }
}
