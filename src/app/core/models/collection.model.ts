import { Item } from '@core/models/item.model';

export interface Collection {
  id: number;
  name: string;
  price: number;
  badgeImageName: string;
  items: Item[];
}
