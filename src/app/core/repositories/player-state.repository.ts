import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';

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
      await conn.query('UPDATE player_state SET coins = ? WHERE id = 1', [newCoins]);
    });
  }

  async addCoins(coinsToAdd: number): Promise<void> {
    console.log(`Adding ${coinsToAdd} coins to player state`);
    await this.databaseService.withConn(async (conn) => {
      await conn.query('UPDATE player_state SET coins = coins + ? WHERE id = 1', [coinsToAdd]);
    });
  }
}
