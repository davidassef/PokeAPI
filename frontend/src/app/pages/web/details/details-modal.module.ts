import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { DetailsModalComponent } from './details-modal.component';
import { SharedPipesModule } from '../../../shared/pipes/shared-pipes.module';

@NgModule({
  declarations: [
    DetailsModalComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    SharedPipesModule
  ],
  exports: [
    DetailsModalComponent
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DetailsModalModule { }
