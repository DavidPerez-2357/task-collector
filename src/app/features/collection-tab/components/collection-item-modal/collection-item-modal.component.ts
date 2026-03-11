import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IonButton, IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { CollectionItem } from '@core/models/collection.model';
import { rarityBackgroundColors, rarityNames, rarityTextColors } from '@core/consts/rarity.const';
import { CollectionService } from '@features/collection-tab/services/collection.service';

@Component({
  selector: 'app-collection-item-modal',
  templateUrl: './collection-item-modal.component.html',
  styleUrls: ['./collection-item-modal.component.scss'],
  imports: [IonModal, BoardComponent, IonButton],
})
export class CollectionItemModalComponent {
  @Input() item!: CollectionItem;
  @Input() collectionId!: number;
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();

  private collectionService = inject(CollectionService);

  onDismiss() {
    this.dismissed.emit();
  }

  get rarityName(): string {
    return rarityNames[this.item.rarity] || 'Desconocida';
  }

  get itemImage(): string {
    return `/assets/item-images/${this.item.imageName}`;
  }

  get rarityBackgroundColor(): string {
    return rarityBackgroundColors[this.item.rarity];
  }

  get rarityTextColor(): string {
    return rarityTextColors[this.item.rarity];
  }

  get isShinyDeposited(): boolean {
    return this.item.deposited?.isShiny ?? false;
  }

  async sendToInventory() {
    await this.collectionService.returnItemToInventory(
      this.collectionId,
      this.item.id,
      this.item.isShiny,
      this.isShinyDeposited,
    );
    this.dismissed.emit();
  }
}
