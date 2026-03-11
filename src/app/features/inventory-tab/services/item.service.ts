import { inject, Injectable } from '@angular/core';
import { ItemRepository } from '@core/repositories/item.repository';
import { getShinyPrice } from '@core/utils/shiny.util';

@Injectable({
  providedIn: 'root',
})
export class ItemService {
  private itemRepository = inject(ItemRepository);

  async getInventoryItemsPaginated(page: number = 1, pageSize: number = 20) {
    return await this.itemRepository.getInventoryItemsPaginated(pageSize, (page - 1) * pageSize);
  }

  async sellItem(itemId: number, isShiny: boolean) {
    // Comprobar si el ítem esta en el inventario
    const item = await this.itemRepository.getInventoryItemByIdAndShiny(itemId, isShiny);

    if (!item || item.quantity <= 0) {
      throw new Error('El ítem no está disponible en el inventario');
    }

    // Calcular el precio de venta, aplicando el multiplicador si es shiny
    const sellPrice = item.isShiny ? getShinyPrice(item.sellPrice) : item.sellPrice;

    // Vender el ítem
    await this.itemRepository.sellItem(itemId, isShiny, sellPrice);

    // Borrar ítems con cantidad 0 para mantener el inventario limpio
    await this.itemRepository.removeZeroQuantityItemsFromInventory();

    // Devolver la cantidad actualizada del ítem
    const updatedItem = await this.itemRepository.getInventoryItemByIdAndShiny(itemId, isShiny);
    return updatedItem?.quantity || 0;
  }
}
