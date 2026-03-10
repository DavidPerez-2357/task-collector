import { inject, Injectable } from '@angular/core';
import { ItemRepository } from '@core/repositories/item.repository';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private itemRepository = inject(ItemRepository);

  async getInventoryItemsPaginated(page: number = 1, pageSize: number = 20) {
    return await this.itemRepository.getInventoryItemsPaginated(pageSize, (page - 1) * pageSize);
  }
}
