import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, IonSpinner, ViewWillEnter } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';
import { PlayerStateService } from '@core/services/player-state.service';
import { Collection } from '@core/models/collection.model';
import { ShopBuyModalComponent } from './components/shop-buy-modal/shop-buy-modal.component';
import { GemCounterComponent } from '@shared/components/gem-counter/gem-counter.component';
import { ShopCardComponent } from './components/shop-card/shop-card.component';
import { ShopService } from './services/shop.service';
import { ToastService } from '@core/services/toast.service';
@Component({
  selector: 'app-shop-tab',
  templateUrl: 'shop-tab.component.html',
  styleUrls: ['shop-tab.component.scss'],
  imports: [
    IonContent,
    TitleSignComponent,
    IonSpinner,
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

  unownedCollections: Collection[] = [];
  playerCoins: number = 0;
  isLoading: boolean = true;
  isBuying: boolean = false;

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
    this.isLoading = true;
    try {
      const [collections, coins] = await Promise.all([
        this.shopService.getUnownedCollections(),
        this.playerStateService.getCoins(),
      ]);
      this.unownedCollections = collections;
      this.playerCoins = coins;
    } catch (error) {
      console.error('Error al cargar la tienda', error);
    } finally {
      this.isLoading = false;
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
      this.updateUISuccess(collection);
      await this.toast.success(`¡Colección ${collection.name} adquirida!`);
    } catch (error) {
      console.error('Error al comprar la colección', error);
    } finally {
      this.isBuying = false;
    }
  }

  private updateUISuccess(collection: Collection) {
    this.unownedCollections = this.unownedCollections.filter((c) => c.id !== collection.id);
    this.playerCoins -= collection.price;
    this.isModalOpen = false;
  }

  private async showToast(message: string, color: 'success' | 'danger', icon?: string) {
    // Mantener método por compatibilidad, delega al ToastService
    if (color === 'success') {
      await this.toast.success(message);
    } else {
      await this.toast.error(message);
    }
  }

  itemImagePath(imageName: string): string {
    return `/assets/item-images/${imageName}`;
  }
}
