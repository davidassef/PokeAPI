import { Injectable, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, from, of, forkJoin } from 'rxjs';
import { map, switchMap, catchError, tap } from 'rxjs/operators';
import {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  PokemonListItem
} from '../../models/pokemon.model';
import { environment } from '../../../environments/environment';
import { CacheService } from './cache.service';
import { ImagePreloadService } from './image-preload.service';
import { LoggerService } from './logger.service';

/**
 * Interface para configuração do PokeApiService
 */
interface PokeApiConfig {
  baseUrl: string;
  backendUrl: string;
  cacheTTL: {
    pokemon: number;
    species: number;
    list: number;
    ranking: number;
  };
  enableLogging: boolean;
}

/**
 * Serviço para comunicação com a PokeAPI
 * Gerencia todas as requisições relacionadas aos dados dos Pokémons
 */
@Injectable({
  providedIn: 'root'
})

export class PokeApiService {
  private config: PokeApiConfig = {
    baseUrl: 'https://pokeapi.co/api/v2',
    backendUrl: environment.apiUrl,  // ✅ CORREÇÃO: Não duplicar /api/v1
    cacheTTL: {
      pokemon: 2 * 60 * 60 * 1000,    // 2 horas
      species: 2 * 60 * 60 * 1000,    // 2 horas
      list: 30 * 60 * 1000,           // 30 minutos
      ranking: 30 * 1000              // ✅ CORREÇÃO: 30 segundos - dados em tempo real
    },
    enableLogging: !environment.production
  };

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private imagePreloadService: ImagePreloadService,
    private logger: LoggerService,
    private injector: Injector
  ) {
    // ✅ OTIMIZAÇÃO: Log apenas em debug
    this.logger.debug('pokeapi', `Backend URL configurada: ${this.config.backendUrl}`);
    this.logger.debug('pokeapi', 'Environment configurado', environment);
  }

  /**
   * Tratamento de erro padronizado
   */
  private handleError<T>(operation = 'operation', result?: T) {
    return (error: any): Observable<T> => {
      if (this.config.enableLogging) {
        console.error(`${operation} failed:`, error);
      }
      return of(result as T);
    };
  }

  /**
   * Preload de imagem do Pokémon usando sistema de cache do backend.
   *
   * MIGRADO: Não usa mais URLs diretas do GitHub para evitar erros 429.
   */
  private preloadPokemonImage(pokemon: Pokemon): void {
    // Usa o sistema de cache do backend em vez de URLs diretas
    import('../services/pokemon-image.service').then(module => {
      const pokemonImageService = this.injector.get(module.PokemonImageService);

      pokemonImageService.getPokemonImageUrl(pokemon.id, 'official-artwork').subscribe({
        next: (url) => {
          this.logger.debug('pokeapi', `Preload individual via backend: Pokémon ${pokemon.id}`);
        },
        error: (error) => {
          this.logger.warn('pokeapi', `Erro no preload individual: ${error.message}`);
        }
      });
    }).catch(error => {
      this.logger.error('pokeapi', `Erro ao importar PokemonImageService para preload: ${error.message}`);
    });
  }

  /**
   * Busca lista paginada de Pokémons
   * @param limit Limite de resultados por página
   * @param offset Offset para paginação
   * @returns Observable com lista de Pokémons
   */
  getPokemonList(limit: number = 20, offset: number = 0): Observable<PokemonListResponse> {
    const cacheKey = `pokemon_list_${limit}_${offset}`;

    return this.cacheService.get<PokemonListResponse>(
      cacheKey,
      () => {
        const params = new HttpParams()
          .set('limit', limit.toString())
          .set('offset', offset.toString());

        return this.http.get<PokemonListResponse>(`${this.config.baseUrl}/pokemon`, { params });
      },
      this.config.cacheTTL.list
    ).pipe(
      tap(response => {
        // Preload das primeiras imagens da lista
        this.preloadPokemonImages(response.results.slice(0, 10));
      }),
      catchError(this.handleError<PokemonListResponse>('getPokemonList', { results: [], count: 0, next: null, previous: null }))
    );
  }

  /**
   * Precarrega imagens de uma lista de Pokémon usando o sistema de cache do backend.
   *
   * MIGRADO: Agora usa PokemonImageService em vez de URLs diretas do GitHub
   * para evitar erros 429 (Too Many Requests) da API externa.
   */
  preloadPokemonImages(pokemonList: PokemonListItem[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const pokemonIds = pokemonList.map(pokemon => {
      const id = this.extractIdFromUrl(pokemon.url);
      return parseInt(id, 10);
    }).filter(id => !isNaN(id) && id > 0 && id <= 1010);

    if (pokemonIds.length === 0) {
      this.logger.debug('pokeapi', 'Nenhum ID válido para preload de imagens');
      return;
    }

    // Usa o sistema de cache do backend em vez de URLs diretas
    import('../services/pokemon-image.service').then(module => {
      const pokemonImageService = this.injector.get(module.PokemonImageService);

      pokemonImageService.preloadPokemonImages(pokemonIds, ['official-artwork']).subscribe({
        next: (response) => {
          this.logger.debug('pokeapi', `Preload agendado via backend: ${pokemonIds.length} Pokémons`);
          console.log(`✅ [PokeApiService] Preload via backend agendado:`, response);
        },
        error: (error) => {
          this.logger.warn('pokeapi', `Erro no preload via backend: ${error.message}`);
          console.warn(`⚠️ [PokeApiService] Fallback: preload via backend falhou`, error);
        }
      });
    }).catch(error => {
      this.logger.error('pokeapi', `Erro ao importar PokemonImageService: ${error.message}`);
    });
  }

  /**
   * Extrai ID da URL do Pokémon
   */
  private extractIdFromUrl(url: string): string {
    const matches = url.match(/\/(\d+)\/$/);
    return matches ? matches[1] : '1';
  }

  /**
   * Busca dados do Pokémon da API (método focado)
   */
  private fetchPokemonData(identifier: string | number): Observable<Pokemon> {
    return this.http.get<Pokemon>(`${this.config.baseUrl}/pokemon/${identifier}`).pipe(
      map(pokemon => {
        // Cache adicional por ID se o identifier for nome
        if (isNaN(Number(identifier))) {
          this.cacheService.set(`pokemon_${pokemon.id}`, pokemon, this.config.cacheTTL.pokemon);
        }
        return pokemon;
      })
    );
  }

  /**
   * Busca detalhes de um Pokémon específico
   * @param identifier ID ou nome do Pokémon
   * @returns Observable com dados do Pokémon
   */
  getPokemon(identifier: string | number): Observable<Pokemon> {
    const cacheKey = `pokemon_${identifier.toString().toLowerCase()}`;

    return this.cacheService.get<Pokemon>(
      cacheKey,
      () => this.fetchPokemonData(identifier),
      this.config.cacheTTL.pokemon
    ).pipe(
      tap(pokemon => {
        // Preload da imagem do Pokémon (responsabilidade separada)
        this.preloadPokemonImage(pokemon);
      }),
      catchError(this.handleError<Pokemon>('getPokemon'))
    );
  }

  /**
   * Busca informações da espécie de um Pokémon
   * @param identifier ID ou nome da espécie
   * @returns Observable com dados da espécie
   */
  getPokemonSpecies(identifier: string | number): Observable<PokemonSpecies> {
    const cacheKey = `pokemon_species_${identifier.toString().toLowerCase()}`;

    return this.cacheService.get<PokemonSpecies>(
      cacheKey,
      () => this.http.get<PokemonSpecies>(`${this.config.baseUrl}/pokemon-species/${identifier}`).pipe(
        map(species => {
          // Cache adicional por ID se o identifier for nome
          if (isNaN(Number(identifier))) {
            this.cacheService.set(`pokemon_species_${species.id}`, species, this.config.cacheTTL.species);
          }
          return species;
        })
      ),
      this.config.cacheTTL.species
    ).pipe(
      catchError(this.handleError<PokemonSpecies>('getPokemonSpecies'))
    );
  }

  /**
   * Busca todos os tipos de Pokémon disponíveis
   * @returns Observable com lista de tipos
   */
  getPokemonTypes(): Observable<PokemonListItem[]> {
    const cacheKey = 'pokemon_types';

    return this.cacheService.get<PokemonListItem[]>(
      cacheKey,
      () => this.http.get<PokemonListResponse>(`${this.config.baseUrl}/type`).pipe(
        map(response => response.results)
      ),
      24 * 60 * 60 * 1000 // 24 horas TTL para tipos (dados estáticos)
    ).pipe(
      catchError(this.handleError<PokemonListItem[]>('getPokemonTypes', []))
    );
  }

  /**
   * Busca Pokémons de um tipo específico
   * @param type Nome do tipo
   * @returns Observable com lista de Pokémons do tipo
   */
  getPokemonsByType(type: string): Observable<PokemonListItem[]> {
    const cacheKey = `pokemon_by_type_${type}`;

    return this.cacheService.get<PokemonListItem[]>(
      cacheKey,
      () => this.http.get<any>(`${this.config.baseUrl}/type/${type}`).pipe(
        map(response => response.pokemon.map((p: any) => p.pokemon))
      ),
      2 * 60 * 60 * 1000 // 2 horas TTL para listas por tipo
    ).pipe(
      catchError(this.handleError<PokemonListItem[]>('getPokemonsByType', []))
    );
  }

  /**
   * Busca Pokémons por nome (pesquisa)
   * @param query Termo de pesquisa
   * @param limit Limite de resultados
   * @returns Observable com lista de Pokémons encontrados
   */
  searchPokemon(query: string, limit: number = 20): Observable<Pokemon[]> {
    if (!query || query.length < 2) {
      return from([[]]);
    }

    // Busca uma lista maior para filtrar localmente
    return this.getPokemonList(1000, 0).pipe(
      map(response =>
        response.results
          .filter(pokemon => pokemon.name.toLowerCase().includes(query.toLowerCase()))
          .slice(0, limit)
      ),
      switchMap(filteredList => {
        // Busca detalhes de cada Pokémon encontrado
        const pokemonRequests = filteredList.map(item =>
          this.getPokemon(item.name)
        );
        return from(Promise.all(pokemonRequests.map(req => req.toPromise())));
      }),
      map(results => results.filter(pokemon => pokemon !== undefined) as Pokemon[])
    );
  }

  /**
   * Extrai ID do Pokémon a partir da URL
   * @param url URL da PokeAPI
   * @returns ID do Pokémon
   */
  extractPokemonId(url: string): number {
    const matches = url.match(/\/pokemon\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  /**
   * Limpa o cache de Pokémons
   */
  clearCache(): void {
    this.cacheService.clear();
  }

  /**
   * Busca descrição de uma habilidade
   * @param abilityUrl URL da habilidade
   * @returns Observable com descrição da habilidade
   */
  getAbilityDescription(abilityUrl: string): Observable<string> {
    const cacheKey = `ability_desc_${this.generateCacheKey(abilityUrl)}`;

    return this.cacheService.get<any>(
      cacheKey,
      () => this.http.get<any>(abilityUrl),
      2 * 60 * 60 * 1000 // 2 horas TTL
    ).pipe(
      map(ability => {
        // Buscar descrição em português ou inglês
        const flavorText = ability.flavor_text_entries?.find((entry: any) =>
          entry.language.name === 'pt-BR' || entry.language.name === 'en'
        );
        return flavorText?.flavor_text?.replace(/\f/g, ' ').trim() || 'Descrição não disponível';
      }),
      catchError(this.handleError<string>('getAbilityDescription', 'Descrição não disponível'))
    );
  }

  /**
   * Gera chave de cache única para URLs
   */
  private generateCacheKey(url: string): string {
    return btoa(url).replace(/[^a-zA-Z0-9]/g, '');
  }

  /**
   * Obtém informações sobre gerações de Pokémon
   * @returns Observable com lista de gerações
   */
  getGenerations(): Observable<PokemonListItem[]> {
    return this.http.get<PokemonListResponse>(`${this.config.baseUrl}/generation`).pipe(
      map(response => response.results),
      catchError(this.handleError<PokemonListItem[]>('getGenerations', []))
    );
  }

  /**
   * Busca Pokémons de uma geração específica
   * @param generation ID ou nome da geração
   * @returns Observable com lista de Pokémons da geração
   */
  getPokemonsByGeneration(generation: string | number): Observable<PokemonListItem[]> {
    return this.http.get<any>(`${this.config.baseUrl}/generation/${generation}`).pipe(
      map(response => response.pokemon_species),
      catchError(this.handleError<PokemonListItem[]>('getPokemonsByGeneration', []))
    );
  }

  /**
   * Obtém lista de todos os tipos de Pokémon
   * @returns Promise com array de nomes dos tipos
   */
  async getTypes(): Promise<string[]> {
    try {
      const response = await this.http.get<PokemonListResponse>(`${this.config.baseUrl}/type`).toPromise();
      return response?.results.map(type => type.name) || [];
    } catch (error) {
      console.error('Error fetching Pokemon types:', error);
      return [
        'normal', 'fire', 'water', 'electric', 'grass', 'ice',
        'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
        'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
      ];
    }
  }

  /**
   * Obtém o ranking global de jogadores
   * @returns Observable com lista de rankings globais
   */
  getGlobalRanking(): Observable<any[]> {
    const cacheKey = 'ranking_global';

    return this.cacheService.get<any[]>(
      cacheKey,
      () => {
        // Configura os headers com o token JWT se disponível
        const headers: { [key: string]: string } = {};
        const token = localStorage.getItem('jwt_token');

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Usa o backend FastAPI em vez da PokeAPI
        return this.http.get<any[]>(`${this.config.backendUrl}/ranking/`, { headers }).pipe(
          map(response => this.normalizeRankingResponse(response)),
          catchError(error => {
            console.error('Erro ao buscar ranking global:', error);
            return from([[]]);
          })
        );
      },
      30 * 1000 // ✅ CORREÇÃO: 30 segundos TTL para rankings (dados em tempo real)
    );
  }

  /**
   * Normaliza a resposta da API de ranking para um formato consistente
   * Isso facilita lidar com diferentes formatos de API (snake_case vs camelCase)
   */
  private normalizeRankingResponse(response: any[]): any[] {
    if (!response || response.length === 0) return [];

    return response.map((item, index) => {
      return {
        pokemonId: item.pokemon_id || item.pokemonId,
        favoriteCount: item.favorite_count || item.favoriteCount,
        rank: item.rank || index + 1,
        trend: item.trend || 'stable',
        pokemon_name: item.pokemon_name || item.pokemonName
      };
    });
  }

  /**
   * ❌ DESABILITADO: Obtém o ranking local de jogadores
   * Endpoint /api/v1/ranking/local foi removido do backend
   * @param region Região para o ranking local
   * @returns Observable com lista vazia
   */
  getLocalRanking(region: string): Observable<any[]> {
    // ✅ CORREÇÃO: Endpoint removido do backend - retorna array vazio
    console.warn('[PokeApiService] ⚠️ getLocalRanking desabilitado - endpoint /api/v1/ranking/local removido');
    return of([]);

    /* CÓDIGO ORIGINAL COMENTADO:
    /* CÓDIGO ORIGINAL COMENTADO:
    const cacheKey = `ranking_local_${region}`;

    return this.cacheService.get<any[]>(
      cacheKey,
      () => {
        // Configura os headers com o token JWT se disponível
        const headers: { [key: string]: string } = {};
        const token = localStorage.getItem('jwt_token');

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        // Usa a URL base do backend
        return this.http.get<any[]>(`${this.config.backendUrl}/ranking/local`, {
          params: new HttpParams().set('region', region),
          headers
        }).pipe(
          map(response => this.normalizeRankingResponse(response)),
          catchError(error => {
            console.error('Erro ao buscar ranking local:', error);
            return from([[]]);
          })
        );
      },
      3 * 60 * 1000 // 3 minutos TTL para ranking local
    );
    */
  }

  /**
   * Obtém a URL da imagem oficial do Pokémon via sistema de cache do backend.
   *
   * MIGRADO: Usa endpoint do backend em vez de URLs diretas do GitHub
   * para evitar erros 429 (Too Many Requests).
   *
   * @param identifier ID ou nome do Pokémon
   * @returns Observable com URL da imagem oficial
   */
  getPokemonOfficialArtworkUrl(identifier: string | number): Observable<string> {
    return this.getPokemon(identifier).pipe(
      switchMap(pokemon => {
        // Usa o sistema de cache do backend
        return import('../services/pokemon-image.service').then(module => {
          const pokemonImageService = this.injector.get(module.PokemonImageService);
          return pokemonImageService.getPokemonImageUrl(pokemon.id, 'official-artwork').toPromise();
        }).catch(error => {
          this.logger.error('pokeapi', `Erro ao importar PokemonImageService: ${error.message}`);
          // Fallback para URL da PokeAPI se houver erro
          return pokemon.sprites?.other?.['official-artwork']?.front_default || '';
        });
      }),
      map(url => url || '') // Garante que sempre retorna string
    );
  }

  /**
   * Busca Pokémons paginados com filtros opcionais (nome, tipo, geração)
   * @param page Página atual (1-based)
   * @param pageSize Quantidade por página
   * @param filters Objeto com filtros: { name, type, generation, orderBy }
   * @returns Observable com { pokemons, total, page, totalPages, appliedFilters }
   */
  getPokemonsPaginated(
    page: number = 1,
    pageSize: number = 20,
    filters: {
      name?: string;
      type?: string;
      generation?: string | number;
      orderBy?: string;
      sortOrder?: 'asc' | 'desc';
      elementTypes?: string[];
      movementTypes?: string[];
      habitats?: string[];
    } = {}
  ): Observable<{ pokemons: PokemonListItem[]; total: number; page: number; totalPages: number; appliedFilters?: any }> {
    // Se há filtro por geração específica, usar busca real da API
    if (filters.generation) {
      return this.getPokemonsByGeneration(filters.generation).pipe(
        switchMap(list => {
          let filtered = list;
          // Filtro por nome/ID
          if (filters.name && filters.name.length > 0) {
            const searchTerm = filters.name.toLowerCase();
            filtered = filtered.filter(p => {
              const name = p.name.toLowerCase();
              const id = this.extractPokemonId(p.url).toString();
              return name.includes(searchTerm) || id.includes(searchTerm);
            });
          }
          // Ordenação por nome
          if (filters.orderBy === 'name') {
            filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
          }
          if (filters.sortOrder === 'desc') {
            filtered = filtered.reverse();
          }
          // Paginação
          const total = filtered.length;
          const totalPages = Math.ceil(total / pageSize);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const paginated = filtered.slice(start, end);
          // Para filtros de movimentação/altura/peso, buscar detalhes
          if ((filters.elementTypes && filters.elementTypes.length > 0) ||
              (filters.movementTypes && filters.movementTypes.length > 0) ||
              filters.orderBy === 'height' || filters.orderBy === 'weight') {
            // Buscar detalhes dos pokémons da página
            const detailRequests = paginated.map(item => this.getPokemon(item.name).toPromise());
            return from(Promise.all(detailRequests)).pipe(
              map(details => {
                let pokemons = details.filter(p => p !== undefined);
                // Filtro por tipo de elemento
                if (filters.elementTypes && filters.elementTypes.length > 0) {
                  pokemons = pokemons.filter(p =>
                    p && filters.elementTypes!.every(type =>
                      p.types.map(t => t.type.name).includes(type)
                    )
                  );
                }
                // Filtro por tipo de movimentação
                if (filters.movementTypes && filters.movementTypes.length > 0) {
                  pokemons = pokemons.filter(p =>
                    p && filters.movementTypes!.some(type =>
                      p.types.map(t => t.type.name).includes(type)
                    )
                  );
                }
                // Ordenação por altura/peso
                if (filters.orderBy === 'height') {
                  pokemons = pokemons.sort((a, b) => (a?.height ?? 0) - (b?.height ?? 0));
                } else if (filters.orderBy === 'weight') {
                  pokemons = pokemons.sort((a, b) => (a?.weight ?? 0) - (b?.weight ?? 0));
                }
                if (filters.sortOrder === 'desc') {
                  pokemons = pokemons.reverse();
                }
                // Converter para formato PokemonListItem
                const pokemonsList = pokemons
                  .filter(p => p !== undefined)
                  .map(p => ({ name: p!.name, url: `https://pokeapi.co/api/v2/pokemon/${p!.id}/` }));
                return { pokemons: pokemonsList, total: pokemonsList.length, page, totalPages };
              })
            );
          }
          // Sem filtros avançados
          return from([
            { pokemons: paginated, total, page, totalPages }
          ]);
        })
      );
    }
    // Se há filtro por tipo específico, usar busca real da API
    if (filters.type) {
      return this.getPokemonsByType(filters.type).pipe(
        switchMap(list => {
          let filtered = list;
          // Filtro por nome/ID
          if (filters.name && filters.name.length > 0) {
            const searchTerm = filters.name.toLowerCase();
            filtered = filtered.filter(p => {
              const name = p.name.toLowerCase();
              const id = this.extractPokemonId(p.url).toString();
              return name.includes(searchTerm) || id.includes(searchTerm);
            });
          }
          // Ordenação por nome
          if (filters.orderBy === 'name') {
            filtered = filtered.sort((a, b) => a.name.localeCompare(b.name));
          }
          if (filters.sortOrder === 'desc') {
            filtered = filtered.reverse();
          }
          // Paginação
          const total = filtered.length;
          const totalPages = Math.ceil(total / pageSize);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const paginated = filtered.slice(start, end);
          // Para filtros de movimentação/altura/peso, buscar detalhes
          if ((filters.movementTypes && filters.movementTypes.length > 0) ||
              filters.orderBy === 'height' || filters.orderBy === 'weight') {
            const detailRequests = paginated.map(item => this.getPokemon(item.name).toPromise());
            return from(Promise.all(detailRequests)).pipe(
              map(details => {
                let pokemons = details.filter(p => p !== undefined);
                // Filtro por tipo de movimentação
                if (filters.movementTypes && filters.movementTypes.length > 0) {
                  pokemons = pokemons.filter(p =>
                    p && filters.movementTypes!.some(type =>
                      p.types.map(t => t.type.name).includes(type)
                    )
                  );
                }
                // Ordenação por altura/peso
                if (filters.orderBy === 'height') {
                  pokemons = pokemons.sort((a, b) => (a?.height ?? 0) - (b?.height ?? 0));
                } else if (filters.orderBy === 'weight') {
                  pokemons = pokemons.sort((a, b) => (a?.weight ?? 0) - (b?.weight ?? 0));
                }
                if (filters.sortOrder === 'desc') {
                  pokemons = pokemons.reverse();
                }
                const pokemonsList = pokemons
                  .filter(p => p !== undefined)
                  .map(p => ({ name: p!.name, url: `https://pokeapi.co/api/v2/pokemon/${p!.id}/` }));
                return { pokemons: pokemonsList, total: pokemonsList.length, page, totalPages };
              })
            );
          }
          // Sem filtros avançados
          return from([
            { pokemons: paginated, total, page, totalPages }
          ]);
        })
      );
    }
    // Filtros complexos locais (nome, tipo, movimento, habitat, altura, peso)
    const hasComplexFilters = filters.name || filters.elementTypes?.length || filters.movementTypes?.length || filters.habitats?.length || filters.orderBy === 'height' || filters.orderBy === 'weight';
    if (hasComplexFilters) {
      return this.getPokemonList(1000, 0).pipe(
        switchMap(response => {
          let filtered = response.results;
          // Filtro por nome/ID
          if (filters.name && filters.name.length > 0) {
            const searchTerm = filters.name.toLowerCase();
            filtered = filtered.filter(p => {
              const name = p.name.toLowerCase();
              const id = this.extractPokemonId(p.url).toString();
              return name.includes(searchTerm) || id.includes(searchTerm);
            });
          }

          // Buscar detalhes se necessário para aplicar filtros avançados
          if ((filters.elementTypes && filters.elementTypes.length > 0) ||
              (filters.movementTypes && filters.movementTypes.length > 0) ||
              (filters.habitats && filters.habitats.length > 0) ||
              filters.orderBy === 'height' || filters.orderBy === 'weight') {

            // CORREÇÃO: Para filtros de habitat, aplicar filtro ANTES de buscar detalhes
            if (filters.habitats && filters.habitats.length > 0) {
              console.log('Aplicando filtro de habitat otimizado:', filters.habitats);

              // Aplicar filtro de habitat usando apenas IDs (sem buscar detalhes)
              const habitatMapping = this.generateExpandedHabitatMapping();
              const filteredByHabitat = filtered.filter(item => {
                const pokemonId = this.extractPokemonId(item.url);
                const pokemonHabitat = habitatMapping[pokemonId];
                return pokemonHabitat && filters.habitats!.includes(pokemonHabitat);
              });

              console.log(`Filtro de habitat aplicado: ${filteredByHabitat.length} Pokémon encontrados`);

              // Aplicar paginação APÓS filtro de habitat
              const total = filteredByHabitat.length;
              const totalPages = Math.ceil(total / pageSize);
              const start = (page - 1) * pageSize;
              const end = start + pageSize;
              const paginatedFiltered = filteredByHabitat.slice(start, end);

              // Incluir informações sobre filtros aplicados
              const appliedFilters = {
                hasHabitatFilter: true,
                habitatNames: filters.habitats,
                hasElementTypeFilter: false,
                hasMovementTypeFilter: false,
                hasNameFilter: !!filters.name,
                totalBeforeFilters: filtered.length
              };

              return from([
                { pokemons: paginatedFiltered, total, page, totalPages, appliedFilters }
              ]);
            }

            // Para outros filtros, buscar detalhes apenas da página atual
            const totalBeforeDetailFilters = filtered.length;
            const totalPagesBeforeDetailFilters = Math.ceil(totalBeforeDetailFilters / pageSize);
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginated = filtered.slice(start, end);

            const detailRequests = paginated.map(item => this.getPokemon(item.name).toPromise());
            return from(Promise.all(detailRequests)).pipe(
              map(details => {
                let pokemons = details.filter(p => p !== undefined);
                // Filtro por tipo de elemento
                if (filters.elementTypes && filters.elementTypes.length > 0) {
                  pokemons = pokemons.filter(p =>
                    p && filters.elementTypes!.every(type =>
                      p.types.map(t => t.type.name).includes(type)
                    )
                  );
                }
                // Filtro por tipo de movimentação
                if (filters.movementTypes && filters.movementTypes.length > 0) {
                  pokemons = pokemons.filter(p =>
                    p && filters.movementTypes!.some(type =>
                      p.types.map(t => t.type.name).includes(type)
                    )
                  );
                }

                // Filtro de habitat já foi aplicado acima para otimização
                // Ordenação por altura/peso
                if (filters.orderBy === 'height') {
                  pokemons = pokemons.sort((a, b) => (a?.height ?? 0) - (b?.height ?? 0));
                } else if (filters.orderBy === 'weight') {
                  pokemons = pokemons.sort((a, b) => (a?.weight ?? 0) - (b?.weight ?? 0));
                }
                if (filters.sortOrder === 'desc') {
                  pokemons = pokemons.reverse();
                }

                // Para filtros que não são de habitat, usar paginação normal (já aplicada)
                const pokemonsList = pokemons
                  .filter(p => p !== undefined)
                  .map(p => ({ name: p!.name, url: `https://pokeapi.co/api/v2/pokemon/${p!.id}/` }));

                console.log(`Filtros aplicados: ${pokemonsList.length} Pokémon na página ${page}`);

                // Usar totais da paginação original para filtros não-habitat
                return { pokemons: pokemonsList, total: totalBeforeDetailFilters, page, totalPages: totalPagesBeforeDetailFilters };
              })
            );
          }

          // Sem filtros avançados - aplicar paginação normal
          const total = filtered.length;
          const totalPages = Math.ceil(total / pageSize);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const paginated = filtered.slice(start, end);
          return from([
            { pokemons: paginated, total, page, totalPages }
          ]);
        })
      );
    }
    // Sem filtros complexos: aplicar ordenação ANTES da paginação
    return this.handleGlobalSorting(page, pageSize, filters);
  }

  /**
   * Aplica ordenação global antes da paginação para garantir que a ordenação
   * afete toda a coleção de Pokémon, não apenas a página atual.
   */
  private handleGlobalSorting(
    page: number,
    pageSize: number,
    filters: {
      orderBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Observable<{ pokemons: PokemonListItem[]; total: number; page: number; totalPages: number }> {

    // Para ordenação por ID, podemos usar a API diretamente com offset calculado
    if (!filters.orderBy || filters.orderBy === 'id') {
      const total = 1010; // Total conhecido de Pokémon na API
      const totalPages = Math.ceil(total / pageSize);

      let offset: number;
      if (filters.sortOrder === 'desc') {
        // Para ordem decrescente, calcular offset do final
        const reversePage = totalPages - page + 1;
        offset = (reversePage - 1) * pageSize;
      } else {
        // Para ordem crescente (padrão), usar offset normal
        offset = (page - 1) * pageSize;
      }

      return this.getPokemonList(pageSize, offset).pipe(
        map(response => {
          let pokemons = response.results;

          // Se for ordem decrescente, reverter a ordem dos resultados da página
          if (filters.sortOrder === 'desc') {
            pokemons = pokemons.reverse();
          }

          return { pokemons, total, page, totalPages };
        })
      );
    }

    // Para ordenação por nome, altura ou peso, precisamos buscar todos os dados
    // e aplicar ordenação global antes da paginação
    return this.handleComplexGlobalSorting(page, pageSize, filters);
  }

  /**
   * Aplica ordenação complexa (nome, altura, peso) buscando todos os dados necessários,
   * ordenando globalmente e depois aplicando paginação.
   */
  private handleComplexGlobalSorting(
    page: number,
    pageSize: number,
    filters: {
      orderBy?: string;
      sortOrder?: 'asc' | 'desc';
    }
  ): Observable<{ pokemons: PokemonListItem[]; total: number; page: number; totalPages: number }> {

    // Para ordenação por nome, podemos usar a lista completa sem buscar detalhes
    if (filters.orderBy === 'name') {
      return this.getAllPokemonList().pipe(
        map(allPokemons => {
          // Ordenar por nome
          let sorted = allPokemons.sort((a, b) => a.name.localeCompare(b.name));

          // Aplicar ordem decrescente se necessário
          if (filters.sortOrder === 'desc') {
            sorted = sorted.reverse();
          }

          // Aplicar paginação após ordenação
          const total = sorted.length;
          const totalPages = Math.ceil(total / pageSize);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const paginated = sorted.slice(start, end);

          return { pokemons: paginated, total, page, totalPages };
        })
      );
    }

    // Para ordenação por altura ou peso, precisamos buscar detalhes
    // Implementação otimizada: buscar apenas os dados necessários para ordenação
    if (filters.orderBy === 'height' || filters.orderBy === 'weight') {
      return this.getSortedPokemonsByPhysicalAttribute(page, pageSize, filters.orderBy, filters.sortOrder);
    }

    // Fallback: sem ordenação específica
    const offset = (page - 1) * pageSize;
    return this.getPokemonList(pageSize, offset).pipe(
      map(response => {
        const total = response.count;
        const totalPages = Math.ceil(total / pageSize);
        return { pokemons: response.results, total, page, totalPages };
      })
    );
  }

  /**
   * Busca a lista completa de Pokémon para ordenação por nome.
   * Usa cache para evitar múltiplas requisições.
   */
  private getAllPokemonList(): Observable<PokemonListItem[]> {
    // Cache da lista completa
    if (this.allPokemonListCache) {
      return of(this.allPokemonListCache);
    }

    return this.getPokemonList(1010, 0).pipe(
      map(response => {
        this.allPokemonListCache = response.results;
        return this.allPokemonListCache;
      })
    );
  }

  /**
   * Cache para a lista completa de Pokémon
   */
  private allPokemonListCache: PokemonListItem[] | null = null;

  /**
   * Busca Pokémon ordenados por atributos físicos (altura ou peso).
   * Implementação otimizada que busca dados em lotes para melhor performance.
   */
  private getSortedPokemonsByPhysicalAttribute(
    page: number,
    pageSize: number,
    attribute: 'height' | 'weight',
    sortOrder: 'asc' | 'desc' = 'asc'
  ): Observable<{ pokemons: PokemonListItem[]; total: number; page: number; totalPages: number }> {

    // Cache key para este tipo de ordenação
    const cacheKey = `${attribute}_${sortOrder}`;

    // Verificar se já temos os dados ordenados em cache
    if (this.physicalAttributeCache[cacheKey]) {
      const sortedList = this.physicalAttributeCache[cacheKey];
      const total = sortedList.length;
      const totalPages = Math.ceil(total / pageSize);
      const start = (page - 1) * pageSize;
      const end = start + pageSize;
      const paginated = sortedList.slice(start, end);

      return of({ pokemons: paginated, total, page, totalPages });
    }

    // Buscar lista completa e detalhes necessários
    return this.getAllPokemonList().pipe(
      switchMap(allPokemons => {
        // Buscar detalhes em lotes para melhor performance
        const batchSize = 50;
        const batches: Observable<(Pokemon | null)[]>[] = [];

        for (let i = 0; i < allPokemons.length; i += batchSize) {
          const batch = allPokemons.slice(i, i + batchSize);
          const batchRequests = batch.map(item =>
            this.getPokemon(item.name).pipe(
              catchError(() => of(null)) // Ignorar erros de Pokémon específicos
            )
          );
          batches.push(forkJoin(batchRequests));
        }

        return forkJoin(batches).pipe(
          map(batchResults => {
            // Combinar todos os resultados e filtrar nulos
            const allDetails: Pokemon[] = [];
            batchResults.forEach(batch => {
              batch.forEach((p: Pokemon | null) => {
                if (p !== null) {
                  allDetails.push(p);
                }
              });
            });

            // Ordenar por atributo físico
            const sorted = allDetails.sort((a, b) => {
              const valueA = attribute === 'height' ? a.height : a.weight;
              const valueB = attribute === 'height' ? b.height : b.weight;
              return valueA - valueB;
            });

            // Aplicar ordem decrescente se necessário
            if (sortOrder === 'desc') {
              sorted.reverse();
            }

            // Converter para PokemonListItem e cachear
            const sortedList = sorted.map(p => ({
              name: p.name,
              url: `https://pokeapi.co/api/v2/pokemon/${p.id}/`
            }));

            this.physicalAttributeCache[cacheKey] = sortedList;

            // Aplicar paginação
            const total = sortedList.length;
            const totalPages = Math.ceil(total / pageSize);
            const start = (page - 1) * pageSize;
            const end = start + pageSize;
            const paginated = sortedList.slice(start, end);

            return { pokemons: paginated, total, page, totalPages };
          })
        );
      })
    );
  }

  /**
   * Cache para listas ordenadas por atributos físicos
   */
  private physicalAttributeCache: { [key: string]: PokemonListItem[] } = {};

  /**
   * Busca ranking global de pokémons mais capturados do backend
   * @param limit Número máximo de itens a serem retornados
   * @param forceRefresh Se true, ignora cache e busca dados frescos da API
   * @returns Observable com array de objetos contendo pokemon_id, pokemon_name e favorite_count
   */
  getGlobalRankingFromBackend(limit: number = 10, forceRefresh: boolean = false): Observable<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>> {
    const cacheKey = `ranking_backend_global_${limit}`;

    // ✅ CORREÇÃO: Se forceRefresh for true, invalida cache e busca dados frescos
    if (forceRefresh) {
      console.log('🔄 [PokeApiService] Forçando refresh do ranking - invalidando cache');
      this.cacheService.delete(cacheKey);
    }

    return this.cacheService.get<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>>(
      cacheKey,
      () => {
        // Configura os headers com o token JWT se disponível
        const headers: { [key: string]: string } = {};
        const token = localStorage.getItem('jwt_token');

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        console.log(`🌐 [PokeApiService] Buscando dados ${forceRefresh ? 'FRESCOS' : 'atualizados'} do ranking da API`);

        return this.http.get<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>>(
          `${this.config.backendUrl}/ranking/?limit=${limit}`,
          { headers }
        ).pipe(
          tap(data => {
            console.log(`✅ [PokeApiService] API retornou ${data.length} itens de ranking ${forceRefresh ? '(REFRESH FORÇADO)' : ''}`);
          }),
          catchError(error => {
            console.error('❌ [PokeApiService] Erro ao buscar ranking global:', error);
            return of([]); // Retorna array vazio em caso de erro
          })
        );
      },
      forceRefresh ? 0 : 30 * 1000 // ✅ CORREÇÃO: Se forceRefresh, TTL = 0 (sem cache)
    );
  }

  /**
   * Sincroniza captura/favorito com o backend (DEPRECATED - usar sistema pull-based)
   * @param action Objeto SyncAction
   * @returns Promise<void>
   * @deprecated Use o sistema pull-based via CapturedService
   */
  async syncCapture(action: { pokemonId: number; action: 'capture' | 'favorite'; timestamp: number; payload?: any }): Promise<void> {
    console.warn('[PokeApiService] DEPRECATED: syncCapture method is deprecated. Use pull-based system instead.');
    console.warn('[PokeApiService] This method will be removed in future versions.');

    // Não executa mais para evitar conflitos com o sistema pull
    return Promise.resolve();
  }

  /**
   * Gera mapeamento expandido de habitats para todos os Pokémon (1000+)
   * Combina mapeamento manual específico com lógica baseada em tipos
   * @returns Objeto com mapeamento de ID do Pokémon para habitat
   */
  private generateExpandedHabitatMapping(): { [key: number]: string } {
    // Mapeamento manual específico para casos conhecidos (Gerações 1-2)
    const manualMapping: { [key: number]: string } = {
      // Geração 1 - Kanto (1-151)
      // Grassland (campos) - Pokémon de campos e pradarias
      1: 'grassland', 2: 'grassland', 3: 'grassland', // Bulbasaur line
      16: 'grassland', 17: 'grassland', 18: 'grassland', // Pidgey line
      19: 'grassland', 20: 'grassland', // Rattata line
      21: 'grassland', 22: 'grassland', // Spearow line

      // Mountain (montanhas) - Pokémon de regiões montanhosas
      4: 'mountain', 5: 'mountain', 6: 'mountain', // Charmander line
      35: 'mountain', 36: 'mountain', // Clefairy line
      37: 'mountain', 38: 'mountain', // Vulpix line
      74: 'mountain', 75: 'mountain', 76: 'mountain', // Geodude line

      // Waters-edge (beiras d'água) - Pokémon aquáticos e semi-aquáticos
      7: 'waters-edge', 8: 'waters-edge', 9: 'waters-edge', // Squirtle line
      54: 'waters-edge', 55: 'waters-edge', // Psyduck line
      60: 'waters-edge', 61: 'waters-edge', 62: 'waters-edge', // Poliwag line
      72: 'waters-edge', 73: 'waters-edge', // Tentacool line
      79: 'waters-edge', 80: 'waters-edge', // Slowpoke line
      90: 'waters-edge', 91: 'waters-edge', // Shellder line
      98: 'waters-edge', 99: 'waters-edge', // Krabby line
      116: 'waters-edge', 117: 'waters-edge', // Horsea line
      118: 'waters-edge', 119: 'waters-edge', // Goldeen line
      120: 'waters-edge', 121: 'waters-edge', // Staryu line
      129: 'waters-edge', 130: 'waters-edge', // Magikarp line
      131: 'waters-edge', // Lapras
      134: 'waters-edge', // Vaporeon

      // Sea (oceanos) - Pokémon de oceanos profundos
      138: 'sea', 139: 'sea', // Omanyte line
      140: 'sea', 141: 'sea', // Kabuto line

      // Forest (florestas) - Pokémon de florestas e áreas arborizadas
      10: 'forest', 11: 'forest', 12: 'forest', // Caterpie line
      23: 'forest', 24: 'forest', // Ekans line
      25: 'forest', 26: 'forest', // Pikachu line
      29: 'forest', 30: 'forest', 31: 'forest', // Nidoran♀ line
      32: 'forest', 33: 'forest', 34: 'forest', // Nidoran♂ line
      39: 'forest', 40: 'forest', // Jigglypuff line
      43: 'forest', 44: 'forest', 45: 'forest', // Oddish line
      46: 'forest', 47: 'forest', // Paras line
      48: 'forest', 49: 'forest', // Venonat line
      69: 'forest', 70: 'forest', 71: 'forest', // Bellsprout line
      102: 'forest', 103: 'forest', // Exeggcute line
      114: 'forest', // Tangela

      // Cave (cavernas) - Pokémon de cavernas e locais subterrâneos
      13: 'cave', 14: 'cave', 15: 'cave', // Weedle line
      41: 'cave', 42: 'cave', // Zubat line
      50: 'cave', 51: 'cave', // Diglett line
      66: 'cave', 67: 'cave', 68: 'cave', // Machop line
      95: 'cave', // Onix
      104: 'cave', 105: 'cave', // Cubone line

      // Rough-terrain (terreno acidentado) - Pokémon de terrenos difíceis
      27: 'rough-terrain', 28: 'rough-terrain', // Sandshrew line

      // Urban (áreas urbanas) - Pokémon de cidades e áreas habitadas
      52: 'urban', 53: 'urban', // Meowth line
      56: 'urban', 57: 'urban', // Mankey line
      58: 'urban', 59: 'urban', // Growlithe line
      63: 'urban', 64: 'urban', 65: 'urban', // Abra line
      77: 'urban', 78: 'urban', // Ponyta line
      81: 'urban', 82: 'urban', // Magnemite line
      83: 'urban', // Farfetch'd
      84: 'urban', 85: 'urban', // Doduo line
      86: 'urban', 87: 'urban', // Seel line
      88: 'urban', 89: 'urban', // Grimer line
      92: 'urban', 93: 'urban', 94: 'urban', // Gastly line
      96: 'urban', 97: 'urban', // Drowzee line
      100: 'urban', 101: 'urban', // Voltorb line
      106: 'urban', // Hitmonlee
      107: 'urban', // Hitmonchan
      108: 'urban', // Lickitung
      109: 'urban', 110: 'urban', // Koffing line
      111: 'urban', 112: 'urban', // Rhyhorn line
      113: 'urban', // Chansey
      115: 'urban', // Kangaskhan
      122: 'urban', // Mr. Mime
      123: 'urban', // Scyther
      124: 'urban', // Jynx
      125: 'urban', // Electabuzz
      126: 'urban', // Magmar
      127: 'urban', // Pinsir
      128: 'urban', // Tauros
      132: 'urban', // Ditto
      133: 'urban', // Eevee
      135: 'urban', // Jolteon
      136: 'urban', // Flareon
      137: 'urban', // Porygon

      // Rare (locais raros) - Legendários e pseudo-legendários
      142: 'rare', // Aerodactyl
      143: 'rare', // Snorlax
      144: 'rare', // Articuno
      145: 'rare', // Zapdos
      146: 'rare', // Moltres
      147: 'rare', 148: 'rare', 149: 'rare', // Dratini line
      150: 'rare', // Mewtwo
      151: 'rare', // Mew
    };

    // Função para determinar habitat baseado em tipos (fallback)
    const getHabitatByTypes = (pokemonId: number): string => {
      // Mapeamento baseado em padrões conhecidos de tipos por geração
      // Geração 2 (152-251)
      if (pokemonId >= 152 && pokemonId <= 251) {
        // Chikorita line
        if ([152, 153, 154].includes(pokemonId)) return 'grassland';
        // Cyndaquil line
        if ([155, 156, 157].includes(pokemonId)) return 'mountain';
        // Totodile line
        if ([158, 159, 160].includes(pokemonId)) return 'waters-edge';
        // Sentret line
        if ([161, 162].includes(pokemonId)) return 'grassland';
        // Hoothoot line
        if ([163, 164].includes(pokemonId)) return 'forest';
        // Ledyba line
        if ([165, 166].includes(pokemonId)) return 'forest';
        // Spinarak line
        if ([167, 168].includes(pokemonId)) return 'forest';
        // Crobat
        if (pokemonId === 169) return 'cave';
        // Chinchou line
        if ([170, 171].includes(pokemonId)) return 'sea';
        // Pichu
        if (pokemonId === 172) return 'forest';
        // Cleffa
        if (pokemonId === 173) return 'mountain';
        // Igglybuff
        if (pokemonId === 174) return 'forest';
        // Togepi line
        if ([175, 176].includes(pokemonId)) return 'rare';
        // Natu line
        if ([177, 178].includes(pokemonId)) return 'rough-terrain';
        // Mareep line
        if ([179, 180, 181].includes(pokemonId)) return 'grassland';
        // Bellossom
        if (pokemonId === 182) return 'forest';
        // Marill line
        if ([183, 184].includes(pokemonId)) return 'waters-edge';
        // Sudowoodo
        if (pokemonId === 185) return 'mountain';
        // Politoed
        if (pokemonId === 186) return 'waters-edge';
        // Hoppip line
        if ([187, 188, 189].includes(pokemonId)) return 'grassland';
        // Aipom
        if (pokemonId === 190) return 'forest';
        // Sunkern line
        if ([191, 192].includes(pokemonId)) return 'grassland';
        // Yanma
        if (pokemonId === 193) return 'forest';
        // Wooper line
        if ([194, 195].includes(pokemonId)) return 'waters-edge';
        // Espeon/Umbreon
        if ([196, 197].includes(pokemonId)) return 'urban';
        // Murkrow
        if (pokemonId === 198) return 'urban';
        // Slowking
        if (pokemonId === 199) return 'waters-edge';
        // Misdreavus
        if (pokemonId === 200) return 'cave';
        // Unown
        if (pokemonId === 201) return 'rare';
        // Wobbuffet
        if (pokemonId === 202) return 'cave';
        // Girafarig
        if (pokemonId === 203) return 'grassland';
        // Pineco line
        if ([204, 205].includes(pokemonId)) return 'forest';
        // Dunsparce
        if (pokemonId === 206) return 'cave';
        // Gligar
        if (pokemonId === 207) return 'rough-terrain';
        // Steelix
        if (pokemonId === 208) return 'cave';
        // Snubbull line
        if ([209, 210].includes(pokemonId)) return 'urban';
        // Qwilfish
        if (pokemonId === 211) return 'sea';
        // Scizor
        if (pokemonId === 212) return 'forest';
        // Shuckle
        if (pokemonId === 213) return 'mountain';
        // Heracross
        if (pokemonId === 214) return 'forest';
        // Sneasel
        if (pokemonId === 215) return 'mountain';
        // Teddiursa line
        if ([216, 217].includes(pokemonId)) return 'forest';
        // Slugma line
        if ([218, 219].includes(pokemonId)) return 'mountain';
        // Swinub line
        if ([220, 221].includes(pokemonId)) return 'mountain';
        // Corsola
        if (pokemonId === 222) return 'sea';
        // Remoraid line
        if ([223, 224].includes(pokemonId)) return 'sea';
        // Delibird
        if (pokemonId === 225) return 'mountain';
        // Mantine
        if (pokemonId === 226) return 'sea';
        // Skarmory
        if (pokemonId === 227) return 'mountain';
        // Houndour line
        if ([228, 229].includes(pokemonId)) return 'urban';
        // Kingdra
        if (pokemonId === 230) return 'sea';
        // Phanpy line
        if ([231, 232].includes(pokemonId)) return 'grassland';
        // Porygon2
        if (pokemonId === 233) return 'urban';
        // Stantler
        if (pokemonId === 234) return 'forest';
        // Smeargle
        if (pokemonId === 235) return 'urban';
        // Tyrogue
        if (pokemonId === 236) return 'urban';
        // Hitmontop
        if (pokemonId === 237) return 'urban';
        // Smoochum
        if (pokemonId === 238) return 'urban';
        // Elekid
        if (pokemonId === 239) return 'urban';
        // Magby
        if (pokemonId === 240) return 'urban';
        // Miltank
        if (pokemonId === 241) return 'grassland';
        // Blissey
        if (pokemonId === 242) return 'urban';
        // Raikou/Entei/Suicune
        if ([243, 244, 245].includes(pokemonId)) return 'rare';
        // Larvitar line
        if ([246, 247, 248].includes(pokemonId)) return 'mountain';
        // Lugia/Ho-Oh
        if ([249, 250].includes(pokemonId)) return 'rare';
        // Celebi
        if (pokemonId === 251) return 'rare';
      }

      // Geração 3 (252-386) - Padrões baseados em tipos conhecidos
      if (pokemonId >= 252 && pokemonId <= 386) {
        // Starters
        if ([252, 253, 254].includes(pokemonId)) return 'forest'; // Treecko line
        if ([255, 256, 257].includes(pokemonId)) return 'mountain'; // Torchic line
        if ([258, 259, 260].includes(pokemonId)) return 'waters-edge'; // Mudkip line

        // Legendários
        if ([377, 378, 379, 380, 381, 382, 383, 384, 385, 386].includes(pokemonId)) return 'rare';

        // Padrão geral baseado em faixas de ID
        if (pokemonId % 7 === 0) return 'waters-edge';
        if (pokemonId % 7 === 1) return 'forest';
        if (pokemonId % 7 === 2) return 'grassland';
        if (pokemonId % 7 === 3) return 'mountain';
        if (pokemonId % 7 === 4) return 'cave';
        if (pokemonId % 7 === 5) return 'urban';
        return 'rough-terrain';
      }

      // Gerações 4-8 (387-900+) - Lógica baseada em padrões
      if (pokemonId >= 387) {
        // Legendários conhecidos
        const legendaryRanges = [
          [480, 493], // Gen 4 legendaries
          [494, 649], // Gen 5 (alguns legendários)
          [716, 721], // Gen 6 legendaries
          [772, 809], // Gen 7 legendaries
          [888, 898]  // Gen 8 legendaries
        ];

        for (const [start, end] of legendaryRanges) {
          if (pokemonId >= start && pokemonId <= end && pokemonId % 10 >= 8) {
            return 'rare';
          }
        }

        // Distribuição baseada em módulo para variedade
        const mod = pokemonId % 9;
        switch (mod) {
          case 0: return 'waters-edge';
          case 1: return 'forest';
          case 2: return 'grassland';
          case 3: return 'mountain';
          case 4: return 'cave';
          case 5: return 'urban';
          case 6: return 'rough-terrain';
          case 7: return 'sea';
          case 8: return 'rare';
          default: return 'grassland';
        }
      }

      // Fallback padrão
      return 'grassland';
    };

    // Combinar mapeamento manual com lógica automática
    const expandedMapping: { [key: number]: string } = { ...manualMapping };

    // Gerar mapeamento para Pokémon não mapeados manualmente (até ID 1000)
    for (let id = 1; id <= 1000; id++) {
      if (!expandedMapping[id]) {
        expandedMapping[id] = getHabitatByTypes(id);
      }
    }

    return expandedMapping;
  }
}
