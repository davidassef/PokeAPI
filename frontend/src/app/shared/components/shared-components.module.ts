import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { PokemonCardComponent } from './pokemon-card/pokemon-card.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';
import { DetailsModalComponent } from '../../pages/details/details-modal.component';

// Shared Pipes Module
import { SharedPipesModule } from '../pipes/shared-pipes.module';

@NgModule({
  declarations: [
    PokemonCardComponent,
    LoadingSpinnerComponent,
    MusicPlayerComponent,
    SearchFilterComponent,
    SidebarMenuComponent,
    DetailsModalComponent
  ],  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    SharedPipesModule
  ],
  exports: [
    PokemonCardComponent,
    LoadingSpinnerComponent,
    MusicPlayerComponent,
    SearchFilterComponent,
    SidebarMenuComponent,
    SharedPipesModule,
    DetailsModalComponent
  ]
})
export class SharedComponentsModule { }
