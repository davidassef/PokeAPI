import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, tap, switchMap, catchError } from 'rxjs/operators';
import { PokeApiService } from './pokeapi.service';
import { PokemonCacheHelper } from './pokemon-cache-helper.service';
import { ViewedPokemonService } from './viewed-pokemon.service';
import { environment } from '../../../environments/environment';

/**
 * Interface para dados completos do Pokémon
 */
export interface PokemonDetails {
  pokemon: any;
  species: any;
  flavorTexts: string[];
  carouselImages: CarouselImage[];
  abilityDescriptions: { [key: string]: string };
  evolutionChain?: any[];
}

/**
 * Interface para imagens do carrossel
 */
export interface CarouselImage {
  url: string;
  type: 'official' | 'artwork' | 'sprite';
  label: string;
}

/**
 * Gerenciador especializado para dados de detalhes do Pokémon
 * Centraliza toda lógica de carregamento e enriquecimento de dados
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonDetailsManager {
  private config = {
    enableLogging: !environment.production,
    preloadRange: 2,
    maxRetries: 3
  };

  constructor(
    private pokeApiService: PokeApiService,
    private pokemonCacheHelper: PokemonCacheHelper,
    private viewedPokemonService: ViewedPokemonService
  ) {
    if (this.config.enableLogging) {
      console.log('🗄️ PokemonDetailsManager inicializado');
    }
  }

  /**
   * Carrega dados completos do Pokémon com enriquecimento
   */
  loadPokemonDetails(pokemonId: number): Observable<PokemonDetails> {
    this.logIfEnabled('Carregando detalhes completos do Pokémon:', pokemonId);

    return this.pokeApiService.getPokemon(pokemonId).pipe(
      tap(pokemon => {
        this.viewedPokemonService.markPokemonAsViewed(pokemon.id);
        this.logIfEnabled('Pokémon marcado como visualizado:', pokemon.name);
      }),
      switchMap(pokemon => this.enrichPokemonData(pokemon)),
      tap(() => {
        // Preload de Pokémons adjacentes para melhor UX
        this.pokemonCacheHelper.preloadAdjacentPokemon(pokemonId);
        this.logIfEnabled('Preload de adjacentes iniciado para ID:', pokemonId);
      }),
      catchError(error => {
        this.logIfEnabled('Erro ao carregar detalhes do Pokémon:', error);
        throw error;
      })
    );
  }

  /**
   * Enriquece dados básicos do Pokémon com informações adicionais
   */
  private enrichPokemonData(pokemon: any): Observable<PokemonDetails> {
    this.logIfEnabled('Enriquecendo dados do Pokémon:', pokemon.name);

    return forkJoin({
      pokemon: of(pokemon),
      species: this.loadSpeciesData(pokemon.id),
      flavorTexts: this.loadFlavorTexts(pokemon.id)
    }).pipe(
      map(({ pokemon, species, flavorTexts }) => ({
        pokemon,
        species,
        flavorTexts,
        carouselImages: this.generateCarouselImages(pokemon),
        abilityDescriptions: {}
      })),
      tap(details => {
        this.logIfEnabled('Dados enriquecidos:', {
          pokemon: details.pokemon.name,
          species: !!details.species,
          flavorTexts: details.flavorTexts.length,
          carouselImages: details.carouselImages.length
        });
      })
    );
  }

  /**
   * Carrega dados da espécie do Pokémon
   */
  private loadSpeciesData(pokemonId: number): Observable<any> {
    return this.pokeApiService.getPokemonSpecies(pokemonId).pipe(
      catchError(error => {
        this.logIfEnabled('Erro ao carregar dados da espécie:', error);
        return of(null);
      })
    );
  }

  /**
   * Carrega flavor texts do Pokémon
   */
  private loadFlavorTexts(pokemonId: number): Observable<string[]> {
    return this.pokemonCacheHelper.getFlavorTexts(pokemonId).pipe(
      catchError(error => {
        this.logIfEnabled('Erro ao carregar flavor texts:', error);
        return of([]);
      })
    );
  }

  /**
   * Gera imagens do carrossel baseadas nos sprites disponíveis
   */
  generateCarouselImages(pokemon: any): CarouselImage[] {
    const images: CarouselImage[] = [];

    // Imagem oficial (artwork)
    if (pokemon.sprites?.other?.['official-artwork']?.front_default) {
      images.push({
        url: pokemon.sprites.other['official-artwork'].front_default,
        type: 'official',
        label: 'Artwork Oficial'
      });
    }

    // Sprite padrão
    if (pokemon.sprites?.front_default) {
      images.push({
        url: pokemon.sprites.front_default,
        type: 'sprite',
        label: 'Sprite Frontal'
      });
    }

    // Sprite shiny
    if (pokemon.sprites?.front_shiny) {
      images.push({
        url: pokemon.sprites.front_shiny,
        type: 'sprite',
        label: 'Sprite Shiny'
      });
    }

    // Sprite traseiro
    if (pokemon.sprites?.back_default) {
      images.push({
        url: pokemon.sprites.back_default,
        type: 'sprite',
        label: 'Sprite Traseiro'
      });
    }

    // Dream World
    if (pokemon.sprites?.other?.dream_world?.front_default) {
      images.push({
        url: pokemon.sprites.other.dream_world.front_default,
        type: 'artwork',
        label: 'Dream World'
      });
    }

    // Home
    if (pokemon.sprites?.other?.home?.front_default) {
      images.push({
        url: pokemon.sprites.other.home.front_default,
        type: 'artwork',
        label: 'Pokémon Home'
      });
    }

    this.logIfEnabled('Carrossel gerado com', images.length, 'imagens');
    return images;
  }

  /**
   * Carrega dados específicos de uma aba
   */
  loadTabData(tab: string, pokemon: any): Observable<any> {
    this.logIfEnabled('Carregando dados da aba:', tab);

    switch (tab) {
      case 'evolution':
        return this.loadEvolutionChain(pokemon);
      case 'combat':
        return this.loadAbilityDescriptions(pokemon);
      case 'overview':
        return this.loadOverviewData(pokemon);
      case 'curiosities':
        return of(null); // Flavor texts já carregados no enriquecimento
      default:
        return of(null);
    }
  }

  /**
   * Carrega cadeia de evolução do Pokémon
   */
  private loadEvolutionChain(pokemon: any): Observable<any[]> {
    if (!pokemon.species?.evolution_chain?.url) {
      return of([]);
    }

    return this.pokemonCacheHelper.getEvolutionChain(pokemon.species.evolution_chain.url).pipe(
      map(evolutionData => this.processEvolutionChain(evolutionData)),
      catchError(error => {
        this.logIfEnabled('Erro ao carregar cadeia de evolução:', error);
        return of([]);
      })
    );
  }

  /**
   * Processa dados brutos da cadeia de evolução
   */
  private processEvolutionChain(evolutionData: any): any[] {
    const chain: any[] = [];
    let current = evolutionData.chain;

    while (current) {
      const pokemonId = this.extractPokemonIdFromUrl(current.species.url);

      chain.push({
        id: pokemonId,
        name: current.species.name,
        evolutionDetails: current.evolution_details || []
      });

      current = current.evolves_to?.[0];
    }

    this.logIfEnabled('Cadeia de evolução processada:', chain.length, 'estágios');
    return chain;
  }

  /**
   * Carrega descrições das habilidades
   */
  private loadAbilityDescriptions(pokemon: any): Observable<{ [key: string]: string }> {
    if (!pokemon.abilities || pokemon.abilities.length === 0) {
      return of({});
    }

    const abilityRequests = pokemon.abilities.map((ability: any) =>
      this.pokeApiService.getAbilityDescription(ability.ability.url).pipe(
        map(description => ({ [ability.ability.name]: description })),
        catchError(() => of({ [ability.ability.name]: 'Descrição não disponível' }))
      )
    );

    return forkJoin(abilityRequests).pipe(
      map(descriptions => Object.assign({}, ...(descriptions as object[]))),
      tap(descriptions => {
        this.logIfEnabled('Descrições de habilidades carregadas:', Object.keys(descriptions).length);
      })
    );
  }

  /**
   * Carrega dados da aba overview
   */
  private loadOverviewData(pokemon: any): Observable<any> {
    // Para overview, os dados já estão disponíveis no pokemon básico
    return of({
      stats: pokemon.stats,
      types: pokemon.types,
      height: pokemon.height,
      weight: pokemon.weight,
      baseExperience: pokemon.base_experience
    });
  }

  /**
   * Extrai ID do Pokémon de uma URL da PokeAPI
   */
  private extractPokemonIdFromUrl(url: string): number {
    const matches = url.match(/\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  /**
   * Log condicional (apenas em desenvolvimento)
   */
  private logIfEnabled(message: string, ...args: any[]): void {
    if (this.config.enableLogging) {
      console.log(`[PokemonDetailsManager] ${message}`, ...args);
    }
  }
}
