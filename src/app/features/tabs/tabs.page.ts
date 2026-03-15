import { Component, DestroyRef, EnvironmentInjector, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { RouterLink } from '@angular/router';
import { CreateTaskModalComponent } from '@shared/components/create-task-modal/create-task-modal.component';
import { UIService } from '@core/services/ui.service';
import { EditTaskService } from '@core/services/edit-task.service';
import { TaskActive } from '@core/models/task.model';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, RouterLink, CreateTaskModalComponent],
})
export class TabsPage implements OnInit {
  public environmentInjector = inject(EnvironmentInjector);
  public ui = inject(UIService);
  private editTaskService = inject(EditTaskService);
  private destroyRef = inject(DestroyRef);

  public isConfigOpen = false;
  public isCreateModalOpen = false;
  public taskToEdit: TaskActive | null = null;
  public editMode: 'global' | 'instance' = 'global';

  ngOnInit(): void {
    this.editTaskService.editRequested$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((request) => {
        this.taskToEdit = request.task;
        this.editMode = request.mode;
        this.isCreateModalOpen = true;
      });
  }

  onModalDismissed(): void {
    this.isCreateModalOpen = false;
    this.taskToEdit = null;
  }
}
