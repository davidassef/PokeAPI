import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';
import { PokemonImageComponent } from './pokemon-image/pokemon-image.component';
import { PokemonTypesComponent } from './pokemon-types/pokemon-types.component';
import { PokemonInfoCardComponent } from './pokemon-info-card/pokemon-info-card.component';
import { PokemonStatsComponent } from './pokemon-stats/pokemon-stats.component';
import { PokemonAbilitiesComponent } from './pokemon-abilities/pokemon-abilities.component';
import { SharedPipesModule } from '../pipes/shared-pipes.module';

@NgModule({
  declarations: [
    PokemonImageComponent,
    PokemonTypesComponent,
    PokemonInfoCardComponent,
    PokemonStatsComponent,
    PokemonAbilitiesComponent
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
    PokemonAbilitiesComponent
  ]
})
export class SharedComponentsModule {} 