import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';
import { PlayerStateService } from '@core/services/player-state.service';
import { Collection } from '@core/models/collection.model';
import { ShopBuyModalComponent } from './components/shop-buy-modal/shop-buy-modal.component';
import { GemCounterComponent } from '@shared/components/gem-counter/gem-counter.component';
import { ShopCardComponent } from './components/shop-card/shop-card.component';
import { ShopService } from './services/shop.service';
import { ToastService } from '@core/services/toast.service';
import { AudioService } from '@core/services/audio.service';
import { LoadingService } from '@core/services/loading.service';
import { ErrorService } from '@core/services/error.service';
import { ItemService } from '@features/inventory-tab/services/item.service';

@Component({
  selector: 'app-shop-tab',
  templateUrl: 'shop-tab.component.html',
  styleUrls: ['shop-tab.component.scss'],
  providers: [ShopService, ItemService],
  imports: [
    IonContent,
    TitleSignComponent,
    ShopBuyModalComponent,
    GemCounterComponent,
    ShopCardComponent,
  ],
})
export class ShopTabComponent implements ViewWillEnter {
  @ViewChild(IonContent) content!: IonContent;
  private shopService = inject(ShopService);
  private playerStateService = inject(PlayerStateService);
  private toast = inject(ToastService);
  private audioService = inject(AudioService);
  private loadingService = inject(LoadingService);
  private errorService = inject(ErrorService);
  private itemService = inject(ItemService);

  unownedCollections: Collection[] = [];
  playerCoins: number = 0;
  isBuying: boolean = false;

  // Mapa itemId -> cantidad
  inventoryCounts: Record<number, number> = {};

  selectedCollection: Collection | null = null;
  isModalOpen: boolean = false;

  // Refresca al entrar a la tab por si ha ganado gemas en otra pestaña
  async ionViewWillEnter() {
    if (this.content) {
      await this.content.scrollToTop(0);
    }
    await this.loadData();
  }

  async loadData() {
    try {
      await this.loadingService.runWithLoading(async () => {
        const [collections, coins, inventory] = await Promise.all([
          this.shopService.getUnownedCollections(),
          this.playerStateService.getCoins(),
          this.itemService.getAllInventoryItems(),
        ]);
        this.unownedCollections = collections;
        this.playerCoins = coins;

        // Construir el mapa de cantidades
        const map: Record<number, number> = {};
        for (const it of inventory) {
          map[it.id] = (map[it.id] ?? 0) + (it.quantity ?? 0);
        }
        this.inventoryCounts = map;
      }, 'Cargando tienda...');
    } catch (error) {
      this.errorService.handle(error, 'Error al cargar la tienda');
    }
  }

  openBuyModal(collection: Collection) {
    this.selectedCollection = collection;
    this.isModalOpen = true;
  }

  onModalDismissed() {
    this.isModalOpen = false;
  }
  async handleInsufficientFunds() {
    await this.toast.error('No tienes gemas suficientes.');
  }
  async handlePurchase(collection: Collection) {
    if (this.isBuying) return;
    this.isBuying = true;
    try {
      await this.shopService.buyCollection(collection.id, collection.price);
      await this.audioService.playBuyCollection();
      this.updateUISuccess(collection);
      await this.toast.success(`¡Colección ${collection.name} adquirida!`);
    } catch (error) {
      this.errorService.handle(error, 'Error al comprar la colección');
    } finally {
      this.isBuying = false;
    }
  }

  private updateUISuccess(collection: Collection) {
    this.unownedCollections = this.unownedCollections.filter((c) => c.id !== collection.id);
    this.playerCoins -= collection.price;
    this.isModalOpen = false;
  }
}
