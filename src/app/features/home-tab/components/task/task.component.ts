import { Component, EventEmitter, HostBinding, Input, Output } from '@angular/core';
import { TaskActive } from '@core/models/task.model';
import { DAY_MS, getStartOfToday } from '@core/utils/date.util';

@Component({
  selector: 'app-task',
  templateUrl: './task.component.html',
  styleUrls: ['./task.component.scss'],
})
export class TaskComponent {
  @Input({ required: true }) task!: TaskActive;
  @HostBinding('class.selected') @Input() isSelected = false;
  @Output() handleTaskClick = new EventEmitter<TaskActive>();

  get diffEndDateWithToday(): number {
    // Restamos un día para que el conteo sea más intuitivo
    const diffTime = this.task.endDate - getStartOfToday() - DAY_MS;
    return Math.ceil(diffTime / DAY_MS);
  }

  get relativeDueDate(): string {
    const diffDays = this.diffEndDateWithToday;

    if (diffDays > 0) {
      return `En ${diffDays} día${diffDays > 1 ? 's' : ''}`;
    } else if (diffDays < 0) {
      return `Hace ${Math.abs(diffDays)} día${Math.abs(diffDays) > 1 ? 's' : ''}`;
    } else {
      return 'Hoy';
    }
  }

  get dueDateColor(): string {
    const diffDays = this.diffEndDateWithToday;

    if (diffDays < 0) {
      return 'var(--ion-color-danger-tint)';
    }

    if (diffDays === 0) {
      return 'var(--ion-color-warning)';
    }

    return 'var(--ion-color-secondary)';
  }
}
