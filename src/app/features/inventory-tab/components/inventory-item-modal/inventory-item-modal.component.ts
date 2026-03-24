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
import { AudioService } from '@core/services/audio.service';
import { AsyncActionGuard } from '@core/utils/async-action-guard.util';

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
  imports: [IonModal, BoardComponent, ButtonComponent, IonSpinner],
})
export class InventoryItemModalComponent implements OnChanges {
  @ViewChild(IonModal) modal!: IonModal;

  @Input() item!: ItemInventory;
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();
  // Emitted when the modal is about to remove the underlying item so parent can update UI immediately
  @Output() removeNow = new EventEmitter<ItemInventory>();

  private collectionService = inject(CollectionService);
  private toast = inject(ToastService);
  private itemService = inject(ItemService);
  private audioService = inject(AudioService);

  step: ModalStep = 'detail';
  eligibleCollections: EligibleCollection[] = [];

  readonly sellGuard = new AsyncActionGuard();
  readonly depositGuard = new AsyncActionGuard();
  readonly collectionsGuard = new AsyncActionGuard();

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
    this.eligibleCollections = [];
    await this.collectionsGuard.run(async () => {
      try {
        this.eligibleCollections = await this.collectionService.getEligibleCollectionsForItem(
          this.item.id,
          this.item.isShiny,
        );
      } catch (e) {
        await this.toast.error('Error cargando colecciones elegibles');
      }
    });
  }

  async depositInto(col: EligibleCollection) {
    await this.depositGuard.run(async () => {
      try {
        await this.collectionService.depositItemToCollection(
          col.id,
          this.item.id,
          col.slotIsShiny,
          this.item.isShiny,
        );

        this.item.quantity -= 1;

        await this.toast.success(`${this.item.name} añadido a la colección ${col.name}!`);
        await this.audioService.playPutItemCollection();

        const isCompleted = await this.collectionService.checkCompletion(col.id);
        if (isCompleted) {
          await this.audioService.playCompleteCollection();
        }

        if (this.item.quantity <= 0) {
          // Tell parent to remove the item right away (update shelves) before running modal dismiss animation
          try {
            this.removeNow.emit(this.item);
          } catch (err) {
            console.warn('removeNow emit failed', err);
          }
          // Close the modal using IonModal.dismiss() so Ionic runs the native animation.
          await this.safeDismissModal();
        } else {
          await this.openCollectionStep();
        }
      } catch (e) {
        await this.toast.error('Error al añadir el objeto a la colección');
      }
    });
  }

  async sellItem() {
    await this.sellGuard.run(async () => {
      try {
        // TODO: Mostrar confirmación si es shiny
        const updatedQuantity = await this.itemService.sellItem(this.item.id, this.item.isShiny);

        await this.audioService.playSellItem();
        this.item.quantity = updatedQuantity;

        if (updatedQuantity <= 0) {
          // Tell parent to remove the item immediately from shelves
          try {
            this.removeNow.emit(this.item);
          } catch (err) {
            console.warn('removeNow emit failed', err);
          }
          // Close modal so parent can clean up the shelf; let didDismiss -> onDismiss emit the event.
          await this.safeDismissModal();
        }
      } catch (error: any) {
        await this.toast.error('Error al vender el objeto');
      }
    });
  }

  // Helper: dismiss modal via IonModal.dismiss(); if unavailable, emit dismissed after a small timeout
  private async safeDismissModal() {
    try {
      if (this.modal && typeof (this.modal as any).dismiss === 'function') {
        await (this.modal as any).dismiss();
        return;
      }
    } catch (e) {
      console.warn('safeDismissModal: modal.dismiss() failed', e);
    }

    // Fallback: emit dismissed after a short delay so parent can clean up,
    // but avoid emitting immediately to reduce the chance of UI flicker.
    setTimeout(() => {
      try {
        this.dismissed.emit();
      } catch (err) {
        console.error('safeDismissModal fallback emit failed', err);
      }
    }, 50);
  }
}
