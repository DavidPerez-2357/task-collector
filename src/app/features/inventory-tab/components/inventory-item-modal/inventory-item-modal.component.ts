import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ItemInventory } from '@core/models/item.model';
import { rarityBackgroundColors, rarityNames, rarityTextColors } from '@core/consts/rarity.const';
import { getShinyPrice } from '@core/utils/shiny.util';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ItemService } from '@features/inventory-tab/services/item.service';

@Component({
  selector: 'app-inventory-item-modal',
  templateUrl: './inventory-item-modal.component.html',
  styleUrls: ['./inventory-item-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class InventoryItemModalComponent {
  protected readonly itemService = inject(ItemService);

  @Input() item!: ItemInventory;
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();

  // Botones de accion
  useBtnIsDisabled: boolean = false;
  sellBtnIsDisabled: boolean = false;

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

  get sellPrice(): number {
    return this.item.isShiny ? getShinyPrice(this.item.sellPrice) : this.item.sellPrice;
  }

  useItem() {
    // TODO: Implementar lógica para usar el ítem, como aplicar efectos a un Pokémon o al jugador
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
