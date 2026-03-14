import { inject, Injectable } from '@angular/core';
import { ItemRepository } from '@core/repositories/item.repository';
import { TaskActive } from '@core/models/task.model';
import { getRewardRarityForTask } from '@core/utils/reward.util';
import { rollForShiny } from '@core/utils/shiny.util';
import { ItemInventory } from '@core/models/item.model';

@Injectable()
export class ItemService {
  private itemRepository = inject(ItemRepository);

  /**
   * Otorga un item al completar una tarea (servicio local para HomeTab).
   * Usa reward util y shiny util. Delega selección real a repository.
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
