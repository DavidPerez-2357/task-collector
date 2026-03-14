import {
  Component,
  EventEmitter,
  inject,
  Input,
  OnChanges,
  SimpleChanges,
  Output,
  ViewChild,
} from '@angular/core';
import { IonModal, IonSpinner } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ItemInventory } from '@core/models/item.model';
import { rarityBackgroundColors, rarityNames, rarityTextColors } from '@core/consts/rarity.const';
import { getShinyPrice } from '@core/utils/shiny.util';
import { CollectionService } from '@features/inventory-tab/services/collection.service';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ItemService } from '@features/inventory-tab/services/item.service';
import { ToastService } from '@core/services/toast.service';

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
  providers: [CollectionService, ItemService],
  imports: [IonModal, BoardComponent, ButtonComponent, IonSpinner],
})
export class InventoryItemModalComponent implements OnChanges {
  @ViewChild(IonModal) modal!: IonModal;

  @Input() item!: ItemInventory;
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();

  private collectionService = inject(CollectionService);
  private toast = inject(ToastService);
  private itemService = inject(ItemService);

  step: ModalStep = 'detail';
  eligibleCollections: EligibleCollection[] = [];
  loadingCollections = false;
  depositing = false;
  useBtnIsDisabled = false;
  sellBtnIsDisabled = false;

  ngOnChanges(changes: SimpleChanges) {
    if (changes['isOpen'] && !this.isOpen) {
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

      this.item.quantity -= 1;

      await this.toast.success(`${this.item.name} añadido a la colección ${col.name}!`);

      if (this.item.quantity <= 0) {
        this.isOpen = false;
      } else {
        await this.openCollectionStep();
      }
    } catch (e) {
      console.error('Error depositing item:', e);
      await this.toast.error('Error al añadir el objeto a la colección');
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
      .then((updatedQuantity: number) => {
        this.item.quantity = updatedQuantity;

        if (updatedQuantity <= 0) {
          // Si ya no queda el ítem, cerramos el modal
          this.isOpen = false;
        }
      })
      .catch((error: any) => {
        // TODO: Manejar errores, como mostrar un mensaje de error al usuario
      })
      .finally(() => {
        this.sellBtnIsDisabled = false;
      });
  }
}
