import { inject, Injectable } from '@angular/core';
import { ItemRepository } from '@core/repositories/item.repository';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private itemRepository = inject(ItemRepository);

  async addTestItemsToInventory() {
    // Lista completa (IDs únicos) tomada del seed SQL
    const itemIds = [
      1, 15, 26, 27, 55, 65, 67, 101, 106, 116, 117, 118, 124, 128, 206, 207, 222, 223, 225, 226,
      227, 228, 229, 230, 231, 349, 350, 351, 355, 356, 357, 374, 375, 376, 447, 548, 551, 554, 558,
      565, 568, 592, 1441, 1445, 1457, 1462, 1466, 1477, 1482, 1484, 1493, 1506, 1597, 1598, 1684,
      1685, 1689, 1728, 1737, 1805, 1806, 1811, 1812, 1813, 1837, 1838, 1839, 1840, 1846, 1906,
      1907, 1909, 1911, 1922, 1923, 1925, 1927, 1938, 1939, 1941, 1943, 1960, 1961, 1962, 1963,
      1964, 1976, 1977, 1978, 1979, 1980, 1992, 1993, 1994, 1995, 1996,
    ];

    // Añade cada item con cantidad 1
    for (const id of itemIds) {
      await this.itemRepository.addItemToInventory(id, false, 1);
    }
  }

  async getInventoryItemsPaginated(page: number = 1, pageSize: number = 20) {
    return await this.itemRepository.getInventoryItemsPaginated(pageSize, (page - 1) * pageSize);
  }
}
