import { Injectable, inject } from '@angular/core';
import { ItemRepository } from '@core/repositories/item.repository';
import { TaskActive, TaskEffort } from '@core/models/task.model';
import { ItemInventory } from '@core/models/item.model';
import { getRewardRarityForTask } from '@core/utils/reward.util';
import { rollForShiny } from '@core/utils/shiny.util';
import { RewardContext, TaskRewardResult } from '@core/models/reward.model';
import { COINS_PER_EFFORT } from '@core/consts/reward.const';
import { PlayerStateService } from '@core/services/player-state.service';

@Injectable({
  providedIn: 'root',
})
export class TaskRewardService {
  private readonly itemRepository = inject(ItemRepository);
  private readonly playerStateService = inject(PlayerStateService);

  /**
   * Otorga la recompensa completa al completar una tarea: monedas + ítem (si existe).
   *
   * Las monedas se calculan según el esfuerzo de la tarea y se añaden directamente
   * al saldo del jugador. El ítem se selecciona con una rareza ponderada por esfuerzo
   * y frecuencia, con posibilidad de ser shiny.
   *
   * Acepta un RewardContext opcional para soportar reglas especiales:
   * - coinsMultiplier: multiplicar las monedas (ej: 2 para "día doble")
   * - bonusShinyChance: aumentar la probabilidad de shiny (ej: para eventos)
   * - rng: función aleatoria inyectable para pruebas deterministas
   */
  async grantRewardForCompletedTask(
    task: TaskActive,
    context: RewardContext = {},
  ): Promise<TaskRewardResult> {
    const { coinsMultiplier = 1, bonusShinyChance = 0, rng } = context;

    const coinsEarned = await this.grantCoinsForTask(task, coinsMultiplier);
    const item = await this.grantItemForTask(task, rng, bonusShinyChance);

    return { item, coinsEarned };
  }

  private async grantCoinsForTask(task: TaskActive, multiplier: number): Promise<number> {
    // The ?? fallback guards against unexpected runtime values (e.g. from SQLite) that fall
    // outside the enum, even though COINS_PER_EFFORT covers all TaskEffort values statically.
    const base = COINS_PER_EFFORT[task.effort] ?? COINS_PER_EFFORT[TaskEffort.Medium];
    const coinsEarned = Math.round(base * Math.max(0, multiplier));
    if (coinsEarned > 0) {
      await this.playerStateService.addCoins(coinsEarned);
    }
    return coinsEarned;
  }

  private async grantItemForTask(
    task: TaskActive,
    rng?: () => number,
    bonusShinyChance: number = 0,
  ): Promise<ItemInventory | null> {
    const rarity = getRewardRarityForTask(task, rng);
    const isShiny = rollForShiny(rng, bonusShinyChance);

    const itemId = await this.itemRepository.getRandomItemIdByRarity(rarity);
    if (itemId == null) return null;

    await this.itemRepository.addItemToInventory(itemId, isShiny, 1);
    return await this.itemRepository.getInventoryItemByIdAndShiny(itemId, isShiny);
  }
}
