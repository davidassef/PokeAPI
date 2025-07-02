import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// Components
import { PokemonCardComponent } from './pokemon-card/pokemon-card.component';
import { PokemonRankCardComponent } from './pokemon-rank-card/pokemon-rank-card.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';

// Shared Modules
import { SharedPipesModule } from '../pipes/shared-pipes.module';
import { SharedDirectivesModule } from '../directives/shared-directives.module';

@NgModule({
  declarations: [
    PokemonCardComponent,
    PokemonRankCardComponent,
    LoadingSpinnerComponent,
    MusicPlayerComponent,
    SearchFilterComponent,
    SidebarMenuComponent
  ],  imports: [
    CommonModule,
    IonicModule,
    TranslateModule,
    FormsModule,
    ReactiveFormsModule,
    SharedPipesModule,
    SharedDirectivesModule
  ],
  exports: [
    PokemonCardComponent,
    PokemonRankCardComponent,
    LoadingSpinnerComponent,
    MusicPlayerComponent,
    SearchFilterComponent,
    SidebarMenuComponent,
    SharedPipesModule,
    SharedDirectivesModule,
    TranslateModule,
    IonicModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class SharedComponentsModule { }
