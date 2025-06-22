import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'pokemonId'
})
export class PokemonIdPipe implements PipeTransform {
  transform(id: number, digits: number = 3): string {
    return `#${id.toString().padStart(digits, '0')}`;
  }
}
