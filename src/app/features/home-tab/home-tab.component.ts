import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, ViewWillEnter, ViewWillLeave } from '@ionic/angular/standalone';
import { TaskComponent } from '@features/home-tab/components/task/task.component';
import { TaskActive } from '@core/models/task.model';
import { ActionPanelComponent } from '@features/home-tab/components/action-panel/action-panel.component';
import { UIService } from '@core/services/ui.service';
import { TaskService } from '@features/home-tab/services/task.service';
import { DevToolsService } from '@core/services/dev-tools.service';
import { GemCounterComponent } from '@shared/components/gem-counter/gem-counter.component';
import { PlayerStateService } from '@core/services/player-state.service';

@Component({
  selector: 'app-home-tab',
  templateUrl: 'home-tab.component.html',
  styleUrls: ['home-tab.component.scss'],
  imports: [IonContent, TaskComponent, ActionPanelComponent, GemCounterComponent],
})
export class HomeTabComponent implements ViewWillEnter, ViewWillLeave {
  @ViewChild(IonContent) private content!: IonContent;

  private readonly uiService = inject(UIService);
  private readonly taskService = inject(TaskService);
  private readonly devToolsService = inject(DevToolsService);
  private readonly playerStateService = inject(PlayerStateService);

  playerGems = 0;

  isActionPanelVisible = false;
  selectedTask: TaskActive | null = null;

  todayTasks: TaskActive[] = [];
  otherTasks: TaskActive[] = [];

  loading = false;

  async ionViewWillEnter(): Promise<void> {
    // await this.devToolsService.createTestCategories();
    // await this.devToolsService.createTestTasks();
    await this.taskService.createRecurringTasksForToday();

    await this.loadTasks();
    this.playerGems = await this.playerStateService.getCoins();
  }

  async loadTasks(): Promise<void> {
    this.loading = true;
    try {
      const { today, others } = await this.taskService.getTodayAndOtherTasks();
      console.log(`Tareas de hoy: ${today.length}, Otras tareas: ${others.length}`);
      console.table(others);
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
      `Tarea seleccionada: ${task.name} (ID: ${task.id}), Es tarea de hoy: ${isTodayTask}`,
    );
    this.scrollToTask(task.id);
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
  }
}
