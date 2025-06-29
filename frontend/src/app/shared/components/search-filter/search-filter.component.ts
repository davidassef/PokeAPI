import { Component, Output, EventEmitter, Input, OnInit, OnDestroy, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';
import { PokeApiService } from '../../../core/services/pokeapi.service';

/**
 * Interface que representa as opções de filtro disponíveis no componente de busca.
 */
export interface FilterOptions {
  /** Termo de busca por nome ou ID do Pokémon */
  searchTerm: string;
  /** Tipos de elemento selecionados (ex: fogo, água) */
  selectedElementTypes: string[];
  /** Tipos de movimentação selecionados (ex: voador) */
  selectedMovementTypes: string[];
  /** Geração selecionada (1 a 8) ou null para todas */
  selectedGeneration: number | null;
  /** Campo de ordenação: id, name, height ou weight */
  sortBy: 'id' | 'name' | 'height' | 'weight';
  /** Ordem de ordenação: ascendente ou descendente */
  sortOrder: 'asc' | 'desc';
}

/**
 * Componente de filtro e busca avançada para a Pokédex.
 * Permite filtrar Pokémons por nome, tipo, geração e ordenação.
 */
@Component({
  selector: 'app-search-filter',
  templateUrl: './search-filter.component.html',
  styleUrls: ['./search-filter.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SearchFilterComponent implements OnInit, OnDestroy {
  /** Exibe ou oculta os filtros avançados */
  @Input() showAdvancedFilters = true;
  /** Placeholder do campo de busca (chave de tradução) */
  @Input() placeholder = 'home.placeholder';
  /** Filtros atuais aplicados (usado para inicializar o formulário) */
  @Input() currentFilters: FilterOptions = {
    searchTerm: '',
    selectedElementTypes: [],
    selectedMovementTypes: [],
    selectedGeneration: null,
    sortBy: 'id',
    sortOrder: 'asc'
  };
  /** Evento emitido sempre que qualquer filtro é alterado */
  @Output() filterChange = new EventEmitter<FilterOptions>();
  /** Evento emitido quando filtros são alterados (alias) */
  @Output() filtersChanged = new EventEmitter<FilterOptions>();
  /** Evento emitido quando o termo de busca é alterado */
  @Output() searchChanged = new EventEmitter<string>();
  /** Evento emitido ao clicar em limpar todos os filtros */
  @Output() clearFilters = new EventEmitter<void>();

  /** Formulário reativo dos filtros */
  filterForm: FormGroup;
  /** Lista de tipos de elemento disponíveis */
  elementTypes: string[] = [];
  /** Lista de tipos de movimentação disponíveis */
  movementTypes: string[] = [];
  /** Lista de gerações disponíveis */
  generations = [
    { id: 1, name: 'filters.generation_1' },
    { id: 2, name: 'filters.generation_2' },
    { id: 3, name: 'filters.generation_3' },
    { id: 4, name: 'filters.generation_4' },
    { id: 5, name: 'filters.generation_5' },
    { id: 6, name: 'filters.generation_6' },
    { id: 7, name: 'filters.generation_7' },
    { id: 8, name: 'filters.generation_8' }
  ];

  /** Opções de ordenação disponíveis */
  sortOptions = [
    { value: 'id', label: 'filters.sort_by_id' },
    { value: 'name', label: 'filters.sort_by_name' },
    { value: 'height', label: 'filters.sort_by_height' },
    { value: 'weight', label: 'filters.sort_by_weight' }
  ];

  /** Estado de exibição dos filtros avançados */
  isAdvancedFiltersOpen = false;
  /** Subject para controle de ciclo de vida dos observables */
  private destroy$ = new Subject<void>();

  /**
   * Construtor do componente. Injeta FormBuilder e serviço da PokeAPI.
   */
  constructor(
    private fb: FormBuilder,
    private pokeApiService: PokeApiService
  ) {
    // Inicializa o formulário reativo com os campos de filtro
    this.filterForm = this.fb.group({
      searchTerm: [''],
      selectedElementTypes: [[]],
      selectedMovementTypes: [[]],
      selectedGeneration: [null],
      sortBy: ['id'],
      sortOrder: ['asc']
    });
  }

  /**
   * Inicializa o componente, carregando tipos e configurando o formulário.
   */
  ngOnInit() {
    this.loadPokemonTypes();
    // Inicializa o formulário com os filtros atuais, se fornecidos
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }
    this.setupFormSubscriptions();
  }

  /**
   * Limpa subscriptions ao destruir o componente.
   */
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /**
   * Carrega os tipos de Pokémon disponíveis da API e separa em tipos de elemento e movimentação.
   */
  private async loadPokemonTypes() {
    const allTypes = [
      'normal', 'fire', 'water', 'electric', 'grass', 'ice',
      'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];
    // Tipos de elementos (exclui flying, ground)
    this.elementTypes = [
      'normal', 'fire', 'water', 'electric', 'grass', 'ice',
      'fighting', 'poison', 'psychic', 'bug',
      'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
    ];
    // Tipos de movimentação (flying)
    this.movementTypes = ['flying'];
    try {
      const types = await this.pokeApiService.getTypes();
      this.elementTypes = this.elementTypes.filter(type => types.includes(type));
      this.movementTypes = this.movementTypes.filter(type => types.includes(type));
    } catch (error) {
      // fallback já definido acima
    }
  }

  /**
   * Configura subscriptions reativas para os campos do formulário de filtro.
   */
  private setupFormSubscriptions() {
    // Debounce para o campo de busca
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

    // Mudanças imediatas para os demais filtros
    this.filterForm.get('selectedElementTypes')?.valueChanges
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.emitFilterChange();
      });
    this.filterForm.get('selectedMovementTypes')?.valueChanges
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

  /**
   * Emite o evento de alteração de filtros com os valores atuais do formulário.
   */
  private emitFilterChange() {
    const filterOptions: FilterOptions = {
      searchTerm: this.filterForm.get('searchTerm')?.value || '',
      selectedElementTypes: this.filterForm.get('selectedElementTypes')?.value || [],
      selectedMovementTypes: this.filterForm.get('selectedMovementTypes')?.value || [],
      selectedGeneration: this.filterForm.get('selectedGeneration')?.value,
      sortBy: this.filterForm.get('sortBy')?.value || 'id',
      sortOrder: this.filterForm.get('sortOrder')?.value || 'asc'
    };
    console.log('[SearchFilter] Emitindo filtersChanged:', filterOptions);
    this.filterChange.emit(filterOptions);
    this.filtersChanged.emit(filterOptions);
  }

  /**
   * Alterna a seleção de um tipo de elemento.
   * @param type Tipo de elemento a ser alternado
   */
  onElementTypeToggle(type: string) {
    const currentTypes = this.filterForm.get('selectedElementTypes')?.value || [];
    const index = currentTypes.indexOf(type);
    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }
    this.filterForm.get('selectedElementTypes')?.setValue([...currentTypes]);
  }

  /**
   * Verifica se um tipo de elemento está selecionado.
   * @param type Tipo de elemento
   */
  isElementTypeSelected(type: string): boolean {
    const selectedTypes = this.filterForm.get('selectedElementTypes')?.value || [];
    return selectedTypes.includes(type);
  }

  /**
   * Alterna a seleção de um tipo de movimentação.
   * @param type Tipo de movimentação a ser alternado
   */
  onMovementTypeToggle(type: string) {
    const currentTypes = this.filterForm.get('selectedMovementTypes')?.value || [];
    const index = currentTypes.indexOf(type);
    if (index > -1) {
      currentTypes.splice(index, 1);
    } else {
      currentTypes.push(type);
    }
    this.filterForm.get('selectedMovementTypes')?.setValue([...currentTypes]);
  }

  /**
   * Verifica se um tipo de movimentação está selecionado.
   * @param type Tipo de movimentação
   */
  isMovementTypeSelected(type: string): boolean {
    const selectedTypes = this.filterForm.get('selectedMovementTypes')?.value || [];
    return selectedTypes.includes(type);
  }

  /**
   * Limpa todos os filtros e reseta o formulário.
   */
  onClearFilters() {
    this.filterForm.reset({
      searchTerm: '',
      selectedElementTypes: [],
      selectedMovementTypes: [],
      selectedGeneration: null,
      sortBy: 'id',
      sortOrder: 'asc'
    });
    this.clearFilters.emit();
  }

  /**
   * Alterna a exibição dos filtros avançados.
   */
  toggleAdvancedFilters() {
    this.isAdvancedFiltersOpen = !this.isAdvancedFiltersOpen;
  }

  /**
   * Retorna a cor associada a um tipo de Pokémon.
   * @param type Tipo de Pokémon
   */
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

  /**
   * Conta quantos filtros estão ativos atualmente.
   * @returns Número de filtros ativos
   */
  getActiveFiltersCount(): number {
    let count = 0;
    const formValue = this.filterForm.value;
    if (formValue.searchTerm) count++;
    if (formValue.selectedElementTypes?.length > 0) count++;
    if (formValue.selectedMovementTypes?.length > 0) count++;
    if (formValue.selectedGeneration !== null) count++;
    if (formValue.sortBy !== 'id' || formValue.sortOrder !== 'asc') count++;
    return count;
  }
}
