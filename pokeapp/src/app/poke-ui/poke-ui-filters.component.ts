// Filtros avançados da Pokédex
import { Component, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'poke-ui-filters',
  templateUrl: './poke-ui-filters.component.html',
  styleUrls: ['./poke-ui-filters.component.scss'],
})
export class PokeUiFiltersComponent {
  tipos = [
    'normal','fire','water','electric','grass','ice','fighting','poison','ground','flying','psychic','bug','rock','ghost','dragon','dark','steel','fairy',
  ];
  geracoes = [1,2,3,4,5,6,7,8,9];
  @Output() filterChange = new EventEmitter<any>();
  selectedType: string = '';
  selectedGen: number|null = null;
  showFavorites: boolean = false;

  setType(type: string) {
    this.selectedType = type;
    this.emitChange();
  }
  setGen(gen: number|null) {
    this.selectedGen = gen;
    this.emitChange();
  }
  toggleFavorites() {
    this.showFavorites = !this.showFavorites;
    this.emitChange();
  }
  emitChange() {
    this.filterChange.emit({ type: this.selectedType, gen: this.selectedGen, favorites: this.showFavorites });
  }
}
