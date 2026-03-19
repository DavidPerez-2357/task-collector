import { Injectable, inject } from '@angular/core';
import { ItemRepository } from '@core/repositories/item.repository';
import { TaskActive } from '@core/models/task.model';
import { ItemInventory } from '@core/models/item.model';
import { getRewardRarityForTask } from '@core/utils/reward.util';
import { rollForShiny } from '@core/utils/shiny.util';

@Injectable({
  providedIn: 'root',
})
export class TaskRewardService {
  private readonly itemRepository = inject(ItemRepository);

  /**
   * Otorga un ítem al completar una tarea.
   * Determina la rareza según esfuerzo/frecuencia de la tarea, aplica la probabilidad
   * de shiny, añade el ítem al inventario y devuelve la fila resultante.
   * Devuelve null si no existe ningún ítem con esa rareza en el catálogo.
   *
   * Se puede inyectar `rng` para obtener comportamiento determinista en pruebas.
   */
  async grantItemForCompletedTask(
    task: TaskActive,
    rng?: () => number,
  ): Promise<ItemInventory | null> {
    const rarity = getRewardRarityForTask(task, rng);
    const isShiny = rollForShiny(rng);

    const itemId = await this.itemRepository.getRandomItemIdByRarity(rarity);
    if (itemId == null) return null;

    await this.itemRepository.addItemToInventory(itemId, isShiny, 1);
    return await this.itemRepository.getInventoryItemByIdAndShiny(itemId, isShiny);
  }
}
