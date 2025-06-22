import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

// Components
import { PokemonCardComponent } from './pokemon-card/pokemon-card.component';
import { SearchFilterComponent } from './search-filter/search-filter.component';
import { MusicPlayerComponent } from './music-player/music-player.component';
import { LoadingSpinnerComponent } from './loading-spinner/loading-spinner.component';
import { SidebarMenuComponent } from './sidebar-menu/sidebar-menu.component';

@NgModule({
  declarations: [
    PokemonCardComponent,
    SearchFilterComponent,
    MusicPlayerComponent,
    LoadingSpinnerComponent,
    SidebarMenuComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    ReactiveFormsModule,
    TranslateModule
  ],
  exports: [
    PokemonCardComponent,
    SearchFilterComponent,
    MusicPlayerComponent,
    LoadingSpinnerComponent,
    SidebarMenuComponent
  ]
})
export class SharedComponentsModule { }
