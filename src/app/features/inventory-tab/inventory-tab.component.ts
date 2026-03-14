import { Component, inject, ViewChild } from '@angular/core';
import {
  IonContent,
  IonInfiniteScroll,
  IonInfiniteScrollContent,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';
import { ShelfComponent } from '@features/inventory-tab/components/shelf/shelf.component';
import { ItemInventory } from '@core/models/item.model';
import { ItemService } from '@features/inventory-tab/services/item.service';
import { InventoryItemModalComponent } from '@features/inventory-tab/components/inventory-item-modal/inventory-item-modal.component';
import { InfiniteScrollCustomEvent } from '@ionic/angular';
import { GemCounterComponent } from '@shared/components/gem-counter/gem-counter.component';
import { PlayerStateService } from '@core/services/player-state.service';

@Component({
  selector: 'app-inventory-tab',
  templateUrl: 'inventory-tab.component.html',
  styleUrls: ['inventory-tab.component.scss'],
  providers: [ItemService],
  imports: [
    IonContent,
    TitleSignComponent,
    ShelfComponent,
    IonInfiniteScroll,
    IonInfiniteScrollContent,
    InventoryItemModalComponent,
    GemCounterComponent,
  ],
})
export class InventoryTabComponent implements ViewWillEnter {
  protected readonly ITEMS_PER_SHELF = 3;
  protected readonly MIN_SHELVES = 3;
  protected readonly SHELVES_PER_PAGE = 5;
  protected readonly PAGE_SIZE = this.ITEMS_PER_SHELF * this.SHELVES_PER_PAGE;

  private readonly itemService = inject(ItemService);
  private readonly playerStateService = inject(PlayerStateService);

  @ViewChild(IonContent) content!: IonContent;
  @ViewChild(IonInfiniteScroll) infiniteScroll?: IonInfiniteScroll;

  actualPage: number = 1;
  allItems: ItemInventory[] = [];
  itemsShelves: ItemInventory[][] = [];
  playerCoins: number = 0;

  // Modal
  selectedItem: ItemInventory | null = null;
  isModalOpen: boolean = false;

  async ionViewWillEnter() {
    this.allItems = [];
    this.itemsShelves = [];
    this.actualPage = 1;
    this.playerCoins = await this.playerStateService.getCoins();

    // Poner el scroll al principio
    await this.scrollToTop();

    await this.loadMoreItems(this.actualPage);
    this.ensureMinShelves();
  }

  async scrollToTop() {
    if (this.content) {
      await this.content.scrollToTop(0);
    }
  }

  async loadMoreItems(page: number): Promise<void> {
    try {
      const newItems = await this.itemService.getInventoryItemsPaginated(page, this.PAGE_SIZE);
      this.allItems = [...this.allItems, ...newItems];
      this.pushPageItemsToShelves(page);
    } catch (error) {
      console.error('Error loading items:', error);
      // TODO: Mostrar un mensaje de error al usuario
    }
  }

  pushPageItemsToShelves(page: number) {
    const startIndex = (page - 1) * this.PAGE_SIZE;
    const endIndex = startIndex + this.PAGE_SIZE;
    const pageItems = this.allItems.slice(startIndex, endIndex);

    for (let i = 0; i < pageItems.length; i++) {
      const shelfIndex = Math.floor((startIndex + i) / this.ITEMS_PER_SHELF);
      const item = pageItems[i];

      if (!this.itemsShelves[shelfIndex]) {
        this.itemsShelves[shelfIndex] = [];
      }

      if (item === undefined) {
        console.warn(`Item at index ${startIndex + i} is undefined. Skipping.`);
        continue;
      }

      this.itemsShelves[shelfIndex].push(item);
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

  protected async onIonInfinite($event: InfiniteScrollCustomEvent) {
    if (this.allItems.length < this.PAGE_SIZE * this.actualPage) {
      $event.target.disabled = true;
      await $event.target.complete();
      return;
    }

    this.actualPage++;
    await this.loadMoreItems(this.actualPage);
    await $event.target.complete();
  }

  itemClicked(item: ItemInventory) {
    this.selectedItem = item;
    this.isModalOpen = true;
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
