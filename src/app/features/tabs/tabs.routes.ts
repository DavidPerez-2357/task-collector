import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'tabs',
    loadComponent: () => import('./tabs.page').then((m) => m.TabsPage),
    children: [
      {
        path: 'home',
        loadChildren: () => import('@features/home-tab/home-tab.routes').then((m) => m.routes),
      },
      {
        path: 'collection',
        loadChildren: () =>
          import('@features/collection-tab/collection-tab.routes').then((m) => m.routes),
      },
      {
        path: 'inventory',
        loadChildren: () =>
          import('@features/inventory-tab/inventory-tab.routes').then((m) => m.routes),
      },
      {
        path: 'shop',
        loadChildren: () => import('@features/shop-tab/shop-tab.routes').then((m) => m.routes),
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
