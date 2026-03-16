import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ItemInventory } from '@core/models/item.model';
import { rarityBackgroundColors, rarityNames, rarityTextColors } from '@core/consts/rarity.const';

@Component({
  selector: 'app-item-acquired-modal',
  templateUrl: './item-acquired-modal.component.html',
  styleUrls: ['./item-acquired-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class ItemAcquiredModalComponent {
  @ViewChild(IonModal) modal!: IonModal;

  @Input() isOpen: boolean = false;
  @Input() item: ItemInventory | null = null;
  @Input() amount: number = 1;

  @Output() dismissed = new EventEmitter<void>();
  @Output() acknowledged = new EventEmitter<void>();

  onDismiss() {
    this.dismissed.emit();
  }

  closeModal() {
    try {
      this.modal.dismiss();
    } catch (e) {
      // ignore
    }
    this.acknowledged.emit();
  }

  get rarityName(): string {
    if (!this.item) return 'Desconocida';

    return rarityNames[this.item.rarity] || 'Desconocida';
  }

  get rarityBackgroundColor(): string {
    if (!this.item) return '#fff';

    return rarityBackgroundColors[this.item.rarity];
  }

  get rarityTextColor(): string {
    if (!this.item) return '#000';

    return rarityTextColors[this.item.rarity];
  }

  get itemImage(): string {
    if (!this.item) return '';
    return `/assets/item-images/${this.item.imageName}`;
  }
}
