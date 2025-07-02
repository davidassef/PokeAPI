import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { TabsPage } from './tabs.page';

const routes: Routes = [
  {
    path: '',
    component: TabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../pages/web/home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'captured',
        loadChildren: () => import('../pages/web/captured/captured.module').then(m => m.CapturedPageModule)
      },
      {
        path: 'ranking',
        loadChildren: () => import('../pages/web/ranking/ranking.module').then(m => m.RankingPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('../pages/web/settings/settings.module').then(m => m.SettingsPageModule)
      },
      {
        path: 'details/:id',
        loadChildren: () => import('../pages/web/details/details.module').then(m => m.DetailsPageModule)
      },
      {
        path: '',
        redirectTo: '/tabs/home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule]
})
export class TabsPageRoutingModule {}
