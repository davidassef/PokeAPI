import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./tabs/tabs.routes').then((m) => m.routes),
  },
  {
    path: 'pokemon/:id',
    loadComponent: () => import('./pages/details/details.page').then(m => m.DetailsPage),
  },
];
