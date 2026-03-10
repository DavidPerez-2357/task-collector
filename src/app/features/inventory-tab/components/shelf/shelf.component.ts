import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Item, ItemInventory } from '@core/models/item.model';
import { ItemComponent } from '@shared/components/item/item.component';

@Component({
  selector: 'app-shelf',
  templateUrl: './shelf.component.html',
  styleUrls: ['./shelf.component.scss'],
  imports: [ItemComponent],
})
export class ShelfComponent {
  @Input() items: ItemInventory[] = [];
  @Output() itemClicked = new EventEmitter<ItemInventory>();

  onItemClicked(item: Item | ItemInventory) {
    if (!('isShiny' in item)) {
      console.warn('Clicked item is not an inventory item: ', item.id);
      return;
    }

    this.itemClicked.emit(item);
  }
}
