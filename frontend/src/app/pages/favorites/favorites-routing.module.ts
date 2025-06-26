import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

// import { FavoritesPage } from './favorites.page';

const routes: Routes = [
  {
    path: '',
    // component: FavoritesPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class FavoritesPageRoutingModule {}

/* Página de favoritos comentada temporariamente por não ser mais utilizada.
const routes: Routes = [
  {
    path: '',
    component: FavoritesPage
  }
];
*/
