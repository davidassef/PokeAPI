import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';

const routes: Routes = [
  {
    path: '',
    redirectTo: '/tabs/home',
    pathMatch: 'full'
  },
  {
    path: 'tabs',
    loadChildren: () => import('./tabs/tabs.module').then(m => m.TabsPageModule)  },
  {
    path: 'pokemon/:id',
    loadChildren: () => import('./pages/web/details/details.module').then(m => m.DetailsPageModule)
  },
  {
    path: 'sync-admin',
    loadChildren: () => import('./pages/sync-admin/sync-admin.module').then(m => m.SyncAdminModule)
  },
  {
    path: 'login',
    loadChildren: () => import('./pages/web/login/login.module').then(m => m.LoginPageModule)
  },
  {
    path: 'register',
    loadChildren: () => import('./pages/web/register/register.module').then(m => m.RegisterPageModule)
  }
];
@NgModule({
  imports: [
    RouterModule.forRoot(routes, { preloadingStrategy: PreloadAllModules })
  ],
  exports: [RouterModule]
})
export class AppRoutingModule {}
