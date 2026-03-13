import { inject, Injectable } from '@angular/core';
import { CollectionRepository } from '@core/repositories/collection.repository';
import { Collection } from '@core/models/collection.model';

@Injectable({
  providedIn: 'root',
})
export class CollectionService {
  private collectionRepository = inject(CollectionRepository);

  async getOwnedCollections(): Promise<Collection[]> {
    const [ownedIds, allCollections] = await Promise.all([
      this.collectionRepository.getPlayerCollections(),
      this.collectionRepository.getAllCollections(),
    ]);

    const ownedSet = new Set(ownedIds);
    return allCollections.filter((c) => ownedSet.has(c.id));
  }

  async getCollectionById(id: number): Promise<Collection | null> {
    return this.collectionRepository.getCollectionById(id);
  }

  async returnItemToInventory(
    collectionId: number,
    itemId: number,
    slotIsShiny: boolean,
    depositedIsShiny: boolean,
  ): Promise<void> {
    await this.collectionRepository.removePlayerCollectionItem(
      collectionId,
      itemId,
      slotIsShiny,
      depositedIsShiny,
    );
  }

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

  async getUnownedCollections(): Promise<Collection[]> {
    const [ownedIds, allCollections] = await Promise.all([
      this.collectionRepository.getPlayerCollections(),
      this.collectionRepository.getAllCollections(),
    ]);

    const ownedSet = new Set(ownedIds);
    return allCollections.filter((c) => !ownedSet.has(c.id));
  }

  async buyCollection(collectionId: number, price: number) {
    await this.collectionRepository.buyCollectionUsingGems(collectionId, price);
  }
}
