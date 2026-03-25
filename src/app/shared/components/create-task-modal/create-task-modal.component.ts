import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  inject,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '../board/board.component';
import { ButtonComponent } from '../button/button.component';
import { TaskActive, TaskEffort, TaskFrequency } from '@core/models/task.model';
import { Category } from '@core/models/category.model';
import { CategoryService } from '@core/services/category.service';
import { CreateTaskService } from '@core/services/create-task.service';
import { EditTaskService } from '@core/services/edit-task.service';
import { ToastService } from '@core/services/toast.service';
import { blockBodyScroll, unblockBodyScroll } from '@core/utils/modal-scroll.util';

/**
 * Componente SMART — Modal para crear o editar una tarea.
 *
 * Gestiona el formulario de creación/edición de tareas. Inyecta servicios de dominio
 * (`CategoryService`, `CreateTaskService`, `EditTaskService`, `ToastService`) para
 * persistir los cambios.
 *
 * @example
 * ```html
 * <!-- Crear tarea -->
 * <app-create-task-modal [isOpen]="isOpen" (closed)="isOpen = false" />
 *
 * <!-- Editar tarea -->
 * <app-create-task-modal
 *   [isOpen]="isOpen"
 *   [taskToEdit]="task"
 *   editMode="global"
 *   (closed)="onClosed()"
 * />
 * ```
 *
 * Inputs:
 *   - `isOpen`      — controla la visibilidad del modal.
 *   - `taskToEdit`  — tarea a editar; si es null, el modal crea una nueva tarea.
 *   - `editMode`    — modo de edición: 'global' (modifica la tarea base) o 'instance' (solo esta ocurrencia).
 *
 * Outputs:
 *   - `closed` — emitido cuando el modal se cierra (por cancelación o tras guardar con éxito).
 */
@Component({
  selector: 'app-create-task-modal',
  templateUrl: './create-task-modal.component.html',
  styleUrls: ['./create-task-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent, FormsModule],
})
export class CreateTaskModalComponent implements OnInit, OnChanges, OnDestroy {
  @ViewChild(IonModal) modal!: IonModal;

  @Input() isOpen: boolean = false;
  @Input() taskToEdit: TaskActive | null = null;
  @Input() editMode: 'global' | 'instance' = 'global';
  @Output() closed = new EventEmitter<void>();
  readonly TaskFrequency = TaskFrequency;

  private categoryService = inject(CategoryService);
  private createTaskService = inject(CreateTaskService);
  private editTaskService = inject(EditTaskService);
  private toast = inject(ToastService);

  private scrollLocked = false;

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

  get isOneTime(): boolean {
    return Number(this.taskFrequency) === TaskFrequency.No_repeat;
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
    // Solo ponemos el valor por defecto si no estamos editando y aún no hay selección
    if (!this.isEditMode && this.categories.length > 0 && this.selectedCategoryId === null) {
      this.selectedCategoryId = this.categories[0]?.id ?? null;
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    const isOpenChange = changes['isOpen'];
    if (isOpenChange) {
      const { currentValue, firstChange } = isOpenChange;
      if (!(firstChange && !currentValue)) {
        if (currentValue) {
          this.scrollLocked = true;
          blockBodyScroll();
        } else {
          this.releaseScrollLock();
        }
      }
    }

    const task = changes['taskToEdit']?.currentValue as TaskActive | null;
    if (task) {
      this.prefillForm(task);
    }
  }

  ngOnDestroy(): void {
    this.releaseScrollLock();
  }

  private releaseScrollLock(): void {
    if (this.scrollLocked) {
      this.scrollLocked = false;
      unblockBodyScroll();
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
    this.releaseScrollLock();
    this.resetForm();
    this.closed.emit();
  }

  /** Cierra el modal programáticamente. */
  close() {
    this.modal.dismiss();
  }

  async onSubmit() {
    if (!(await this.validateForm())) return;

    this.isSubmitting = true;
    try {
      const selectedCategory = this.categories.find(
        (c) => c.id === Number(this.selectedCategoryId),
      )!;

      if (this.isEditMode && this.taskToEdit) {
        await this.handleEditMode(selectedCategory);
      } else {
        await this.handleCreateMode(selectedCategory);
      }

      this.completeSubmission();
    } catch (error) {
      this.handleError(error);
    } finally {
      this.isSubmitting = false;
    }
  }

  private async validateForm(): Promise<boolean> {
    if (!this.taskName.trim() || this.selectedCategoryId === null) return false;

    if (this.isWeekly && this.selectedWeekdays.length === 0) {
      await this.toast.show({
        message: 'Selecciona al menos un día de la semana.',
        color: 'warning',
      });
      return false;
    }
    return true;
  }

  private async handleCreateMode(category: Category): Promise<void> {
    await this.createTaskService.createTask({
      name: this.taskName,
      category,
      frequency: Number(this.taskFrequency),
      interval: Number(this.taskInterval),
      effort: Number(this.taskEffort),
      dueDate: !this.isWeekly ? this.taskDueDate : undefined,
      weekdays: this.isWeekly ? this.selectedWeekdays : [],
    });
    await this.toast.success('¡Tarea creada con éxito!');
  }

  private async handleEditMode(category: Category): Promise<void> {
    if (!this.taskToEdit) return;

    if (this.editMode === 'instance') {
      await this.updateInstance();
    } else {
      await this.updateGlobal(category);
    }
  }

  private async updateInstance(): Promise<void> {
    if (!this.taskToEdit) return;
    await this.editTaskService.updateTaskInstance(this.taskToEdit.taskActiveId, this.taskDueDate);
    await this.toast.success('¡Instancia actualizada!');
  }

  private async updateGlobal(category: Category): Promise<void> {
    if (!this.taskToEdit) return;

    const dueDateForEdit =
      !this.isWeekly && this.dueDateExplicitlyChanged ? this.taskDueDate : undefined;

    await this.editTaskService.updateTask(this.taskToEdit.id, this.taskToEdit.taskActiveId, {
      name: this.taskName,
      category,
      frequency: Number(this.taskFrequency),
      interval: Number(this.taskInterval),
      effort: Number(this.taskEffort),
      dueDate: dueDateForEdit,
      weekdays: this.isWeekly ? this.selectedWeekdays : [],
    });
    await this.toast.success('¡Tarea global actualizada!');
  }

  private completeSubmission(): void {
    this.close();
  }

  private async handleError(error: any): Promise<void> {
    console.error('Error guardando tarea', error);
    await this.toast.error('Error al guardar la tarea.');
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
