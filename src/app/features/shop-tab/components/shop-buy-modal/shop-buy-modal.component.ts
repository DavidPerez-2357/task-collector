import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { Collection } from '@core/models/collection.model';

@Component({
  selector: 'app-shop-buy-modal',
  templateUrl: './shop-buy-modal.component.html',
  styleUrls: ['./shop-buy-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class ShopBuyModalComponent {
  @ViewChild(IonModal) modal!: IonModal;

  @Input() collection: Collection | null = null;
  @Input() isOpen: boolean = false;
  @Input() isBuying: boolean = false; // Recibimos el estado de carga desde el padre
  @Input() playerCoins: number = 0;

  @Output() dismissed = new EventEmitter<void>();
  @Output() confirmPurchase = new EventEmitter<Collection>();

  onDismiss() {
    this.dismissed.emit();
  }

  onConfirm() {
    if (this.collection && !this.isBuying) {
      this.confirmPurchase.emit(this.collection);
    }
  }

  closeModal() {
    this.modal.dismiss();
  }
}