import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

// Pipes
import { TypeColorPipe } from './type-color.pipe';
import { PokemonIdPipe } from './pokemon-id.pipe';
import { PokemonHeightPipe } from './pokemon-height.pipe';
import { PokemonWeightPipe } from './pokemon-weight.pipe';
import { StatColorPipe } from './stat-color.pipe';

@NgModule({
  declarations: [
    TypeColorPipe,
    PokemonIdPipe,
    PokemonHeightPipe,
    PokemonWeightPipe,
    StatColorPipe
  ],
  imports: [
    CommonModule
  ],
  exports: [
    TypeColorPipe,
    PokemonIdPipe,
    PokemonHeightPipe,
    PokemonWeightPipe,
    StatColorPipe
  ]
})
export class SharedPipesModule { }
