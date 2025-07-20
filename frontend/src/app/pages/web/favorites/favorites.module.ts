import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { FavoritesPageRoutingModule } from './favorites-routing.module';
import { FavoritesPage } from './favorites.page';
import { SharedComponentsModule } from '../../../shared/components/shared-components.module';
import { SharedPipesModule } from '../../../shared/pipes/shared-pipes.module';
import { DetailsModalModule } from '../details/details-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    FavoritesPageRoutingModule,
    SharedComponentsModule,
    SharedPipesModule,
    DetailsModalModule
  ],
  declarations: [FavoritesPage]
})
export class FavoritesPageModule {}
