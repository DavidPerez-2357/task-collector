import { Component, EventEmitter, inject, Input, Output, ViewChild } from '@angular/core';
import { IonButton, IonModal, ToastController } from '@ionic/angular/standalone';
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
  @ViewChild(IonModal) modal!: IonModal;

  @Input() item!: CollectionItem;
  @Input() collectionId!: number;
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();

  private collectionService = inject(CollectionService);
  private toastController = inject(ToastController);

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
    try {
      await this.collectionService.returnItemToInventory(
        this.collectionId,
        this.item.id,
        this.item.isShiny,
        this.isShinyDeposited,
      );

      const toast = await this.toastController.create({
        message: `${this.item.name} devuelto al inventario`,
        duration: 2500,
        color: 'secondary',
        position: 'top',
        icon: 'arrow-undo-outline',
      });
      await toast.present();

      this.modal.dismiss();
    } catch (e) {
      console.error('Error returning item:', e);
      const toast = await this.toastController.create({
        message: 'Error al devolver el objeto al inventario',
        duration: 2500,
        color: 'danger',
        position: 'top',
      });
      await toast.present();
    }
  }
}

