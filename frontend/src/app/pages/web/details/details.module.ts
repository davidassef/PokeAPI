import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { DetailsPageRoutingModule } from './details-routing.module';
import { DetailsPage } from './details.page';
import { SharedComponentsModule } from '../../../shared/components/shared-components.module';
import { SharedPipesModule } from '../../../shared/pipes/shared-pipes.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    DetailsPageRoutingModule,
    SharedComponentsModule,
    SharedPipesModule
  ],
  declarations: [DetailsPage],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class DetailsPageModule {}
