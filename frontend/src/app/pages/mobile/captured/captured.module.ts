import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';

import { CapturedPageRoutingModule } from './captured-routing.module';
import { CapturedPage } from './captured.page';
import { SharedComponentsModule } from '../../../shared/components/shared-components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    CapturedPageRoutingModule,
    SharedComponentsModule
  ],
  declarations: [CapturedPage]
})
export class CapturedPageModule {}
