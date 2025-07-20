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
  /** Habitats selecionados (ex: floresta, caverna) */
  selectedHabitats: string[];
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
    selectedHabitats: [],
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
  /** Lista de habitats disponíveis */
  habitats: string[] = [];
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

  /** Estados de ordenação: 'none' | 'asc' | 'desc' */
  sortStates: { [key: string]: 'none' | 'asc' | 'desc' } = {
    'id': 'none',
    'name': 'none',
    'height': 'none',
    'weight': 'none'
  };

  /** Ordenação ativa atual */
  activeSortField: string | null = null;

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
      selectedHabitats: [[]],
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
    this.loadHabitats();
    // Inicializa o formulário com os filtros atuais, se fornecidos
    if (this.currentFilters) {
      this.filterForm.patchValue(this.currentFilters);
    }
    this.setupFormSubscriptions();
    this.initializeSortStates();
  }

  /**
   * Inicializa os estados de ordenação baseado nos valores atuais do formulário.
   */
  private initializeSortStates() {
    const currentSortBy = this.filterForm.get('sortBy')?.value;
    const currentSortOrder = this.filterForm.get('sortOrder')?.value;

    if (currentSortBy && currentSortOrder) {
      this.sortStates[currentSortBy] = currentSortOrder;
      this.activeSortField = currentSortBy;
    }
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
   * Carrega os habitats disponíveis baseado nas traduções existentes.
   */
  private loadHabitats() {
    // Lista de habitats baseada nas traduções já existentes no sistema
    this.habitats = [
      'cave',
      'forest',
      'grassland',
      'mountain',
      'rare',
      'rough-terrain',
      'sea',
      'urban',
      'waters-edge'
    ];
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
    this.filterForm.get('selectedHabitats')?.valueChanges
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
      selectedHabitats: this.filterForm.get('selectedHabitats')?.value || [],
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
   * Verifica se um habitat está selecionado.
   */
  isHabitatSelected(habitat: string): boolean {
    const selectedHabitats = this.filterForm.get('selectedHabitats')?.value || [];
    return selectedHabitats.includes(habitat);
  }

  /**
   * Alterna a seleção de uma geração (apenas uma geração pode ser selecionada por vez).
   * @param generationId ID da geração ou null para todas as gerações
   */
  onGenerationToggle(generationId: number | null) {
    const currentGeneration = this.filterForm.get('selectedGeneration')?.value;

    if (currentGeneration === generationId) {
      // Se a geração já está selecionada, desseleciona (volta para "todas")
      this.filterForm.get('selectedGeneration')?.setValue(null);
    } else {
      // Seleciona a nova geração
      this.filterForm.get('selectedGeneration')?.setValue(generationId);
    }
  }

  /**
   * Verifica se uma geração está selecionada.
   * @param generationId ID da geração ou null para todas as gerações
   */
  isGenerationSelected(generationId: number | null): boolean {
    const selectedGeneration = this.filterForm.get('selectedGeneration')?.value;
    return selectedGeneration === generationId;
  }

  /**
   * Alterna entre os três estados de ordenação: none → asc → desc → none
   * @param sortValue Valor da opção de ordenação
   */
  onSortOptionToggle(sortValue: string) {
    const currentState = this.sortStates[sortValue];

    // Reset todos os outros campos para 'none'
    Object.keys(this.sortStates).forEach(key => {
      if (key !== sortValue) {
        this.sortStates[key] = 'none';
      }
    });

    // Cicla através dos três estados para o campo clicado
    switch (currentState) {
      case 'none':
        this.sortStates[sortValue] = 'asc';
        this.activeSortField = sortValue;
        this.filterForm.get('sortBy')?.setValue(sortValue);
        this.filterForm.get('sortOrder')?.setValue('asc');
        break;
      case 'asc':
        this.sortStates[sortValue] = 'desc';
        this.activeSortField = sortValue;
        this.filterForm.get('sortBy')?.setValue(sortValue);
        this.filterForm.get('sortOrder')?.setValue('desc');
        break;
      case 'desc':
        this.sortStates[sortValue] = 'none';
        this.activeSortField = null;
        this.filterForm.get('sortBy')?.setValue(null);
        this.filterForm.get('sortOrder')?.setValue(null);
        break;
    }
  }

  /**
   * Verifica se uma opção de ordenação está ativa (asc ou desc).
   * @param sortValue Valor da opção de ordenação
   */
  isSortOptionSelected(sortValue: string): boolean {
    return this.sortStates[sortValue] !== 'none';
  }

  /**
   * Obtém o estado atual de ordenação para um campo específico.
   * @param sortValue Valor da opção de ordenação
   */
  getSortState(sortValue: string): 'none' | 'asc' | 'desc' {
    return this.sortStates[sortValue];
  }

  /**
   * Obtém o ícone de seta baseado no estado de ordenação.
   * @param sortValue Valor da opção de ordenação
   */
  getSortIcon(sortValue: string): string {
    const state = this.sortStates[sortValue];
    switch (state) {
      case 'asc': return '↑';
      case 'desc': return '↓';
      default: return '';
    }
  }

  /**
   * Obtém a cor para uma geração específica.
   * @param generationId ID da geração ou null para todas as gerações
   */
  getGenerationColor(generationId: number | null): string {
    if (generationId === null) return '#6c757d'; // Cinza para "todas"

    const colors = [
      '#e74c3c', // Gen 1 - Vermelho (Kanto)
      '#f39c12', // Gen 2 - Laranja (Johto)
      '#27ae60', // Gen 3 - Verde (Hoenn)
      '#3498db', // Gen 4 - Azul (Sinnoh)
      '#9b59b6', // Gen 5 - Roxo (Unova)
      '#e91e63', // Gen 6 - Rosa (Kalos)
      '#ff9800', // Gen 7 - Laranja vibrante (Alola)
      '#795548'  // Gen 8 - Marrom (Galar)
    ];

    return colors[generationId - 1] || '#6c757d';
  }

  /**
   * Obtém a cor para uma opção de ordenação específica.
   * @param sortValue Valor da opção de ordenação
   */
  getSortColor(sortValue: string): string {
    const colors = {
      'id': '#007bff',     // Azul para ID/Número
      'name': '#28a745',   // Verde para Nome
      'height': '#ffc107', // Amarelo para Altura
      'weight': '#dc3545'  // Vermelho para Peso
    };

    return colors[sortValue as keyof typeof colors] || '#6c757d';
  }

  /**
   * Retorna a cor temática para um habitat específico
   */
  getHabitatColor(habitat: string): string {
    const habitatColors: { [key: string]: string } = {
      'cave': '#8B4513',        // Marrom para cavernas
      'forest': '#228B22',      // Verde para florestas
      'grassland': '#9ACD32',   // Verde claro para campos
      'mountain': '#696969',    // Cinza para montanhas
      'rare': '#9932CC',        // Roxo para locais raros
      'rough-terrain': '#A0522D', // Marrom claro para terrenos acidentados
      'sea': '#4682B4',         // Azul para oceanos
      'urban': '#708090',       // Cinza azulado para áreas urbanas
      'waters-edge': '#20B2AA'  // Azul esverdeado para beiras d'água
    };
    return habitatColors[habitat] || '#4CAF50'; // Verde padrão
  }

  /**
   * Alterna a seleção de um habitat (apenas um habitat pode ser selecionado por vez).
   */
  onHabitatToggle(habitat: string) {
    const currentHabitats = this.filterForm.get('selectedHabitats')?.value || [];
    const isCurrentlySelected = currentHabitats.includes(habitat);

    if (isCurrentlySelected) {
      // Se o habitat já está selecionado, desseleciona (limpa a seleção)
      this.filterForm.get('selectedHabitats')?.setValue([]);
    } else {
      // Se não está selecionado, seleciona apenas este habitat (single-selection)
      this.filterForm.get('selectedHabitats')?.setValue([habitat]);
    }
  }

  /**
   * Limpa todos os filtros e reseta o formulário.
   */
  onClearFilters() {
    // Reset dos estados de ordenação
    this.sortStates = {
      'id': 'none',
      'name': 'none',
      'height': 'none',
      'weight': 'none'
    };
    this.activeSortField = null;

    this.filterForm.reset({
      searchTerm: '',
      selectedElementTypes: [],
      selectedMovementTypes: [],
      selectedHabitats: [],
      selectedGeneration: null,
      sortBy: null,
      sortOrder: null
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
    if (formValue.selectedHabitats?.length > 0) count++;
    if (formValue.selectedGeneration !== null) count++;

    // Contar ordenação apenas se estiver ativa (não 'none')
    // Verificar se há um campo de ordenação ativo através dos sortStates
    const hasActiveSorting = this.activeSortField !== null &&
                            this.sortStates[this.activeSortField] !== 'none';
    if (hasActiveSorting) count++;

    return count;
  }
}
