import { inject, Injectable } from '@angular/core';
import { CollectionRepository } from '@core/repositories/collection.repository';
import { Collection } from '@core/models/collection.model';
@Injectable()
export class ShopService {
  private collectionRepository = inject(CollectionRepository);

  async buyCollection(collectionId: number, price: number) {
    await this.collectionRepository.buyCollectionUsingGems(collectionId, price);
  }
  async getUnownedCollections(): Promise<Collection[]> {
    const [ownedIds, allCollections] = await Promise.all([
      this.collectionRepository.getPlayerCollections(),
      this.collectionRepository.getAllCollections(),
    ]);

    const ownedSet = new Set(ownedIds);
    return allCollections.filter((c) => !ownedSet.has(c.id));
  }
}
