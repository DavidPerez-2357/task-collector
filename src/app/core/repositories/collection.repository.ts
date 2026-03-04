import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { Collection, CollectionItem } from '@core/models/collection.model';
import { Item, Rarity } from '@core/models/item.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionRepository {
  private databaseService = inject(DatabaseService);

  async getAllCollections(): Promise<Collection[]> {
    return await this.databaseService.withConn(async (conn) => {
      // 1. Obtenemos todas las colecciones
      const collRes = await conn.query('SELECT * FROM collection');
      const collectionsRaw = collRes.values || [];

      // 2. Obtenemos todos los ítems de las colecciones unidos (JOIN) con la tabla item
      //    y hacemos un LEFT JOIN con player_collection_item para saber cuáles ya ha puesto el jugador
      const itemsRes = await conn.query(`
        SELECT 
          ci.collection_id, 
          ci.is_shiny AS slot_is_shiny, 
          i.id, i.name, i.rarity, i.image_name, i.sell_price,
          pci.deposited_is_shiny
        FROM collection_item ci
        JOIN item i ON ci.item_id = i.id
        LEFT JOIN player_collection_item pci 
          ON pci.collection_id = ci.collection_id 
          AND pci.item_id = ci.item_id 
          AND pci.slot_is_shiny = ci.is_shiny
      `);
      const allItemsRaw = itemsRes.values || [];

      // 3. Agrupamos los ítems por collection_id
      const itemsByCollection = new Map<number, CollectionItem[]>();
      for (const row of allItemsRaw) {
        if (!itemsByCollection.has(row.collection_id)) {
          itemsByCollection.set(row.collection_id, []);
        }

        const itemObj: CollectionItem = {
          id: row.id,
          name: row.name,
          rarity: row.rarity as Rarity,
          imageName: row.image_name,
          sellPrice: row.sell_price,
          isShiny: row.slot_is_shiny === 1,
        };

        if (row.deposited_is_shiny !== null && row.deposited_is_shiny !== undefined) {
          itemObj.deposited = {
            isShiny: row.deposited_is_shiny === 1,
          };
        }

        itemsByCollection.get(row.collection_id)!.push(itemObj);
      }

      // 4. Mapeamos los resultados de bases de datos a nuestro modelo Collection TypeScript
      return collectionsRaw.map((c: any) => ({
        id: c.id,
        name: c.name,
        price: c.price,
        badgeImageName: c.badge_image_name,
        items: itemsByCollection.get(c.id) || [],
      }));
    });
  }

  // Obtiene los IDs de las colecciones que el jugador ya ha comprado
  async getPlayerCollections(): Promise<number[]> {
    return await this.databaseService.withConn(async (conn) => {
      const res = await conn.query('SELECT collection_id FROM player_collection');
      return (res.values || []).map((row: any) => row.collection_id);
    });
  }

  // Registra la compra de una colección por parte del jugador
  async purchaseCollection(collectionId: number): Promise<void> {
    await this.databaseService.withConn(async (conn) => {
      await conn.run('INSERT INTO player_collection (collection_id, purchased_at) VALUES (?, ?)', [
        collectionId,
        new Date().toISOString(),
      ]);
    });
  }

  // Permite añadir un objeto a la colección (quitándolo del inventario)
  async addPlayerCollectionItem(
    collectionId: number,
    itemId: number,
    slotIsShiny: boolean,
    depositedIsShiny: boolean,
  ): Promise<void> {
    await this.databaseService.withConn(async (conn) => {
      // Registrar que el objeto ha sido añadido a la colección
      await conn.run(
        'INSERT INTO player_collection_item (collection_id, item_id, slot_is_shiny, deposited_is_shiny) VALUES (?, ?, ?, ?)',
        [collectionId, itemId, slotIsShiny ? 1 : 0, depositedIsShiny ? 1 : 0],
      );
      // Reducir la cantidad en el inventario
      await conn.run(
        'UPDATE inventory SET quantity = quantity - 1 WHERE item_id = ? AND is_shiny = ?',
        [itemId, depositedIsShiny ? 1 : 0],
      );
    });
  }

  // Permite quitar un objeto de la colección (devolviéndolo al inventario)
  async removePlayerCollectionItem(
    collectionId: number,
    itemId: number,
    slotIsShiny: boolean,
    depositedIsShiny: boolean,
  ): Promise<void> {
    await this.databaseService.withConn(async (conn) => {
      // Eliminar el registro de que pertenece a la colección
      await conn.run(
        'DELETE FROM player_collection_item WHERE collection_id = ? AND item_id = ? AND slot_is_shiny = ?',
        [collectionId, itemId, slotIsShiny ? 1 : 0],
      );
      // Devolverlo al inventario
      // Usamos INSERT ON CONFLICT por si la cantidad de este objeto bajó a 0 y la row desapareció (o para sumar quantity)
      // Como SQLite en versiones antiguas puede no tener UPSERT, comprobamos primero si existe la row
      const existing = await conn.query(
        'SELECT quantity FROM inventory WHERE item_id = ? AND is_shiny = ?',
        [itemId, depositedIsShiny ? 1 : 0],
      );

      if (existing.values && existing.values.length > 0) {
        await conn.run(
          'UPDATE inventory SET quantity = quantity + 1 WHERE item_id = ? AND is_shiny = ?',
          [itemId, depositedIsShiny ? 1 : 0],
        );
      } else {
        await conn.run('INSERT INTO inventory (item_id, quantity, is_shiny) VALUES (?, 1, ?)', [
          itemId,
          depositedIsShiny ? 1 : 0,
        ]);
      }
    });
  }
}
