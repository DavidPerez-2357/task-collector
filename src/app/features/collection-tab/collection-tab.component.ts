import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, ViewWillEnter, ToastController } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';
import { CollectionCardComponent, CollectionItemClickEvent } from '@features/collection-tab/components/collection-card/collection-card.component';
import { CollectionItemModalComponent } from '@features/collection-tab/components/collection-item-modal/collection-item-modal.component';
import { CollectionService } from '@features/collection-tab/services/collection.service';
import { Collection, CollectionItem } from '@core/models/collection.model';

@Component({
  selector: 'app-collection-tab',
  templateUrl: 'collection-tab.component.html',
  styleUrls: ['collection-tab.component.scss'],
  imports: [
    IonContent,
    TitleSignComponent,
    CollectionCardComponent,
    CollectionItemModalComponent,
  ],
})
export class CollectionTabComponent implements ViewWillEnter {
  @ViewChild(IonContent) content!: IonContent;

  private collectionService = inject(CollectionService);
  private toastController = inject(ToastController);

  collections: Collection[] = [];

  // Modal
  selectedItem: CollectionItem | null = null;
  selectedCollectionId: number | null = null;
  isModalOpen: boolean = false;

  async ionViewWillEnter() {
    if (this.content) {
      await this.content.scrollToTop(0);
    }
    await this.loadCollections();
  }

  private async loadCollections() {
    try {
      this.collections = await this.collectionService.getOwnedCollections();
    } catch (error) {
      console.error('Error loading collections:', error);
    }
  }

  async onItemClicked(event: CollectionItemClickEvent) {
    if (event.action === 'return') {
      this.selectedItem = event.item;
      this.selectedCollectionId = event.collectionId;
      this.isModalOpen = true;
    } else if (event.action === 'deposit') {
      try {
        let depositShiny = false;
        if (event.item.isShiny) {
          // El hueco requiere shiny
          depositShiny = true;
        } else {
          // El hueco es normal. Depositamos normal si lo tenemos, sino depositamos el shiny.
          if (event.item.ownedNormal) depositShiny = false;
          else if (event.item.ownedShiny) depositShiny = true;
        }

        await this.collectionService.depositItemToCollection(
          event.collectionId,
          event.item.id,
          event.item.isShiny,  // Si el hueco de la colección es shiny
          depositShiny         // Lo que depositamos realmente
        );

        const toast = await this.toastController.create({
          message: `${event.item.name} añadido a la colección!`,
          duration: 2500,
          color: 'success',
          position: 'top',
          icon: 'checkmark-circle'
        });
        await toast.present();

        await this.loadCollections();
      } catch (e) {
        console.error('Error depositing item directly:', e);
        const toast = await this.toastController.create({
          message: 'Error al añadir el objeto a la colección',
          duration: 2500,
          color: 'danger',
          position: 'top'
        });
        await toast.present();
      }
    }
  }

  async onModalDismissed() {
    this.isModalOpen = false;
    this.selectedItem = null;
    this.selectedCollectionId = null;
    // Reload to reflect the returned item
    await this.loadCollections();
  }
}
