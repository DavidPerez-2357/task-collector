import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Collection } from '@core/models/collection.model';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-shop-card',
  templateUrl: './shop-card.component.html',
  styleUrls: ['./shop-card.component.scss'],
  imports: [ButtonComponent]
})
export class ShopCardComponent {
  @Input({ required: true }) collection!: Collection;
  @Input({ required: true }) playerCoins!: number;
  
  @Output() buyClicked = new EventEmitter<Collection>();

  itemImagePath(imageName: string): string {
    return `/assets/item-images/${imageName}`;
  }

  onBuyClick() {
    this.buyClicked.emit(this.collection);
  }
}