import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Collection, CollectionItem } from '@core/models/collection.model';

import { CollectionItemClickEvent } from '../../interfaces/collection.interface';
import { BoardComponent } from '@shared/components/board/board.component';

@Component({
  selector: 'app-collection-card',
  templateUrl: './collection-card.component.html',
  styleUrls: ['./collection-card.component.scss'],
  imports: [BoardComponent],
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

  /** True if all items in the collection have been deposited */
  get isCompleted(): boolean {
    return this.collection.items.every((it) => it.deposited !== undefined);
  }

  /** True when the collection is completed AND every deposited item is shiny. */
  get allDepositedAreShiny(): boolean {
    if (!this.isCompleted) return false;
    return this.collection.items.every((it) => it.deposited!.isShiny);
  }

  get badgeImagePath(): string {
    return this.collection.badgeImageName.startsWith('/')
      ? this.collection.badgeImageName
      : `/${this.collection.badgeImageName}`;
  }

  itemImagePath(item: CollectionItem): string {
    return `/assets/item-images/${item.imageName}`;
  }

  onSlotClicked(item: CollectionItem) {
    if (item.deposited !== undefined) {
      this.itemClicked.emit({ item, collectionId: this.collection.id, action: 'return' });
    } else if (item.ownedEligible) {
      this.itemClicked.emit({ item, collectionId: this.collection.id, action: 'deposit' });
    }
  }
}
