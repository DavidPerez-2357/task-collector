export enum Rarity {
  Common = 0,
  Rare = 1,
  Epic = 2,
  Legendary = 3,
}

export interface Item {
  id: number;
  name: string;
  description: string;
  rarity: Rarity;
  imageName: string;
  sellPrice: number;
}

export interface ItemInventory extends Item {
  quantity: number;
  isShiny: boolean;
}

export interface ItemSold extends Item {
  coinsEarned: number;
  dateSold: Date;
}

export interface ItemCollection extends Item {
  isShiny: boolean;
}

export interface ItemShop extends Item {
  isShiny: boolean;
}

