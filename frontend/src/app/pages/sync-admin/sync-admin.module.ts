import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { RouterModule } from '@angular/router';

import { SyncAdminComponent } from './sync-admin.component';

@NgModule({
  declarations: [SyncAdminComponent],
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule.forChild([
      {
        path: '',
        component: SyncAdminComponent
      }
    ])
  ],
  exports: [SyncAdminComponent]
})
export class SyncAdminModule { }
