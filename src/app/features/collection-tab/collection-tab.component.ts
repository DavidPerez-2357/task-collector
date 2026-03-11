import { Component, inject, ViewChild } from '@angular/core';
import { IonContent, ViewWillEnter } from '@ionic/angular/standalone';
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

  onItemClicked(event: CollectionItemClickEvent) {
    this.selectedItem = event.item;
    this.selectedCollectionId = event.collectionId;
    this.isModalOpen = true;
  }

  async onModalDismissed() {
    this.isModalOpen = false;
    this.selectedItem = null;
    this.selectedCollectionId = null;
    // Reload to reflect the returned item
    await this.loadCollections();
  }
}
