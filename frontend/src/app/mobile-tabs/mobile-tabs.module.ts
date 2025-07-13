import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';

import { MobileTabsPageRoutingModule } from './mobile-tabs-routing.module';
import { MobileTabsPage } from './mobile-tabs.page';
import { SharedComponentsModule } from '../shared/components/shared-components.module';

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    TranslateModule,
    MobileTabsPageRoutingModule,
    SharedComponentsModule
  ],
  declarations: [MobileTabsPage]
})
export class MobileTabsPageModule {}
