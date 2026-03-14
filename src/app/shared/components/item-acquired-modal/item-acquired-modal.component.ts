import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ItemInventory } from '@core/models/item.model';

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

  get itemImage(): string {
    if (!this.item) return '';
    return `/assets/item-images/${this.item.imageName}`;
  }
}
