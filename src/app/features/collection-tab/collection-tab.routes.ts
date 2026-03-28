import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./collection-tab.component').then((m) => m.CollectionTabComponent),
  },
];
