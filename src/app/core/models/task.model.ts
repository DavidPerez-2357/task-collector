import { Category } from '@core/models/category.model';

export enum TaskFrequency {
  No_repeat = 0,
  Daily = 1,
  Weekly = 2,
  Monthly = 3,
}

export enum TaskEffort {
  Very_low = 0,
  Low = 1,
  Medium = 2,
  High = 3,
  Very_high = 4,
}

export interface Task {
  id: number;
  name: string;
  frequency: TaskFrequency;
  interval: number;
  effort: TaskEffort;
  category: Category;
  anchorDate?: number; // timestamp
}

export interface WeeklyTask extends Task {
  daysOfWeek: number[]; // 0 = Sunday, 1 = Monday
}

export interface TaskActive extends Task {
  taskActiveId: number; // id de la fila en task_active
  startDate: number; // timestamp
  endDate: number;
  weekdays?: number[]; // Días de la semana marcados (para recargas al editar semanas)
}

export interface TaskHistory extends Task {
  completionDate: number; // timestamp
  daysLate: number;
}
