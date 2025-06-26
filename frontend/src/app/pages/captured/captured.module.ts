import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { CapturedPageRoutingModule } from './captured-routing.module';
import { CapturedPage } from './captured.page';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { SharedPipesModule } from '../../shared/pipes/shared-pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    CapturedPageRoutingModule,
    SharedComponentsModule,
    SharedPipesModule
  ],
  declarations: [CapturedPage]
})
export class CapturedPageModule {}
