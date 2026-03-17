import { inject, Injectable } from '@angular/core';
import { PlayerStateRepository } from '@core/repositories/player-state.repository';

@Injectable({ providedIn: 'root' })
export class PlayerStateService {
  private readonly PlayerStateRepository = inject(PlayerStateRepository);

  async getCoins(): Promise<number> {
    return await this.PlayerStateRepository.getCoins();
  }

  async updateCoins(newCoins: number): Promise<void> {
    await this.PlayerStateRepository.updateCoins(newCoins);
  }

  async addCoins(coinsToAdd: number): Promise<void> {
    await this.PlayerStateRepository.addCoins(coinsToAdd);
  }
}
