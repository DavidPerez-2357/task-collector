import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { SQLiteDBConnection } from '@capacitor-community/sqlite';

@Injectable({
  providedIn: 'root',
})
export class PlayerStateRepository {
  private databaseService = inject(DatabaseService);

  async getCoins(): Promise<number> {
    return await this.databaseService.withConn(async (conn) => {
      const result = await conn.query('SELECT coins FROM player_state WHERE id = 1');
      return result.values?.[0]?.coins;
    });
  }

  async updateCoins(newCoins: number): Promise<void> {
    await this.databaseService.withConn(async (conn) => {
      const res = await conn.run('UPDATE player_state SET coins = ? WHERE id = 1', [newCoins]);

      if (!res.changes || res.changes.changes === 0) {
        throw new Error('No se pudo actualizar las monedas');
      }
    });
  }

  async addCoins(coinsToAdd: number): Promise<void> {
    await this.databaseService.withConn(async (conn) => {
      const res = await conn.run('UPDATE player_state SET coins = coins + ? WHERE id = 1', [
        coinsToAdd,
      ]);

      if (!res.changes || res.changes.changes === 0) {
        throw new Error('No se pudo agregar monedas');
      }
    });
  }
}
