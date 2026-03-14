import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { BoardComponent } from '@shared/components/board/board.component';
import { TaskActive } from '@core/models/task.model';
import { IonIcon } from '@ionic/angular/standalone';
import { ButtonComponent } from '@shared/components/button/button.component';
import { addIcons } from 'ionicons';
import { EditTaskService } from '@core/services/edit-task.service';
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

@Component({
  selector: 'app-action-panel',
  templateUrl: './action-panel.component.html',
  styleUrls: ['./action-panel.component.scss'],
  imports: [BoardComponent, IonIcon, ButtonComponent],
})
export class ActionPanelComponent {
  @Input() isOpen = false;
  @Input() selectedTask: TaskActive | null = null;
  @Input() isTodayTask = false;

  private editTaskService = inject(EditTaskService);

  @Output() didClose = new EventEmitter<void>();

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
    console.log(
      `End date: ${endDate}, Start of today - 1 day: ${new Date(getStartOfToday() - DAY_MS)}`,
    );
    return endDate.getTime() >= getStartOfToday() + DAY_MS;
  }

  protected closePanel(): void {
    this.isOpen = false;
    this.didClose.emit();
  }

  protected completeTask(): void {
    // TODO
  }

  protected editTask(): void {
    if (!this.selectedTask) return;
    this.editTaskService.requestEdit(this.selectedTask);
    this.closePanel();
  }

  protected deleteTask(): void {
    // TODO
  }

  protected postponeTask(): void {
    // TODO
  }

  protected doToday(): void {
    // TODO
  }

  protected duplicateTask(): void {
    // TODO
  }

  protected toggleFavorite(): void {
    // TODO
  }
}
