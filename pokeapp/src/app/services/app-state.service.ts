// 🗃️ Serviço de Estado Global do App
// Gerencia dados globais como lista de Pokémons, UI, preferências e erros
// Segue o princípio de responsabilidade única e código limpo

import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map, distinctUntilChanged } from 'rxjs/operators';
import { Pokemon } from '../models/pokemon.model';
import { StorageUtil } from '../utils/storage.util';

/**
 * Interface do estado global da aplicação
 * Contém dados de pokémons, UI, preferências e erros
 */
export interface AppState {
  pokemons: Pokemon[]; // Lista de pokémons carregados
  selectedPokemon: Pokemon | null; // Pokémon selecionado
  isLoading: boolean; // Estado de carregamento global
  searchTerm: string; // Termo de busca atual
  activeFilters: string[]; // Filtros ativos
  currentPage: string; // Página atual
  language: string; // Idioma selecionado
  theme: 'light' | 'dark' | 'system'; // Tema do app
  audioEnabled: boolean; // Áudio ativado/desativado
  error: string | null; // Mensagem de erro global
}

const initialState: AppState = {
  pokemons: [],
  selectedPokemon: null,
  isLoading: false,
  searchTerm: '',
  activeFilters: [],
  currentPage: 'home',
  language: StorageUtil.get<string>('app-language', 'pt'),
  theme: StorageUtil.get<'light' | 'dark' | 'system'>('app-theme', 'system'),
  audioEnabled: StorageUtil.get<boolean>('audio-enabled', true),
  error: null,
};

/**
 * Serviço de estado global da aplicação
 * Fornece observables e métodos para manipular o estado global
 */
@Injectable({
  providedIn: 'root',
})
export class AppStateService {
  private stateSubject = new BehaviorSubject<AppState>(initialState);
  /** Observable do estado global */
  public state$ = this.stateSubject.asObservable();

  // Seletores específicos para performance
  /** Observable da lista de pokémons */
  public pokemons$ = this.select(state => state.pokemons);
  /** Observable do pokémon selecionado */
  public selectedPokemon$ = this.select(state => state.selectedPokemon);
  /** Observable do estado de carregamento */
  public isLoading$ = this.select(state => state.isLoading);
  /** Observable do termo de busca */
  public searchTerm$ = this.select(state => state.searchTerm);
  /** Observable da página atual */
  public currentPage$ = this.select(state => state.currentPage);
  /** Observable do idioma */
  public language$ = this.select(state => state.language);
  /** Observable do tema */
  public theme$ = this.select(state => state.theme);
  /** Observable de erro global */
  public error$ = this.select(state => state.error);

  // Seletores computados
  /**
   * Observable da lista de pokémons filtrada por busca e filtros ativos
   */
  public filteredPokemons$ = combineLatest([
    this.pokemons$,
    this.searchTerm$,
    this.select(state => state.activeFilters),
  ]).pipe(
    map(([pokemons, searchTerm, filters]) =>
      this.filterPokemons(pokemons, searchTerm, filters),
    ),
  );

  constructor() {
    // Persiste mudanças importantes no localStorage
    this.language$.subscribe(language => {
      StorageUtil.set('app-language', language);
    });
    this.theme$.subscribe(theme => {
      StorageUtil.set('app-theme', theme);
    });
  }

  /**
   * Retorna o estado global atual
   */
  getCurrentState(): AppState {
    return this.stateSubject.value;
  }

  /**
   * Seletor genérico com distinctUntilChanged
   * @param selector Função seletora
   */
  select<T>(selector: (state: AppState) => T): Observable<T> {
    return this.state$.pipe(
      map(selector),
      distinctUntilChanged(),
    );
  }

  /**
   * Atualiza o estado parcialmente
   * @param partialState Objeto parcial do estado
   */
  updateState(partialState: Partial<AppState>): void {
    const currentState = this.getCurrentState();
    const newState = { ...currentState, ...partialState };
    this.stateSubject.next(newState);
  }

  // === Ações de Pokémons ===

  /**
   * Define a lista de pokémons carregados
   * @param pokemons Lista de pokémons
   */
  setPokemons(pokemons: Pokemon[]): void {
    this.updateState({ pokemons, isLoading: false, error: null });
  }

