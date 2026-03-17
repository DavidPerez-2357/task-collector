import { TaskActive, TaskEffort, TaskFrequency } from '@core/models/task.model';
import { Rarity } from '@core/models/item.model';

// Pesos base por esfuerzo (Common, Rare, Epic, Legendary)
const DEFAULT_WEIGHTS_BY_EFFORT: Record<TaskEffort, number[]> = {
  [TaskEffort.Very_low]: [0.85, 0.13, 0.02, 0.0],
  [TaskEffort.Low]: [0.7, 0.25, 0.05, 0.0],
  [TaskEffort.Medium]: [0.5, 0.35, 0.12, 0.03],
  [TaskEffort.High]: [0.35, 0.4, 0.2, 0.05],
  [TaskEffort.Very_high]: [0.2, 0.35, 0.3, 0.15],
};

// Multiplicadores por frecuencia (Common, Rare, Epic, Legendary)
const DEFAULT_FREQ_MODIFIERS: Record<TaskFrequency, number[]> = {
  [TaskFrequency.No_repeat]: [1.0, 1.15, 1.4, 1.6],
  [TaskFrequency.Daily]: [1.05, 0.95, 0.85, 0.7],
  [TaskFrequency.Weekly]: [1.0, 1.0, 1.0, 1.0],
  [TaskFrequency.Monthly]: [0.95, 1.05, 1.25, 1.5],
};

function safeWeightsForEffort(effort: TaskEffort): number[] {
  return DEFAULT_WEIGHTS_BY_EFFORT[effort] ?? DEFAULT_WEIGHTS_BY_EFFORT[TaskEffort.Medium];
}

function safeFreqModsForFrequency(freq: TaskFrequency): number[] {
  return DEFAULT_FREQ_MODIFIERS[freq] ?? DEFAULT_FREQ_MODIFIERS[TaskFrequency.Weekly];
}

/**
 * Normaliza un array de números para que sumen 1. Si la suma es 0, devuelve un array de ceros.
 * @param values
 */
function normalize(values: number[]): number[] {
  const total = values.reduce((s, v) => s + (v ?? 0), 0);
  if (total <= 0) return values.map(() => 0);
  return values.map((v) => (v ?? 0) / total);
}

function weightedPick(normalizedWeights: number[], rng: () => number): number {
  // normalizedWeights assumed to sum to 1 (or close). Returns index.
  let acc = 0;
  const r = rng();
  for (let i = 0; i < normalizedWeights.length; i++) {
    const w = normalizedWeights[i] ?? 0;
    acc += w;
    if (r <= acc) return i;
  }
  // fallback to last index
  return normalizedWeights.length - 1;
}

/**
 * Devuelve la rareza base según el esfuerzo (mapeo determinista simple).
 */
export function getBaseRarityForTask(task: TaskActive): Rarity {
  switch (task.effort) {
    case TaskEffort.Very_low:
    case TaskEffort.Low:
      return Rarity.Common;
    case TaskEffort.Medium:
      return Rarity.Rare;
    case TaskEffort.High:
      return Rarity.Epic;
    case TaskEffort.Very_high:
      return Rarity.Legendary;
    default:
      return Rarity.Common;
  }
}

/**
 * Calcula las probabilidades normalizadas (Common,Rare,Epic,Legendary) para una tarea
 * teniendo en cuenta esfuerzo y frecuencia. Útil para debugging y tests.
 */
export function getRewardProbabilitiesForTask(task: TaskActive): number[] {
  const baseWeights = safeWeightsForEffort(task.effort);
  const freqMods = safeFreqModsForFrequency(task.frequency);
  const adjusted = baseWeights.map((w, i) => (w ?? 0) * (freqMods[i] ?? 1));
  return normalize(adjusted);
}

/**
 * Devuelve una rareza seleccionada aleatoriamente según las probabilidades calculadas.
 * Se puede inyectar `rng` para obtener comportamiento determinista en pruebas.
 */
export function getRewardRarityForTask(task: TaskActive, rng?: () => number): Rarity {
  const _rng = rng ?? Math.random;
  const probs = getRewardProbabilitiesForTask(task);
  // Si por alguna razón las probabilidades son todas 0, devolvemos base rarity.
  const total = probs.reduce((s, v) => s + v, 0);
  if (total <= 0.000001) return getBaseRarityForTask(task);

  const idx = weightedPick(probs, _rng);
  switch (idx) {
    case 0:
      return Rarity.Common;
    case 1:
      return Rarity.Rare;
    case 2:
      return Rarity.Epic;
    case 3:
      return Rarity.Legendary;
    default:
      return getBaseRarityForTask(task);
  }
}
