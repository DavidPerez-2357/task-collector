import { Component, EventEmitter, Input, Output, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonModal, ToastController } from '@ionic/angular/standalone';
import { BoardComponent } from '../board/board.component';
import { ButtonComponent } from '../button/button.component';
import { Task, TaskEffort, TaskFrequency } from '@core/models/task.model';
import { Category } from '@core/models/category.model';
import { CategoryService } from '@core/services/category.service';
import { CreateTaskService, CreateTaskInput } from '@core/services/create-task.service';

@Component({
  selector: 'app-create-task-modal',
  templateUrl: './create-task-modal.component.html',
  styleUrls: ['./create-task-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent, FormsModule]
})
export class CreateTaskModalComponent implements OnInit {
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();
  readonly TaskFrequency = TaskFrequency;

  private categoryService = inject(CategoryService);
  private createTaskService = inject(CreateTaskService);
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

  async ngOnInit() {
    this.categories = await this.categoryService.getAllCategories();
    if (this.categories.length > 0) {
      this.selectedCategoryId = this.categories[0]?.id ?? null;
    }
  }

  onDismiss() {
    this.resetForm();
    this.dismissed.emit();
  }

  async onSubmit() {
    if (!this.taskName.trim() || this.selectedCategoryId === null) return;
    this.isSubmitting = true;
    
    const selectedCategory = this.categories.find(c => c.id === Number(this.selectedCategoryId))!;

    try {
      await this.createTaskService.createTask({
        name: this.taskName,
        category: selectedCategory,
        frequency: Number(this.taskFrequency),
        interval: Number(this.taskInterval),
        effort: Number(this.taskEffort),
        dueDate: this.taskDueDate
      });
      
      this.resetForm();
      this.dismissed.emit();

      // Aviso de éxito global
      const toast = await this.toastController.create({
        message: '¡Tarea creada con éxito!',
        duration: 2000,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle'
      });
      await toast.present();

    } catch (error) {
      console.error('Error guardando tarea', error);
      const errorToast = await this.toastController.create({
        message: 'Error al crear la tarea.',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await errorToast.present();
    } finally {
      this.isSubmitting = false;
    }
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