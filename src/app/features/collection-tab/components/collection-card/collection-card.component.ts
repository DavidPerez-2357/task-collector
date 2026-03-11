import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Collection, CollectionItem } from '@core/models/collection.model';

export interface CollectionItemClickEvent {
  item: CollectionItem;
  collectionId: number;
}

@Component({
  selector: 'app-collection-card',
  templateUrl: './collection-card.component.html',
  styleUrls: ['./collection-card.component.scss'],
  imports: [],
})
export class CollectionCardComponent {
  @Input({ required: true }) collection!: Collection;
  @Output() itemClicked = new EventEmitter<CollectionItemClickEvent>();

  readonly GRID_SIZE = 6;

  /** Always returns an array of exactly GRID_SIZE slots (null = empty slot). */
  get slots(): (CollectionItem | null)[] {
    const slots: (CollectionItem | null)[] = [];
    for (let i = 0; i < this.GRID_SIZE; i++) {
      slots.push(this.collection.items[i] ?? null);
    }
    return slots;
  }

  /** True when every item that has been deposited is shiny. */
  get allDepositedAreShiny(): boolean {
    const deposited = this.collection.items.filter((it) => it.deposited !== undefined);
    if (deposited.length === 0) return false;
    return deposited.every((it) => it.deposited!.isShiny);
  }

  get badgeImagePath(): string {
    // badgeImageName already contains the full relative path in the DB
    // e.g. "assets/item-images/fb554.png" or "assets/badges/badge.png"
    return this.collection.badgeImageName;
  }

  itemImagePath(item: CollectionItem): string {
    return `assets/item-images/${item.imageName}`;
  }

  onSlotClicked(item: CollectionItem) {
    if (item.deposited !== undefined) {
      this.itemClicked.emit({ item, collectionId: this.collection.id });
    }
  }
}
