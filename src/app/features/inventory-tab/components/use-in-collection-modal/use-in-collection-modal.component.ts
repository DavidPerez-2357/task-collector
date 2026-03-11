import { Component, EventEmitter, inject, Input, OnChanges, Output } from '@angular/core';
import { IonButton, IonModal, IonSpinner } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ItemInventory } from '@core/models/item.model';
import { CollectionService } from '@features/collection-tab/services/collection.service';

interface EligibleCollection {
  id: number;
  name: string;
  badgeImageName: string;
  slotIsShiny: boolean;
}

@Component({
  selector: 'app-use-in-collection-modal',
  templateUrl: './use-in-collection-modal.component.html',
  styleUrls: ['./use-in-collection-modal.component.scss'],
  imports: [IonModal, BoardComponent, IonButton, IonSpinner],
})
export class UseInCollectionModalComponent implements OnChanges {
  @Input() item!: ItemInventory;
  @Input() isOpen: boolean = false;
  @Output() dismissed = new EventEmitter<void>();
  @Output() deposited = new EventEmitter<void>();

  private collectionService = inject(CollectionService);

  eligibleCollections: EligibleCollection[] = [];
  loading = false;
  depositing = false;

  async ngOnChanges() {
    if (this.isOpen && this.item) {
      await this.loadEligibleCollections();
    }
  }

  private async loadEligibleCollections() {
    this.loading = true;
    try {
      this.eligibleCollections = await this.collectionService.getEligibleCollectionsForItem(
        this.item.id,
        this.item.isShiny,
      );
    } catch (e) {
      console.error('Error loading eligible collections:', e);
    } finally {
      this.loading = false;
    }
  }

  async depositInto(collection: EligibleCollection) {
    if (this.depositing) return;
    this.depositing = true;
    try {
      await this.collectionService.depositItemToCollection(
        collection.id,
        this.item.id,
        collection.slotIsShiny,
        this.item.isShiny,
      );
      this.deposited.emit();
    } catch (e) {
      console.error('Error depositing item:', e);
    } finally {
      this.depositing = false;
    }
  }

  onDismiss() {
    this.dismissed.emit();
  }

  badgePath(col: EligibleCollection): string {
    return col.badgeImageName;
  }
}
