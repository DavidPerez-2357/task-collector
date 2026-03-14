import { Component, inject, ViewChild, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonContent, ViewWillEnter, ViewWillLeave } from '@ionic/angular/standalone';
import { TaskComponent } from '@features/home-tab/components/task/task.component';
import { TaskActive } from '@core/models/task.model';
import { ActionPanelComponent } from '@features/home-tab/components/action-panel/action-panel.component';
import { UIService } from '@core/services/ui.service';
import { TaskService } from '@features/home-tab/services/task.service';
import { CreateTaskService } from '@core/services/create-task.service'; // Añadido
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
  private readonly createTaskService = inject(CreateTaskService); // Añadido
  private readonly devToolsService = inject(DevToolsService);
  private readonly playerStateService = inject(PlayerStateService);
  private readonly destroyRef = inject(DestroyRef); // Añadido

  playerGems = 0;
  isActionPanelVisible = false;
  selectedTask: TaskActive | null = null;
  todayTasks: TaskActive[] = [];
  otherTasks: TaskActive[] = [];
  loading = false;
  isSelectedTaskToday = false;

  constructor() {
    // ¡Escuchamos al servicio global! Si se crea una tarea, recargamos automáticamente
    this.createTaskService.taskCreated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(() => {
      this.loadTasks(); 
    });
  }

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

  handleTaskClick(task: TaskActive, isTodayTask: boolean): void {
    this.uiService.hide();
    this.isActionPanelVisible = true;
    this.selectedTask = task;
    this.isSelectedTaskToday = isTodayTask;
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
    this.uiService.show();
    this.isActionPanelVisible = false;
    this.selectedTask = null;
  }
}