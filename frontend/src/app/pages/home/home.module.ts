import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { HomePageRoutingModule } from './home-routing.module';
import { HomePage } from './home.page';
import { SharedComponentsModule } from '../../shared/components/shared-components.module';
import { SharedPipesModule } from '../../shared/pipes/shared-pipes.module';
import { DetailsPageModule } from '../details/details.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    IonicModule,
    TranslateModule,
    HomePageRoutingModule,
    SharedComponentsModule,
    SharedPipesModule,
    DetailsPageModule
  ],
  declarations: [HomePage]
})
export class HomePageModule {}
