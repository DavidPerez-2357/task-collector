import { CollectionItem } from '@core/models/collection.model';

export interface CollectionItemClickEvent {
  item: CollectionItem;
  collectionId: number;
  action: 'return' | 'deposit';
}
