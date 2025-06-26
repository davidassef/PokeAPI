import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';

import { CapturedPage } from './captured.page';

const routes: Routes = [
  {
    path: '',
    component: CapturedPage
  }
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class CapturedPageRoutingModule {}
