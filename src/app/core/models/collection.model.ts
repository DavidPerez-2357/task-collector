import { Item } from '@core/models/item.model';

export interface CollectionItem extends Item {
  isShiny: boolean;
  deposited?: { isShiny: boolean };
}

export interface Collection {
  id: number;
  name: string;
  price: number;
  badgeImageName: string;
  items: CollectionItem[];
}
