import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./inventory-tab.component').then((m) => m.InventoryTabComponent),
  },
];
