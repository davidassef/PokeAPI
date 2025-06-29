import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PokemonImageComponent } from './components/pokemon-image/pokemon-image.component';
import { PokemonTypesComponent } from './components/pokemon-types/pokemon-types.component';
import { PokemonInfoCardComponent } from './components/pokemon-info-card/pokemon-info-card.component';
import { PokemonStatsComponent } from './components/pokemon-stats/pokemon-stats.component';
import { PokemonAbilitiesComponent } from './components/pokemon-abilities/pokemon-abilities.component';
import { PokemonDetailComponent } from './components/pokemon-detail/pokemon-detail.component';
import { SharedPipesModule } from './pipes/shared-pipes.module';

@NgModule({
  declarations: [
    PokemonImageComponent,
    PokemonTypesComponent,
    PokemonInfoCardComponent,
    PokemonStatsComponent,
    PokemonAbilitiesComponent,
    PokemonDetailComponent
  ],
  imports: [
    CommonModule,
    IonicModule,
    SharedPipesModule
  ],
  exports: [
    PokemonImageComponent,
    PokemonTypesComponent,
    PokemonInfoCardComponent,
    PokemonStatsComponent,
    PokemonAbilitiesComponent,
    PokemonDetailComponent
  ]
})
export class SharedComponentsModule {} 