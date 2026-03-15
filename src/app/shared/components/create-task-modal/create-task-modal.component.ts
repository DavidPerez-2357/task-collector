import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnInit,
  OnChanges,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonModal, ToastController } from '@ionic/angular/standalone';
import { BoardComponent } from '../board/board.component';
import { ButtonComponent } from '../button/button.component';
import { Task, TaskActive, TaskEffort, TaskFrequency } from '@core/models/task.model';
import { Category } from '@core/models/category.model';
import { CategoryService } from '@core/services/category.service';
import { CreateTaskService, CreateTaskInput } from '@core/services/create-task.service';
import { EditTaskService } from '@core/services/edit-task.service';

@Component({
  selector: 'app-create-task-modal',
  templateUrl: './create-task-modal.component.html',
  styleUrls: ['./create-task-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent, FormsModule],
})
export class CreateTaskModalComponent implements OnInit, OnChanges {
  @Input() isOpen: boolean = false;
  @Input() taskToEdit: TaskActive | null = null;
  @Input() editMode: 'global' | 'instance' = 'global';
  @Output() dismissed = new EventEmitter<void>();
  readonly TaskFrequency = TaskFrequency;

  private categoryService = inject(CategoryService);
  private createTaskService = inject(CreateTaskService);
  private editTaskService = inject(EditTaskService);
  private toastController = inject(ToastController);

  categories: Category[] = [];
  frequencies = [
    { value: TaskFrequency.No_repeat, label: 'Una sola vez' },
    { value: TaskFrequency.Daily, label: 'Diaria' },
    { value: TaskFrequency.Weekly, label: 'Semanal' },
    { value: TaskFrequency.Monthly, label: 'Mensual' },
  ];
  efforts = [
    { value: TaskEffort.Very_low, label: 'Muy Bajo' },
    { value: TaskEffort.Low, label: 'Bajo' },
    { value: TaskEffort.Medium, label: 'Medio' },
    { value: TaskEffort.High, label: 'Alto' },
    { value: TaskEffort.Very_high, label: 'Muy Alto' },
  ];

  taskName: string = '';
  selectedCategoryId: number | null = null;
  taskFrequency: TaskFrequency = TaskFrequency.Daily;
  taskInterval: number = 1;
  taskEffort: TaskEffort = TaskEffort.Medium;
  taskDueDate: string = this.getTodayString();
  /** True solo si el usuario tocó el campo de fecha manualmente en esta sesión de edición. */
  dueDateExplicitlyChanged: boolean = false;
  isSubmitting: boolean = false;

  get isEditMode(): boolean {
    return this.taskToEdit !== null;
  }

  // --- NUEVAS VARIABLES PARA TAREAS SEMANALES ---
  weekdaysList = [
    { value: 1, label: 'L' },
    { value: 2, label: 'M' },
    { value: 3, label: 'X' },
    { value: 4, label: 'J' },
    { value: 5, label: 'V' },
    { value: 6, label: 'S' },
    { value: 0, label: 'D' }, // El 0 es Domingo en JS
  ];
  selectedWeekdays: number[] = [];

  get isWeekly(): boolean {
    return Number(this.taskFrequency) === TaskFrequency.Weekly;
  }

  toggleWeekday(day: number) {
    const index = this.selectedWeekdays.indexOf(day);
    if (index > -1) {
      this.selectedWeekdays.splice(index, 1); // Lo quita si ya estaba
    } else {
      this.selectedWeekdays.push(day); // Lo añade
    }
  }

  async ngOnInit() {
    this.categories = await this.categoryService.getAllCategories();
    if (this.categories.length > 0) {
      this.selectedCategoryId = this.categories[0]?.id ?? null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const task = changes['taskToEdit']?.currentValue as TaskActive | null;
    if (task) {
      this.prefillForm(task);
    }
  }

  private prefillForm(task: TaskActive): void {
    this.taskName = task.name;
    this.taskFrequency = task.frequency;
    this.taskInterval = task.interval;
    this.taskEffort = task.effort;
    this.selectedCategoryId = task.category?.id ?? null;
    this.taskDueDate = this.timestampToDateString(task.endDate);
    this.selectedWeekdays = task.weekdays ? [...task.weekdays] : [];
    // Resetear: el usuario aún no ha cambiado la fecha en esta apertura del modal
    this.dueDateExplicitlyChanged = false;
  }

  onDueDateChange(): void {
    this.dueDateExplicitlyChanged = true;
  }

  private timestampToDateString(ts: number): string {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  onDismiss() {
    this.resetForm();
    this.dismissed.emit();
  }

  async onSubmit() {
    if (!this.taskName.trim() || this.selectedCategoryId === null) return;

    // Validación días semana
    if (this.isWeekly && this.selectedWeekdays.length === 0) {
      await this.showToast('Selecciona al menos un día de la semana.', 'warning');
      return;
    }

    this.isSubmitting = true;
    const selectedCategory = this.categories.find((c) => c.id === Number(this.selectedCategoryId))!;

    try {
      if (this.isEditMode && this.taskToEdit) {
        if (this.editMode === 'instance') {
          // Solo actualizamos la instancia (end_date)
          await this.editTaskService.updateTaskInstance(
            this.taskToEdit.taskActiveId,
            this.taskName,
            this.taskDueDate,
          );
          await this.showToast('¡Instancia actualizada!', 'success');
        } else {
          // Edición global: actualiza la definición de la tarea
          const taskId = this.taskToEdit.id;
          const activeTaskId = this.taskToEdit.taskActiveId;
          // Para tareas no-semanales, solo enviamos dueDate si el usuario la cambió
          // explícitamente. De lo contrario, el modal habrá pre-rellenado la fecha de la
          // instancia activa (que puede diferir del anchor_date original), y enviársela al
          // repositorio corrompería silenciosamente el ancla de tareas mensuales.
          const dueDateForEdit = (!this.isWeekly && this.dueDateExplicitlyChanged)
            ? this.taskDueDate
            : undefined;

          await this.editTaskService.updateTask(taskId, activeTaskId, {
            name: this.taskName,
            category: selectedCategory,
            frequency: Number(this.taskFrequency),
            interval: Number(this.taskInterval),
            effort: Number(this.taskEffort),
            dueDate: dueDateForEdit,
            weekdays: this.isWeekly ? this.selectedWeekdays : [],
          });
          await this.showToast('¡Tarea global actualizada!', 'success');
        }
      } else {
        // Modo creación
        await this.createTaskService.createTask({
          name: this.taskName,
          category: selectedCategory,
          frequency: Number(this.taskFrequency),
          interval: Number(this.taskInterval),
          effort: Number(this.taskEffort),
          dueDate: !this.isWeekly ? this.taskDueDate : undefined,
          weekdays: this.isWeekly ? this.selectedWeekdays : [],
        });
        await this.showToast('¡Tarea creada con éxito!', 'success');
      }

      this.resetForm();
      this.dismissed.emit();
    } catch (error) {
      console.error('Error guardando tarea', error);
      await this.showToast('Error al guardar la tarea.', 'danger');
    } finally {
      this.isSubmitting = false;
    }
  }

  private async showToast(message: string, color: 'success' | 'danger' | 'warning'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
      icon: color === 'success' ? 'checkmark-circle' : undefined,
    });
    await toast.present();
  }

  getIntervalLabel(): string {
    switch (Number(this.taskFrequency)) {
      case TaskFrequency.Daily:
        return this.taskInterval === 1 ? 'día' : 'días';
      case TaskFrequency.Weekly:
        return this.taskInterval === 1 ? 'semana' : 'semanas';
      case TaskFrequency.Monthly:
        return this.taskInterval === 1 ? 'mes' : 'meses';
      default:
        return '';
    }
  }

  private resetForm() {
    this.taskName = '';
    this.taskFrequency = TaskFrequency.Daily;
    this.taskInterval = 1;
    this.taskEffort = TaskEffort.Medium;
    this.taskDueDate = this.getTodayString();
    this.selectedWeekdays = [];
    this.dueDateExplicitlyChanged = false;
    if (this.categories.length > 0) {
      this.selectedCategoryId = this.categories[0]?.id ?? null;
    }
  }

  private getTodayString(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }
}