  /**
   * Adiciona pokémons à lista existente
   * @param newPokemons Lista de pokémons a adicionar
   */
  addPokemons(newPokemons: Pokemon[]): void {
    const currentPokemons = this.getCurrentState().pokemons;
    const allPokemons = [...currentPokemons, ...newPokemons];
    this.updateState({ pokemons: allPokemons });
  }

  /**
   * Define o pokémon selecionado
   * @param pokemon Pokémon selecionado ou null
   */
  setSelectedPokemon(pokemon: Pokemon | null): void {
    this.updateState({ selectedPokemon: pokemon });
  }

  // === Ações de Busca e Filtros ===

  /**
   * Define o termo de busca
   * @param searchTerm Termo de busca
   */
  setSearchTerm(searchTerm: string): void {
    this.updateState({ searchTerm });
  }

  /**
   * Define os filtros ativos
   * @param filters Lista de filtros
   */
  setActiveFilters(filters: string[]): void {
    this.updateState({ activeFilters: filters });
  }

  /**
   * Adiciona um filtro à lista de filtros ativos
   * @param filter Filtro a adicionar
   */
  addFilter(filter: string): void {
    const currentFilters = this.getCurrentState().activeFilters;
    if (!currentFilters.includes(filter)) {
      this.updateState({ activeFilters: [...currentFilters, filter] });
    }
  }

  /**
   * Remove um filtro da lista de filtros ativos
   * @param filter Filtro a remover
   */
  removeFilter(filter: string): void {
    const currentFilters = this.getCurrentState().activeFilters;
    const newFilters = currentFilters.filter(f => f !== filter);
    this.updateState({ activeFilters: newFilters });
  }

  /**
   * Limpa todos os filtros e o termo de busca
   */
  clearFilters(): void {
    this.updateState({ activeFilters: [], searchTerm: '' });
  }

  // === Ações de UI e Preferências ===

  /**
   * Define o estado de carregamento global
   * @param isLoading true se estiver carregando
   */
  setLoading(isLoading: boolean): void {
    this.updateState({ isLoading });
  }

  /**
   * Define a página atual
   * @param page Nome da página
   */
  setCurrentPage(page: string): void {
    this.updateState({ currentPage: page });
  }

  /**
   * Define mensagem de erro global
   * @param error Mensagem de erro
   */
  setError(error: string | null): void {
    this.updateState({ error, isLoading: false });
  }

  /**
   * Limpa mensagem de erro global
   */
  clearError(): void {
    this.updateState({ error: null });
  }

  /**
   * Define o idioma do app
   * @param language Código do idioma
   */
  setLanguage(language: string): void {
    this.updateState({ language });
  }

  /**
   * Define o tema do app
   * @param theme Tema selecionado
   */
  setTheme(theme: 'light' | 'dark' | 'system'): void {
    this.updateState({ theme });
  }

  /**
   * Alterna o estado do áudio
   */
  toggleAudio(): void {
    const audioEnabled = !this.getCurrentState().audioEnabled;
    this.updateState({ audioEnabled });
    StorageUtil.set('audio-enabled', audioEnabled);
  }

  // === Métodos auxiliares ===

  /**
   * Filtra pokémons por termo de busca e filtros ativos
   * @param pokemons Lista de pokémons
   * @param searchTerm Termo de busca
   * @param filters Filtros ativos
   * @returns Lista filtrada
   */
  private filterPokemons(pokemons: Pokemon[], searchTerm: string, filters: string[]): Pokemon[] {
    let filtered = [...pokemons];
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(pokemon =>
        pokemon.name.toLowerCase().includes(term) ||
        pokemon.id.toString().includes(term),
      );
    }
    if (filters.length > 0) {
      filtered = filtered.filter(pokemon =>
        pokemon.types?.some(type =>
          filters.includes(type.type.name),
        ),
      );
    }
    return filtered;
  }

  /**
   * Reseta o estado global para os valores iniciais
   */
  resetState(): void {
    this.stateSubject.next(initialState);
  }

  /**
   * Loga o estado global atual no console (debug)
   */
  logCurrentState(): void {
    console.log('Estado global atual:', this.getCurrentState());
  }
}
