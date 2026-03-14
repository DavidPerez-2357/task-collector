import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, inject } from '@angular/core';
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
  imports: [IonModal, BoardComponent, ButtonComponent, FormsModule]
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
    { value: TaskFrequency.Monthly, label: 'Mensual' }
  ];
  efforts = [
    { value: TaskEffort.Very_low, label: 'Muy Bajo' },
    { value: TaskEffort.Low, label: 'Bajo' },
    { value: TaskEffort.Medium, label: 'Medio' },
    { value: TaskEffort.High, label: 'Alto' },
    { value: TaskEffort.Very_high, label: 'Muy Alto' }
  ];

  taskName: string = '';
  selectedCategoryId: number | null = null;
  taskFrequency: TaskFrequency = TaskFrequency.Daily;
  taskInterval: number = 1;
  taskEffort: TaskEffort = TaskEffort.Medium;
  taskDueDate: string = this.getTodayString();
  isSubmitting: boolean = false;

  get isEditMode(): boolean {
    return this.taskToEdit !== null;
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
    this.isSubmitting = true;

    const selectedCategory = this.categories.find(c => c.id === Number(this.selectedCategoryId))!;
    const taskData: CreateTaskInput = {
      name: this.taskName,
      category: selectedCategory,
      frequency: Number(this.taskFrequency),
      interval: Number(this.taskInterval),
      effort: Number(this.taskEffort),
      dueDate: this.taskDueDate
    };

    try {
      if (this.isEditMode && this.taskToEdit) {
        if (this.editMode === 'instance') {
          // Solo actualizamos la instancia (end_date)
          await this.editTaskService.updateTaskInstance(this.taskToEdit.taskActiveId, this.taskName, this.taskDueDate);
          await this.showToast('¡Instancia actualizada!', 'success');
        } else {
          // Modo edición global: task_id es el ID de la tabla `task`, taskActiveId es el ID de `task_active`
          const taskId = this.taskToEdit.id;
          const activeTaskId = this.taskToEdit.taskActiveId;
          await this.editTaskService.updateTask(taskId, activeTaskId, taskData);
          await this.showToast('¡Tarea global actualizada!', 'success');
        }
      } else {
        // Modo creación: creamos una nueva tarea
        await this.createTaskService.createTask(taskData);
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

  private async showToast(message: string, color: 'success' | 'danger'): Promise<void> {
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      color,
      position: 'top',
      icon: color === 'success' ? 'checkmark-circle' : undefined
    });
    await toast.present();
  }

  getIntervalLabel(): string {
    switch (Number(this.taskFrequency)) {
      case TaskFrequency.Daily: return this.taskInterval === 1 ? 'día' : 'días';
      case TaskFrequency.Weekly: return this.taskInterval === 1 ? 'semana' : 'semanas';
      case TaskFrequency.Monthly: return this.taskInterval === 1 ? 'mes' : 'meses';
      default: return '';
    }
  }

  private resetForm() {
    this.taskName = '';
    this.taskFrequency = TaskFrequency.Daily;
    this.taskInterval = 1;
    this.taskEffort = TaskEffort.Medium;
    this.taskDueDate = this.getTodayString();
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