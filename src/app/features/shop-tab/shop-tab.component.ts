import { Component, inject, OnInit } from '@angular/core';
import { IonContent, IonSpinner, ToastController } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';
import { BoardComponent } from '@shared/components/board/board.component';
import { CollectionService } from '@features/collection-tab/services/collection.service';
import { PlayerStateService } from '@core/services/player-state.service';
import { Collection } from '@core/models/collection.model';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ShopBuyModalComponent } from './components/shop-buy-modal/shop-buy-modal.component';
import { GemCounterComponent } from '@shared/components/gem-counter/gem-counter.component';

@Component({
  selector: 'app-shop-tab',
  templateUrl: 'shop-tab.component.html',
  styleUrls: ['shop-tab.component.scss'],
  imports: [IonContent, TitleSignComponent, ButtonComponent, IonSpinner, ShopBuyModalComponent, GemCounterComponent],
})
export class ShopTabComponent implements OnInit {
  private collectionService = inject(CollectionService);
  private playerStateService = inject(PlayerStateService);
  private toastController = inject(ToastController);

  unownedCollections: Collection[] = [];
  playerCoins: number = 0;
  isLoading: boolean = true;
  isBuying: boolean = false;

  selectedCollection: Collection | null = null;
  isModalOpen: boolean = false;

  async ngOnInit() {
    await this.loadData();
  }

  // Refresca al entrar a la tab por si ha ganado gemas en otra pestaña
  async ionViewWillEnter() {
    await this.loadData();
  }

  async loadData(){
    this.isLoading = true;
    try{
      const [collections, coins] = await Promise.all([
        this.collectionService.getUnownedCollections(),
        this.playerStateService.getCoins()
      ]);
      this.unownedCollections = collections;
      this.playerCoins = coins;
    }catch(error){
      console.error("Error al cargar la tienda", error);
    }finally{
      this.isLoading = false;
    }
  }
  
  openBuyModal(collection: Collection) {
    this.selectedCollection = collection;
    this.isModalOpen = true;
  }

  onModalDismissed(){
    this.isModalOpen = false;
  }

  async handlePurchase(collection: Collection){
    if(this.isBuying) return;
    this.isBuying = true;
    try{
      await this.collectionService.buyCollection(collection.id, collection.price);
      this.updateUISuccess(collection);
      await this.showToast(`¡Colección ${collection.name} adquirida!`, 'success', 'checkmark-circle');
    }catch(error){
      console.error("Error al comprar la colección", error);
    }finally{
      this.isBuying = false;
    }
  }

  private updateUISuccess(collection: Collection){
    this.unownedCollections = this.unownedCollections.filter(c => c.id !== collection.id);
    this.playerCoins -= collection.price;
    this.isModalOpen = false;
  }
  
  private async showToast(message: string, color: 'success' | 'danger', icon?: string) {
    const toast = await this.toastController.create({
      message,
      duration: 2500,
      color,
      position: 'top',
      icon
    });
    await toast.present();
  }

  itemImagePath(imageName: string): string {
    return `/assets/item-images/${imageName}`;
  }
}