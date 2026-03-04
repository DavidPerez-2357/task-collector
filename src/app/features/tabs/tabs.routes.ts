import { Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

export const routes: Routes = [
  {
    path: 'tabs',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadComponent: () =>
          import('@features/home-tab/home-tab.component').then((m) => m.HomeTabComponent),
      },
      {
        path: 'collection',
        loadComponent: () =>
          import('@features/collection-tab/collection-tab.component').then(
            (m) => m.CollectionTabComponent,
          ),
      },
      {
        path: 'inventory',
        loadComponent: () =>
          import('@features/inventory-tab/inventory-tab.component').then(
            (m) => m.InventoryTabComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'home',
        pathMatch: 'full',
      },
    ],
  },
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full',
  },
];
