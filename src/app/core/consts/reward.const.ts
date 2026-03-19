import { TaskEffort } from '@core/models/task.model';

/** Monedas base que se otorgan al completar una tarea según su nivel de esfuerzo. */
export const COINS_PER_EFFORT: Record<TaskEffort, number> = {
  [TaskEffort.Very_low]: 1,
  [TaskEffort.Low]: 2,
  [TaskEffort.Medium]: 5,
  [TaskEffort.High]: 10,
  [TaskEffort.Very_high]: 20,
};
