import { Component, Output, EventEmitter, Input, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PokeApiService } from '../../../core/services/pokeapi.service';

export interface FilterOptions {
  searchTerm: string;
  selectedTypes: string[];
  selectedGeneration: number | null;
  sortBy: 'id' | 'name' | 'height' | 'weight';
  sortOrder: 'asc' | 'desc';
}

@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss']
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  @Input() showAdvancedFilters = true;
  @Input() placeholder = 'Search Pokémon...';
  @Input() currentFilters: FilterOptions = {
    searchTerm: '',
    selectedTypes: [],
    selectedGeneration: null,
    sortBy: 'id',
    sortOrder: 'asc'
  };
  @Output() filterChange = new EventEmitter<FilterOptions>();
  @Output() filtersChanged = new EventEmitter<FilterOptions>();
  @Output() searchChanged = new EventEmitter<string>();
  @Output() clearFilters = new EventEmitter<void>();

  filterForm: FormGroup;
  pokemonTypes: string[] = [];
  generations = [
    { id: 1, name: 'Generation I (Kanto)' },
    { id: 2, name: 'Generation II (Johto)' },
    { id: 3, name: 'Generation III (Hoenn)' },
    { id: 4, name: 'Generation IV (Sinnoh)' },
    { id: 5, name: 'Generation V (Unova)' },
    { id: 6, name: 'Generation VI (Kalos)' },
    { id: 7, name: 'Generation VII (Alola)' },
    { id: 8, name: 'Generation VIII (Galar)' }
  ];

  sortOptions = [
    { value: 'id', label: 'Pokédex Number' },
    { value: 'name', label: 'Name' },
    { value: 'height', label: 'Height' },
    { value: 'weight', label: 'Weight' }
  ];

  isAdvancedFiltersOpen = false;
  private destroy$ = new Subject<void>();

  constructor(
    private fb: FormBuilder,
    private pokeApiService: PokeApiService
  ) {
    this.filterForm = this.fb.group({
      searchTerm: [''],
      selectedTypes: [[]],
      selectedGeneration: [null],
      sortBy: ['id'],
      sortOrder: ['asc']
    });
  }
  ngOnInit() {
    this.loadPokemonTypes();
    // Inicializar o form com os filtros atuais se fornecidos
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }
    this.setupFormSubscriptions();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async loadPokemonTypes() {
    try {
      this.pokemonTypes = await this.pokeApiService.getTypes();
    } catch (error) {
      console.error('Error loading Pokemon types:', error);
      // Fallback types
      this.pokemonTypes = [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
      ];
    }
  }
  private setupFormSubscriptions() {
    // Debounce search term changes
    this.filterForm.get('searchTerm')?.valueChanges
      .pipe(
        debounceTime(300),
        distinctUntilChanged(),
        takeUntil(this.destroy$)
      )
      .subscribe((searchTerm) => {
        this.searchChanged.emit(searchTerm || '');
        this.emitFilterChange();
      });

    // Immediate changes for other filters
    this.filterForm.get('selectedTypes')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitFilterChange();
      });

    this.filterForm.get('selectedGeneration')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitFilterChange();
      });

    this.filterForm.get('sortBy')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitFilterChange();
      });

    this.filterForm.get('sortOrder')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitFilterChange();
      });
  }

  private emitFilterChange() {
    const filterOptions: FilterOptions = {
      searchTerm: this.filterForm.get('searchTerm')?.value || '',
      selectedTypes: this.filterForm.get('selectedTypes')?.value || [],
      selectedGeneration: this.filterForm.get('selectedGeneration')?.value,
      sortBy: this.filterForm.get('sortBy')?.value || 'id',
      sortOrder: this.filterForm.get('sortOrder')?.value || 'asc'    };
    this.filterChange.emit(filterOptions);
    this.filtersChanged.emit(filterOptions);
  }

  onTypeToggle(type: string) {
    const currentTypes = this.filterForm.get('selectedTypes')?.value || [];
    const index = currentTypes.indexOf(type);

    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }

    this.filterForm.get('selectedTypes')?.setValue([...currentTypes]);
  }

  isTypeSelected(type: string): boolean {
    const selectedTypes = this.filterForm.get('selectedTypes')?.value || [];
    return selectedTypes.includes(type);
  }

  onClearFilters() {
    this.filterForm.reset({
      searchTerm: '',
      selectedTypes: [],
      selectedGeneration: null,
      sortBy: 'id',
      sortOrder: 'asc'
    });
    this.clearFilters.emit();
  }

  toggleAdvancedFilters() {
    this.isAdvancedFiltersOpen = !this.isAdvancedFiltersOpen;
  }

  getTypeColor(type: string): string {
    const typeColors: { [key: string]: string } = {
      normal: '#A8A878',
      fire: '#F08030',
      water: '#6890F0',
      electric: '#F8D030',
      grass: '#78C850',
      ice: '#98D8D8',
      fighting: '#C03028',
      poison: '#A040A0',
      ground: '#E0C068',
      flying: '#A890F0',
      psychic: '#F85888',
      bug: '#A8B820',
      rock: '#B8A038',
      ghost: '#705898',
      dragon: '#7038F8',
      dark: '#705848',
      steel: '#B8B8D0',
      fairy: '#EE99AC'
    };
    return typeColors[type] || '#68A090';
  }

  getActiveFiltersCount(): number {
    let count = 0;
    const formValue = this.filterForm.value;

    if (formValue.searchTerm) count++;
    if (formValue.selectedTypes?.length > 0) count++;
    if (formValue.selectedGeneration !== null) count++;
    if (formValue.sortBy !== 'id' || formValue.sortOrder !== 'asc') count++;

    return count;
  }
}
