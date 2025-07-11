import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import { AuthGuard } from './core/guards/auth.guard';
import { NoAuthGuard } from './core/guards/no-auth.guard';
import { DeviceRedirectGuard } from './core/guards/device-redirect.guard';
import { InitialRedirectGuard } from './core/guards/initial-redirect.guard';

const routes: Routes = [
  {
    path: '',
    canActivate: [InitialRedirectGuard],
    children: []
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule),
    canActivate: [DeviceRedirectGuard]
  },
  {
    path: 'mobile',
    loadChildren: () => import('./mobile-tabs/mobile-tabs.module').then(m => m.MobileTabsPageModule),
    canActivate: [DeviceRedirectGuard]
  },
  {
    path: 'pokemon/:id',
    loadChildren: () => import('./pages/web/details/details.module').then(m => m.DetailsPageModule)
  },
  {
    path: 'sync-admin',
    loadChildren: () => import('./pages/sync-admin/sync-admin.module').then(m => m.SyncAdminModule),
    canActivate: [AuthGuard]
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
