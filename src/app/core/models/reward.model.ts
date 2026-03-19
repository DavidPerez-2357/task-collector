import { ItemInventory } from '@core/models/item.model';

/**
 * Contexto opcional que permite ajustar el comportamiento del sistema de recompensas.
 * Facilita la implementación de reglas especiales como días dobles, eventos o bonificaciones.
 */
export interface RewardContext {
  /** Multiplicador de monedas. Usar 2 para "día doble", 0.5 para penalty, etc. Por defecto 1. */
  coinsMultiplier?: number;
  /** Probabilidad adicional de obtener un ítem shiny (se suma a la base). Por defecto 0. */
  bonusShinyChance?: number;
  /** Función RNG inyectable para pruebas deterministas. Por defecto Math.random. */
  rng?: () => number;
}

/** Resultado completo de la recompensa al completar una tarea. */
export interface TaskRewardResult {
  /** Ítem obtenido, o null si no había ítems disponibles para la rareza calculada. */
  item: ItemInventory | null;
  /** Monedas ganadas (ya añadidas al saldo del jugador). */
  coinsEarned: number;
}
