import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';
import { ShelfComponent } from '@features/inventory-tab/components/shelf/shelf.component';
import { ItemInventory } from '@core/models/item.model';
import { ItemService } from '@features/inventory-tab/services/item.service';
import { InventoryItemModalComponent } from '@features/inventory-tab/components/inventory-item-modal/inventory-item-modal.component';
import { GemCounterComponent } from '@shared/components/gem-counter/gem-counter.component';
import { PlayerStateService } from '@core/services/player-state.service';
import { CollectionService } from '@features/inventory-tab/services/collection.service';
import { LoadingService } from '@core/services/loading.service';
import { ErrorService } from '@core/services/error.service';

@Component({
  selector: 'app-inventory-tab',
  templateUrl: 'inventory-tab.component.html',
  styleUrls: ['inventory-tab.component.scss'],
  providers: [ItemService, CollectionService],
  imports: [
    IonContent,
    TitleSignComponent,
    ShelfComponent,
    InventoryItemModalComponent,
    GemCounterComponent,
  ],
})
export class InventoryTabComponent implements ViewWillEnter {
  protected readonly ITEMS_PER_SHELF = 3;
  protected readonly MIN_SHELVES = 3;

  private readonly itemService = inject(ItemService);
  private readonly playerStateService = inject(PlayerStateService);
  private readonly loadingService = inject(LoadingService);
  private readonly errorService = inject(ErrorService);

  @ViewChild(IonContent) content!: IonContent;

  allItems: ItemInventory[] = [];
  itemsShelves: ItemInventory[][] = [];
  playerCoins: number = 0;

  // Modal
  selectedItem: ItemInventory | null = null;
  isModalOpen: boolean = false;

  async ionViewWillEnter() {
    this.allItems = [];
    this.itemsShelves = [];
    this.playerCoins = await this.playerStateService.getCoins();

    // Poner el scroll al principio
    await this.scrollToTop();

    this.loadingService.show('Cargando inventario...');
    try {
      this.allItems = await this.itemService.getAllInventoryItems();
      this.buildShelvesFromAllItems();
    } catch (error) {
      console.error('Error loading items:', error);
      this.errorService.show('Error cargando inventario');
    } finally {
      this.loadingService.hide();
    }

    this.ensureMinShelves();
  }

  async scrollToTop() {
    if (this.content) {
      await this.content.scrollToTop(0);
    }
  }

  private buildShelvesFromAllItems() {
    this.itemsShelves = [];
    for (let i = 0; i < this.allItems.length; i += this.ITEMS_PER_SHELF) {
      this.itemsShelves.push(this.allItems.slice(i, i + this.ITEMS_PER_SHELF));
    }
  }

  removeItemFromShelves(item: ItemInventory) {
    for (let shelf of this.itemsShelves) {
      const index = shelf.findIndex(
        (shelfItem) => shelfItem.id === item.id && shelfItem.isShiny === item.isShiny,
      );
      if (index !== -1) {
        shelf.splice(index, 1);
        break;
      }
    }
  }

  private ensureMinShelves() {
    const emptyShelvesNeeded = this.MIN_SHELVES - this.itemsShelves.length;
    for (let i = 0; i < emptyShelvesNeeded; i++) {
      this.itemsShelves.push([]);
    }
  }

  itemClicked(item: ItemInventory) {
    this.selectedItem = item;
    this.isModalOpen = true;
  }

  onItemRemoveNow(item: ItemInventory) {
    // Remove immediately from shelves to avoid flicker while modal dismissal animates
    this.removeItemFromShelves(item);
  }

  async onModalDismissed() {
    this.isModalOpen = false;

    // Recargar gemas
    this.playerCoins = await this.playerStateService.getCoins();

    if (this.selectedItem && this.selectedItem.quantity <= 0) {
      this.removeItemFromShelves(this.selectedItem);
    }

    this.selectedItem = null;
  }
}
