import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MobileTabsPage } from './mobile-tabs.page';

const routes: Routes = [
  {
    path: '',
    component: MobileTabsPage,
    children: [
      {
        path: 'home',
        loadChildren: () => import('../pages/mobile/home/home.module').then(m => m.HomePageModule)
      },
      {
        path: 'captured',
        loadChildren: () => import('../pages/mobile/captured/captured.module').then(m => m.CapturedPageModule)
      },
      {
        path: 'ranking',
        loadChildren: () => import('../pages/mobile/ranking/ranking.module').then(m => m.RankingPageModule)
      },
      {
        path: 'settings',
        loadChildren: () => import('../pages/mobile/settings/settings.module').then(m => m.SettingsPageModule)
      },
      {
        path: '',
        redirectTo: '/mobile/home',
        pathMatch: 'full'
      }
    ]
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class MobileTabsPageRoutingModule {}
