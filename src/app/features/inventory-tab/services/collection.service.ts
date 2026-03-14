import { inject, Injectable } from '@angular/core';
import { CollectionRepository } from '@core/repositories/collection.repository';

@Injectable()
export class CollectionService {
  private collectionRepository = inject(CollectionRepository);

  async getEligibleCollectionsForItem(itemId: number, isShiny: boolean) {
    return this.collectionRepository.getEligibleCollectionsForItem(itemId, isShiny);
  }

  async depositItemToCollection(
    collectionId: number,
    itemId: number,
    slotIsShiny: boolean,
    depositedIsShiny: boolean,
  ): Promise<void> {
    await this.collectionRepository.addPlayerCollectionItem(
      collectionId,
      itemId,
      slotIsShiny,
      depositedIsShiny,
    );
  }
}
