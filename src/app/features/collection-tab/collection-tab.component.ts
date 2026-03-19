import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';
import { CollectionCardComponent } from '@features/collection-tab/components/collection-card/collection-card.component';
import { CollectionItemClickEvent } from '@features/collection-tab/interfaces/collection.interface';
import { CollectionItemModalComponent } from '@features/collection-tab/components/collection-item-modal/collection-item-modal.component';
import { CollectionService } from '@features/collection-tab/services/collection.service';
import { Collection, CollectionItem } from '@core/models/collection.model';
import { ToastService } from '@core/services/toast.service';
import { AudioService } from '@core/services/audio.service';
import { LoadingService } from '@core/services/loading.service';
import { ErrorService } from '@core/services/error.service';

@Component({
  selector: 'app-collection-tab',
  templateUrl: 'collection-tab.component.html',
  styleUrls: ['collection-tab.component.scss'],
  providers: [CollectionService],
  imports: [IonContent, TitleSignComponent, CollectionCardComponent, CollectionItemModalComponent],
})
export class CollectionTabComponent implements ViewWillEnter {
  @ViewChild(IonContent) content!: IonContent;

  private collectionService = inject(CollectionService);
  private toast = inject(ToastService);
  private audioService = inject(AudioService);
  private loadingService = inject(LoadingService);
  private errorService = inject(ErrorService);

  collections: Collection[] = [];

  // Modal
  selectedItem: CollectionItem | null = null;
  selectedCollectionId: number | null = null;
  isModalOpen: boolean = false;

  async ionViewWillEnter() {
    if (this.content) {
      await this.content.scrollToTop(0);
    }
    try {
      await this.loadingService.runWithLoading(
        () => this.loadCollections(),
        'Cargando colecciones...',
      );
    } catch (e) {
      this.errorService.handle(e, 'Error cargando colecciones');
    }
  }

  private async loadCollections() {
    this.collections = await this.collectionService.getOwnedCollections();
  }

  private async reloadCollection(collectionId: number) {
    try {
      await this.loadingService.runWithLoading(async () => {
        const updated = await this.collectionService.getCollectionById(collectionId);
        if (updated) {
          const index = this.collections.findIndex((c) => c.id === collectionId);
          if (index !== -1) {
            this.collections[index] = updated;
          }
        }
      }, 'Actualizando colección...');
    } catch (error) {
      this.errorService.handle(error, 'Error actualizando la colección');
    }
  }

  // Actualiza SOLO la colección indicada en memoria sin mostrar el loading global.
  private async updateCollectionInPlace(collectionId: number) {
    try {
      const updated = await this.collectionService.getCollectionById(collectionId);
      if (!updated) return;
      const index = this.collections.findIndex((c) => c.id === collectionId);
      if (index !== -1) {
        // Reemplazamos la colección en el array para que Angular detecte el cambio
        this.collections[index] = updated;
      }
    } catch (error) {
      this.errorService.handle(error, 'Error actualizando la colección');
    }
  }

  async onItemClicked(event: CollectionItemClickEvent) {
    switch (event.action) {
      case 'return':
        this.handleReturnAction(event);
        break;
      case 'deposit':
        await this.handleDepositAction(event);
        break;
      default:
        console.warn('Acción no soportada:', event.action);
    }
  }

  // --- FUNCIONES PRIVADAS EXTRAÍDAS ---

  private handleReturnAction(event: CollectionItemClickEvent) {
    this.selectedItem = event.item;
    this.selectedCollectionId = event.collectionId;
    this.isModalOpen = true;
  }

  private async handleDepositAction(event: CollectionItemClickEvent) {
    const { item, collectionId } = event;
    const depositShiny = this.shouldDepositShiny(item);

    try {
      await this.collectionService.depositItemToCollection(
        collectionId,
        item.id,
        item.isShiny, // Si el hueco de la colección es shiny
        depositShiny, // Lo que depositamos realmente
      );

      await this.audioService.playPutItemCollection();
      await this.toast.success(`${item.name} añadido a la colección!`);

      const isCompleted = await this.collectionService.checkCompletion(collectionId);
      if (isCompleted) {
        await this.audioService.playCompleteCollection();
      }

      // Actualizar solo la colección modificada sin mostrar el loading global
      await this.updateCollectionInPlace(collectionId);
    } catch (error) {
      this.errorService.handle(error, 'Error al añadir el objeto a la colección');
    }
  }

  private shouldDepositShiny(item: any): boolean {
    if (item.isShiny) return true; // El hueco requiere shiny
    if (item.ownedNormal) return false; // El hueco es normal y tenemos normal

    return !!item.ownedShiny; // El hueco es normal, no tenemos normal, pero sí shiny
  }

  async onModalDismissed() {
    if (this.selectedCollectionId) {
      await this.reloadCollection(this.selectedCollectionId);
    }
    this.isModalOpen = false;
    this.selectedItem = null;
    this.selectedCollectionId = null;
  }
}
