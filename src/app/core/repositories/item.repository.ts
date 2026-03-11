import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { Item, ItemInventory } from '@core/models/item.model';

@Injectable({
  providedIn: 'root',
})
export class ItemRepository {
  private databaseService = inject(DatabaseService);

  formatDBRowToItem(row: any): Item {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      rarity: row.rarity,
      imageName: row.image_name,
      sellPrice: row.sell_price,
    };
  }

  formatDBRowToInventoryItem(row: any): ItemInventory {
    return {
      id: Number(row.item_id),
      name: row.name,
      description: row.description,
      rarity: Number(row.rarity),
      imageName: row.image_name,
      sellPrice: Number(row.sell_price),
      isShiny: row.is_shiny === 1,
      quantity: Number(row.quantity),
    };
  }

  async addItemToInventory(
    itemId: number,
    isShiny: boolean = false,
    quantity: number = 1,
  ): Promise<void> {
    await this.databaseService.withConn(async (conn) => {
      const existing = await conn.query(
        `SELECT quantity FROM inventory WHERE item_id = ? AND is_shiny = ?`,
        [itemId, isShiny ? 1 : 0],
      );

      // Si ya existe, actualizamos la cantidad
      if (existing.values && existing.values.length > 0) {
        const currentQty = Number(existing.values[0].quantity) || 0;
        await conn.run(`UPDATE inventory SET quantity = ? WHERE item_id = ? AND is_shiny = ?`, [
          currentQty + quantity,
          itemId,
          isShiny ? 1 : 0,
        ]);
        return;
      }

      // Si no existe, insertamos nuevo
      await conn.run(`INSERT INTO inventory (item_id, is_shiny, quantity) VALUES (?, ?, ?)`, [
        itemId,
        isShiny ? 1 : 0,
        quantity,
      ]);
    });
  }

  async getInventoryItemsPaginated(
    limit: number = 20,
    offset: number = 0,
  ): Promise<ItemInventory[]> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query(
        `
        SELECT
          ii.item_id, ii.is_shiny, ii.quantity,
          i.name, i.description, i.rarity, i.image_name, i.sell_price
        FROM inventory ii
        JOIN item i ON ii.item_id = i.id
        ORDER BY i.id
        LIMIT ? OFFSET ?
      `,
        [limit, offset],
      );
      const itemsRaw = res.values || [];

      return itemsRaw.map((row) => this.formatDBRowToInventoryItem(row));
    });
  }

  async emptyInventory(): Promise<void> {
    await this.databaseService.withConn(async (conn) => {
      await conn.run(`DELETE FROM inventory`);
    });
  }
}
