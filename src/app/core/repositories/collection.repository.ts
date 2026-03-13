import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { Collection, CollectionItem } from '@core/models/collection.model';
import { Rarity } from '@core/models/item.model';

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
      //    Añadimos EXISTS para saber si posee objetos normales o shinys válidos.
      const itemsRes = await conn.query(`
        SELECT
          ci.collection_id,
          ci.is_shiny AS slot_is_shiny,
          i.id, i.name, i.description, i.rarity, i.image_name, i.sell_price,
          pci.deposited_is_shiny,
          EXISTS(
            SELECT 1 FROM inventory inv 
            WHERE inv.item_id = ci.item_id 
              AND inv.quantity > 0 
              AND inv.is_shiny = 0
          ) AS owned_normal,
          EXISTS(
            SELECT 1 FROM inventory inv 
            WHERE inv.item_id = ci.item_id 
              AND inv.quantity > 0 
              AND inv.is_shiny = 1
          ) AS owned_shiny
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

        const itemObj = this.formatDBRowToCollectionItem(row);

        if (row.deposited_is_shiny !== null && row.deposited_is_shiny !== undefined) {
          itemObj.deposited = {
            isShiny: row.deposited_is_shiny === 1,
          };
        }

        itemObj.ownedNormal = row.owned_normal === 1;
        itemObj.ownedShiny = row.owned_shiny === 1;

        // Comprobamos si el jugador tiene un objeto elegible para ESTE slot
        if (!itemObj.deposited) {
          if (itemObj.isShiny) {
            itemObj.ownedEligible = itemObj.ownedShiny;
          } else {
            itemObj.ownedEligible = itemObj.ownedNormal || itemObj.ownedShiny;
          }
        }

        itemsByCollection.get(row.collection_id)!.push(itemObj);
      }

      // 4. Mapeamos los resultados de bases de datos a nuestro modelo Collection TypeScript
      return collectionsRaw.map((c: any) =>
        this.formatDBRowToCollection(c, itemsByCollection.get(c.id) || []),
      );
    });
  }

  async getCollectionById(collectionId: number): Promise<Collection | null> {
    return await this.databaseService.withConn(async (conn) => {
      // 1. Obtenemos la colección
      const collRes = await conn.query('SELECT * FROM collection WHERE id = ?', [collectionId]);
      if (!collRes.values || collRes.values.length === 0) return null;
      const c = collRes.values[0];

      // 2. Obtenemos los ítems de esta colección
      const itemsRes = await conn.query(
        `
        SELECT
          ci.collection_id,
          ci.is_shiny AS slot_is_shiny,
          i.id, i.name, i.description, i.rarity, i.image_name, i.sell_price,
          pci.deposited_is_shiny,
          EXISTS(
            SELECT 1 FROM inventory inv 
            WHERE inv.item_id = ci.item_id 
              AND inv.quantity > 0 
              AND inv.is_shiny = 0
          ) AS owned_normal,
          EXISTS(
            SELECT 1 FROM inventory inv 
            WHERE inv.item_id = ci.item_id 
              AND inv.quantity > 0 
              AND inv.is_shiny = 1
          ) AS owned_shiny
        FROM collection_item ci
        JOIN item i ON ci.item_id = i.id
        LEFT JOIN player_collection_item pci
          ON pci.collection_id = ci.collection_id
          AND pci.item_id = ci.item_id
          AND pci.slot_is_shiny = ci.is_shiny
        WHERE ci.collection_id = ?
      `,
        [collectionId],
      );
      const itemsRaw = itemsRes.values || [];

      const items: CollectionItem[] = itemsRaw.map((row) => {
        const itemObj = this.formatDBRowToCollectionItem(row);

        if (row.deposited_is_shiny !== null && row.deposited_is_shiny !== undefined) {
          itemObj.deposited = {
            isShiny: row.deposited_is_shiny === 1,
          };
        }

        itemObj.ownedNormal = row.owned_normal === 1;
        itemObj.ownedShiny = row.owned_shiny === 1;

        if (!itemObj.deposited) {
          if (itemObj.isShiny) {
            itemObj.ownedEligible = itemObj.ownedShiny;
          } else {
            itemObj.ownedEligible = itemObj.ownedNormal || itemObj.ownedShiny;
          }
        }

        return itemObj;
      });

      return this.formatDBRowToCollection(c, items);
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

  // Devuelve las colecciones (propias) donde el item puede ser depositado:
  // - Si el slot requiere shiny (ci.is_shiny = 1), el item DEBE ser shiny (isShiny = 1).
  // - Si el slot NO requiere shiny (ci.is_shiny = 0), el item PUEDE ser normal o shiny.
  async getEligibleCollectionsForItem(
    itemId: number,
    isShiny: boolean,
  ): Promise<{ id: number; name: string; badgeImageName: string; slotIsShiny: boolean }[]> {
    return await this.databaseService.withConn(async (conn) => {
      const isShinyInt = isShiny ? 1 : 0;
      const res = await conn.query(
        `SELECT c.id, c.name, c.badge_image_name, ci.is_shiny AS slot_is_shiny
         FROM collection c
         JOIN player_collection pc ON pc.collection_id = c.id
         JOIN collection_item ci ON ci.collection_id = c.id
           AND ci.item_id = ? 
           AND (ci.is_shiny = ? OR ? = 1)
         LEFT JOIN player_collection_item pci
           ON pci.collection_id = c.id
           AND pci.item_id = ?
           AND pci.slot_is_shiny = ci.is_shiny
         WHERE pci.collection_id IS NULL`,
        [itemId, isShinyInt, isShinyInt, itemId],
      );
      return (res.values || []).map((row: any) => ({
        id: row.id,
        name: row.name,
        badgeImageName: row.badge_image_name,
        slotIsShiny: row.slot_is_shiny === 1,
      }));
    });
  }

  // Permite añadir un objeto a la colección (quitándolo del inventario)
  async addPlayerCollectionItem(
    collectionId: number,
    itemId: number,
    slotIsShiny: boolean,
    depositedIsShiny: boolean,
  ): Promise<void> {
    const set = [
      {
        statement:
          'INSERT INTO player_collection_item (collection_id, item_id, slot_is_shiny, deposited_is_shiny) VALUES (?, ?, ?, ?)',
        values: [collectionId, itemId, slotIsShiny ? 1 : 0, depositedIsShiny ? 1 : 0],
      },
      {
        statement:
          'UPDATE inventory SET quantity = quantity - 1 WHERE item_id = ? AND is_shiny = ?',
        values: [itemId, depositedIsShiny ? 1 : 0],
      },
      {
        statement: 'DELETE FROM inventory WHERE item_id = ? AND is_shiny = ? AND quantity <= 0',
        values: [itemId, depositedIsShiny ? 1 : 0],
      },
    ];

    await this.databaseService.withConn(async (conn) => {
      await conn.executeSet(set, true);
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
      // Como SQLite en versiones antiguas puede no tener UPSERT, comprobamos primero si existe la row
      const existing = await conn.query(
        'SELECT quantity FROM inventory WHERE item_id = ? AND is_shiny = ?',
        [itemId, depositedIsShiny ? 1 : 0],
      );

      const inventoryStmt =
        existing.values && existing.values.length > 0
          ? {
              statement:
                'UPDATE inventory SET quantity = quantity + 1 WHERE item_id = ? AND is_shiny = ?',
              values: [itemId, depositedIsShiny ? 1 : 0],
            }
          : {
              statement: 'INSERT INTO inventory (item_id, quantity, is_shiny) VALUES (?, 1, ?)',
              values: [itemId, depositedIsShiny ? 1 : 0],
            };

      const set = [
        {
          statement:
            'DELETE FROM player_collection_item WHERE collection_id = ? AND item_id = ? AND slot_is_shiny = ?',
          values: [collectionId, itemId, slotIsShiny ? 1 : 0],
        },
        inventoryStmt,
      ];

      await conn.executeSet(set, true);
    });
  }

  private formatDBRowToCollectionItem(row: any): CollectionItem {
    return {
      id: row.id,
      name: row.name,
      description: row.description,
      rarity: row.rarity as Rarity,
      imageName: row.image_name,
      sellPrice: row.sell_price,
      isShiny: row.slot_is_shiny === 1,
    };
  }

  private formatDBRowToCollection(row: any, items: CollectionItem[]): Collection {
    return {
      id: row.id,
      name: row.name,
      price: row.price,
      badgeImageName: row.badge_image_name,
      items: items,
    };
  }

  async buyCollectionUsingGems(collectionId: number, price: number) {
    await this.databaseService.withConn(async (conn) => {
      const checkRes = await conn.query('SELECT coins FROM player_state WHERE id = 1');
      const coins = checkRes.values?.[0]?.coins ?? 0;

      if (coins < price) {
        throw new Error('Not enough coins to buy collection');
      }

      const set = [
        {
          statement: 'UPDATE player_state SET coins = coins - ? WHERE id = 1',
          values: [price],
        },
        {
          statement: 'INSERT INTO player_collection (collection_id, purchased_at) VALUES (?, ?)',
          values: [collectionId, new Date().toISOString()],
        },
      ];

      await conn.executeSet(set, true);
    });
  }
}
