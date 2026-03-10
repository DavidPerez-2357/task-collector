import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Item, ItemInventory } from '@core/models/item.model';
import { NgOptimizedImage } from '@angular/common';
import { rarityBackgroundColors } from '@core/consts/rarity.const';

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
  imports: [NgOptimizedImage],
})
export class ItemComponent {
  @Input({ required: true }) item!: ItemInventory | Item;
  @Input() pixelSize: number = 64;
  @Output() itemClicked = new EventEmitter<Item | ItemInventory>();

  get rarityColor(): string {
    return rarityBackgroundColors[this.item.rarity];
  }

  get itemImagePath(): string {
    return `assets/item-images/${this.item.imageName}`;
  }
}
