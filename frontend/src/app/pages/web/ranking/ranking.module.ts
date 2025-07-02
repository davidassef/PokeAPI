import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { RankingPageRoutingModule } from './ranking-routing.module';
import { RankingPage } from './ranking.page';
import { SharedComponentsModule } from '../../../shared/components/shared-components.module';
import { SharedPipesModule } from '../../../shared/pipes/shared-pipes.module';
import { DetailsModalModule } from '../details/details-modal.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    RankingPageRoutingModule,
    SharedComponentsModule,
    SharedPipesModule,
    DetailsModalModule
  ],
  declarations: [RankingPage]
})
export class RankingPageModule {}
