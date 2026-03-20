import { Component, OnInit, computed, effect, inject, input, output, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '../board/board.component';
import { ButtonComponent } from '../button/button.component';
import { TaskActive, TaskEffort, TaskFrequency } from '@core/models/task.model';
import { Category } from '@core/models/category.model';
import { CategoryService } from '@core/services/category.service';
import { CreateTaskService } from '@core/services/create-task.service';
import { EditTaskService } from '@core/services/edit-task.service';
import { ToastService } from '@core/services/toast.service';

@Component({
  selector: 'app-create-task-modal',
  templateUrl: './create-task-modal.component.html',
  styleUrls: ['./create-task-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent, ReactiveFormsModule],
})
export class CreateTaskModalComponent implements OnInit {
  // Signal-based inputs
  isOpen = input<boolean>(false);
  taskToEdit = input<TaskActive | null>(null);
  editMode = input<'global' | 'instance'>('global');
  dismissed = output<void>();

  readonly TaskFrequency = TaskFrequency;

  private fb = inject(FormBuilder);
  private categoryService = inject(CategoryService);
  private createTaskService = inject(CreateTaskService);
  private editTaskService = inject(EditTaskService);
  private toast = inject(ToastService);

  // Reactive state signals
  categories = signal<Category[]>([]);
  isSubmitting = signal(false);
  /** Días de la semana seleccionados para tareas semanales. */
  selectedWeekdays = signal<number[]>([]);
  /** True solo si el usuario tocó el campo de fecha manualmente en esta sesión de edición. */
  dueDateExplicitlyChanged = signal(false);

  // Flag para evitar desbloquear el scroll al iniciar el componente
  private openedOnce = false;

  // Static options
  readonly frequencies = [
    { value: TaskFrequency.No_repeat, label: 'Una sola vez' },
    { value: TaskFrequency.Daily, label: 'Diaria' },
    { value: TaskFrequency.Weekly, label: 'Semanal' },
    { value: TaskFrequency.Monthly, label: 'Mensual' },
  ];
  readonly efforts = [
    { value: TaskEffort.Very_low, label: 'Muy Bajo' },
    { value: TaskEffort.Low, label: 'Bajo' },
    { value: TaskEffort.Medium, label: 'Medio' },
    { value: TaskEffort.High, label: 'Alto' },
    { value: TaskEffort.Very_high, label: 'Muy Alto' },
  ];
  readonly weekdaysList = [
    { value: 1, label: 'L' },
    { value: 2, label: 'M' },
    { value: 3, label: 'X' },
    { value: 4, label: 'J' },
    { value: 5, label: 'V' },
    { value: 6, label: 'S' },
    { value: 0, label: 'D' }, // El 0 es Domingo en JS
  ];

  // Reactive form
  form = this.fb.group({
    name: ['', [Validators.required, Validators.maxLength(40)]],
    categoryId: [null as number | null, Validators.required],
    frequency: [TaskFrequency.Daily as TaskFrequency],
    interval: [1, [Validators.min(1), Validators.max(365)]],
    effort: [TaskEffort.Medium as TaskEffort],
    dueDate: [this.getTodayString()],
  });

  // Bridge form.valueChanges observable → signal for computed derivations
  private formValue = toSignal(this.form.valueChanges, { initialValue: this.form.value });

  // Computed signals derived from inputs and form state
  isEditMode = computed(() => this.taskToEdit() !== null);

  isWeekly = computed(() => Number(this.formValue().frequency) === TaskFrequency.Weekly);

  isOneTime = computed(() => Number(this.formValue().frequency) === TaskFrequency.No_repeat);

  intervalLabel = computed(() => {
    const interval = this.formValue().interval ?? 1;
    switch (Number(this.formValue().frequency)) {
      case TaskFrequency.Daily:
        return interval === 1 ? 'día' : 'días';
      case TaskFrequency.Weekly:
        return interval === 1 ? 'semana' : 'semanas';
      case TaskFrequency.Monthly:
        return interval === 1 ? 'mes' : 'meses';
      default:
        return '';
    }
  });

  isSubmitDisabled = computed(() => {
    if (this.isSubmitting()) return true;
    // In instance-edit mode only the due date is editable; name/category are disabled
    if (this.isEditMode() && this.editMode() === 'instance') return false;
    const v = this.formValue();
    return !v.name?.trim() || v.categoryId === null;
  });

  constructor() {
    // React to taskToEdit input signal: prefill the form when a task is provided
    effect(() => {
      const task = this.taskToEdit();
      if (task) {
        this.prefillForm(task);
      }
    });

    // React to isOpen input signal: lock/unlock body scroll
    effect(() => {
      const open = this.isOpen();
      // Skip the initial false emission so we don't unlock body scroll if other modals set it
      if (!this.openedOnce) {
        this.openedOnce = true;
        if (!open) return;
      }
      this.toggleBodyScroll(open);
    });

    // React to editMode signal: disable/enable form controls for instance-only editing
    effect(() => {
      const instanceOnly = this.isEditMode() && this.editMode() === 'instance';
      const globalControls = ['name', 'categoryId', 'frequency', 'interval', 'effort'];
      globalControls.forEach((name) => {
        const ctrl = this.form.get(name);
        if (instanceOnly) {
          ctrl?.disable({ emitEvent: false });
        } else {
          ctrl?.enable({ emitEvent: false });
        }
      });
    });
  }

  async ngOnInit(): Promise<void> {
    const cats = await this.categoryService.getAllCategories();
    this.categories.set(cats);
    // Solo ponemos el valor por defecto si no estamos editando y aún no hay selección
    if (!this.isEditMode() && cats.length > 0) {
      this.form.patchValue({ categoryId: cats[0]!.id });
    }
  }

  private prefillForm(task: TaskActive): void {
    this.form.patchValue({
      name: task.name,
      frequency: task.frequency,
      interval: task.interval,
      effort: task.effort,
      categoryId: task.category?.id ?? null,
      dueDate: this.timestampToDateString(task.endDate),
    });
    this.selectedWeekdays.set(task.weekdays ? [...task.weekdays] : []);
    // Resetear: el usuario aún no ha cambiado la fecha en esta apertura del modal
    this.dueDateExplicitlyChanged.set(false);
  }

  onDueDateChange(): void {
    this.dueDateExplicitlyChanged.set(true);
  }

  toggleWeekday(day: number): void {
    this.selectedWeekdays.update((days) => {
      const index = days.indexOf(day);
      return index > -1 ? days.filter((d) => d !== day) : [...days, day];
    });
  }

  onDismiss(): void {
    this.toggleBodyScroll(false);
    this.resetForm();
    this.dismissed.emit();
  }

  async onSubmit(): Promise<void> {
    if (!(await this.validateForm())) return;

    this.isSubmitting.set(true);
    try {
      const categoryId = Number(this.form.getRawValue().categoryId);
      const selectedCategory = this.categories().find((c) => c.id === categoryId);
      if (!selectedCategory) {
        await this.toast.error(
          'Categoría no encontrada. Por favor, selecciona una categoría válida.',
        );
        return;
      }

      if (this.isEditMode() && this.taskToEdit()) {
        await this.handleEditMode(selectedCategory);
      } else {
        await this.handleCreateMode(selectedCategory);
      }

      this.completeSubmission();
    } catch (error) {
      await this.handleError(error);
    } finally {
      this.isSubmitting.set(false);
    }
  }

  private async validateForm(): Promise<boolean> {
    const v = this.form.getRawValue();
    if (!v.name?.trim() || v.categoryId === null) return false;

    if (this.isWeekly() && this.selectedWeekdays().length === 0) {
      await this.toast.show({
        message: 'Selecciona al menos un día de la semana.',
        color: 'warning',
      });
      return false;
    }
    return true;
  }

  private async handleCreateMode(category: Category): Promise<void> {
    const v = this.form.getRawValue();
    await this.createTaskService.createTask({
      name: v.name!,
      category,
      frequency: Number(v.frequency),
      interval: Number(v.interval),
      effort: Number(v.effort),
      dueDate: !this.isWeekly() ? v.dueDate! : undefined,
      weekdays: this.isWeekly() ? this.selectedWeekdays() : [],
    });
    await this.toast.success('¡Tarea creada con éxito!');
  }

  private async handleEditMode(category: Category): Promise<void> {
    if (!this.taskToEdit()) return;

    if (this.editMode() === 'instance') {
      await this.updateInstance();
    } else {
      await this.updateGlobal(category);
    }
  }

  private async updateInstance(): Promise<void> {
    const task = this.taskToEdit();
    if (!task) return;
    await this.editTaskService.updateTaskInstance(
      task.taskActiveId,
      this.form.getRawValue().dueDate!,
    );
    await this.toast.success('¡Instancia actualizada!');
  }

  private async updateGlobal(category: Category): Promise<void> {
    const task = this.taskToEdit();
    if (!task) return;

    const v = this.form.getRawValue();
    const dueDateForEdit =
      !this.isWeekly() && this.dueDateExplicitlyChanged() ? v.dueDate! : undefined;

    await this.editTaskService.updateTask(task.id, task.taskActiveId, {
      name: v.name!,
      category,
      frequency: Number(v.frequency),
      interval: Number(v.interval),
      effort: Number(v.effort),
      dueDate: dueDateForEdit,
      weekdays: this.isWeekly() ? this.selectedWeekdays() : [],
    });
    await this.toast.success('¡Tarea global actualizada!');
  }

  private completeSubmission(): void {
    this.resetForm();
    this.dismissed.emit();
  }

  private async handleError(error: unknown): Promise<void> {
    console.error('Error guardando tarea', error);
    await this.toast.error('Error al guardar la tarea.');
  }

  private resetForm(): void {
    this.form.reset({
      name: '',
      categoryId: this.categories()[0]?.id ?? null,
      frequency: TaskFrequency.Daily,
      interval: 1,
      effort: TaskEffort.Medium,
      dueDate: this.getTodayString(),
    });
    this.selectedWeekdays.set([]);
    this.dueDateExplicitlyChanged.set(false);
  }

  private getTodayString(): string {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private timestampToDateString(ts: number): string {
    const d = new Date(ts);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  private toggleBodyScroll(block: boolean): void {
    if (block) {
      document.body.style.overflow = 'hidden';
      document.body.addEventListener('touchmove', this.preventTouchMove, { passive: false });
    } else {
      document.body.style.overflow = '';
      document.body.removeEventListener('touchmove', this.preventTouchMove);
    }
  }

  private preventTouchMove(e: TouchEvent): void {
    e.preventDefault();
  }
}
