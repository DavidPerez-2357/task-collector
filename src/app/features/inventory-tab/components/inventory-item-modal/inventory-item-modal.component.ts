import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { IonButton, IonModal, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ItemInventory } from '@core/models/item.model';
import { rarityBackgroundColors, rarityNames, rarityTextColors } from '@core/consts/rarity.const';
import { getShinyPrice } from '@core/utils/shiny.util';
import { CollectionService } from '@features/collection-tab/services/collection.service';

interface EligibleCollection {
  id: number;
  name: string;
  badgeImageName: string;
  slotIsShiny: boolean;
}

type ModalStep = 'detail' | 'collections';

@Component({
  selector: 'app-inventory-item-modal',
  templateUrl: './inventory-item-modal.component.html',
  styleUrls: ['./inventory-item-modal.component.scss'],
  imports: [IonModal, BoardComponent, IonButton, IonSpinner],
})
export class InventoryItemModalComponent implements OnChanges {
  @Input() item!: ItemInventory;
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();

  private collectionService = inject(CollectionService);
  private toastController = inject(ToastController);

  step: ModalStep = 'detail';
  eligibleCollections: EligibleCollection[] = [];
  loadingCollections = false;
  depositing = false;

  async ngOnChanges() {
    if (!this.isOpen) {
      // Reset al cerrar
      this.step = 'detail';
      this.eligibleCollections = [];
    }
  }

  onDismiss() {
    this.step = 'detail';
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

  get sellPrice(): number {
    return this.item.isShiny ? getShinyPrice(this.item.sellPrice) : this.item.sellPrice;
  }

  async openCollectionStep() {
    this.step = 'collections';
    this.loadingCollections = true;
    this.eligibleCollections = [];
    try {
      this.eligibleCollections = await this.collectionService.getEligibleCollectionsForItem(
        this.item.id,
        this.item.isShiny,
      );
    } catch (e) {
      console.error('Error loading eligible collections:', e);
    } finally {
      this.loadingCollections = false;
    }
  }

  async depositInto(col: EligibleCollection) {
    if (this.depositing) return;
    this.depositing = true;
    try {
      await this.collectionService.depositItemToCollection(
        col.id,
        this.item.id,
        col.slotIsShiny,
        this.item.isShiny,
      );
      
      const toast = await this.toastController.create({
        message: `${this.item.name} añadido a la colección ${col.name}!`,
        duration: 2500,
        color: 'success',
        position: 'top',
        icon: 'checkmark-circle'
      });
      await toast.present();

      this.step = 'detail';
      this.dismissed.emit(); // Cierra el modal y recarga el inventario
    } catch (e) {
      console.error('Error depositing item:', e);
      const toast = await this.toastController.create({
        message: 'Error al añadir el objeto a la colección',
        duration: 2500,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.depositing = false;
    }
  }

  sellItem() {
    if (this.item.isShiny) {
      // TODO: Mostrar mensaje de confirmación para vender
    }

    this.sellBtnIsDisabled = true;

    // llamar al servicio para vender el ítem
    this.itemService
      .sellItem(this.item.id, this.item.isShiny)
      .then((updatedQuantity) => {
        this.item.quantity = updatedQuantity;

        if (updatedQuantity <= 0) {
          // Si ya no queda el ítem, cerramos el modal
          this.isOpen = false;
        }
      })
      .catch((error) => {
        // TODO: Manejar errores, como mostrar un mensaje de error al usuario
      })
      .finally(() => {
        this.sellBtnIsDisabled = false;
      });
  }
}
