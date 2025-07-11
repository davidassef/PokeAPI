import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, from, of } from 'rxjs';
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

/**
 * Serviço para comunicação com a PokeAPI
 * Gerencia todas as requisições relacionadas aos dados dos Pokémons
 */
@Injectable({
  providedIn: 'root'
})
export class PokeApiService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private readonly backendUrl = `${environment.apiUrl}/api/v1`; // URL do nosso backend FastAPI
  private pokemonCacheSubject = new BehaviorSubject<Map<string, Pokemon>>(new Map());
  private speciesCacheSubject = new BehaviorSubject<Map<string, PokemonSpecies>>(new Map());

  constructor(
    private http: HttpClient,
    private cacheService: CacheService,
    private imagePreloadService: ImagePreloadService
  ) {
    console.log('[PokeApiService] Backend URL configurada:', this.backendUrl);
    console.log('[PokeApiService] Environment:', environment);

    // Configurar cache para Pokémon
    this.cacheService.configure({
      maxSize: 100, // 100MB para dados de Pokémon
      defaultTTL: 60 * 60 * 1000, // 1 hora para dados de Pokémon
      cleanupInterval: 10 * 60 * 1000 // Limpeza a cada 10 minutos
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

        return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon`, { params });
      },
      30 * 60 * 1000 // 30 minutos TTL para listas
    ).pipe(
      tap(response => {
        // Preload das primeiras imagens da lista
        this.preloadPokemonImages(response.results.slice(0, 10));
      })
    );
  }

  /**
   * Precarrega imagens de uma lista de Pokémon
   */
  preloadPokemonImages(pokemonList: PokemonListItem[], priority: 'high' | 'medium' | 'low' = 'medium'): void {
    const imageUrls = pokemonList.map(pokemon => {
      const id = this.extractIdFromUrl(pokemon.url);
      return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
    });

    this.imagePreloadService.preloadBatch(imageUrls, priority).subscribe(
      results => {
        const successCount = results.filter(success => success).length;
        console.log(`📸 Preloaded ${successCount}/${imageUrls.length} Pokemon images`);
      }
    );
  }

  /**
   * Extrai ID da URL do Pokémon
   */
  private extractIdFromUrl(url: string): string {
    const matches = url.match(/\/(\d+)\/$/);
    return matches ? matches[1] : '1';
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
      () => this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${identifier}`).pipe(
        map(pokemon => {
          // Cache adicional por ID se o identifier for nome
          if (isNaN(Number(identifier))) {
            this.cacheService.set(`pokemon_${pokemon.id}`, pokemon);
          }
          return pokemon;
        })
      ),
      2 * 60 * 60 * 1000 // 2 horas TTL para dados de Pokémon
    ).pipe(
      tap(pokemon => {
        // Preload da imagem do Pokémon
        if (pokemon.sprites?.other?.['official-artwork']?.front_default) {
          this.imagePreloadService.preload(
            pokemon.sprites.other['official-artwork'].front_default,
            'high'
          ).subscribe();
        }
      })
    );
  }

  /**
   * Busca informações da espécie de um Pokémon
   * @param identifier ID ou nome da espécie
   * @returns Observable com dados da espécie
   */
  getPokemonSpecies(identifier: string | number): Observable<PokemonSpecies> {
    const key = identifier.toString().toLowerCase();
    const cached = this.speciesCacheSubject.value.get(key);

    if (cached) {
      return from([cached]);
    }

    return this.http.get<PokemonSpecies>(`${this.baseUrl}/pokemon-species/${identifier}`).pipe(
      map(species => {
        // Adiciona ao cache
        const cache = this.speciesCacheSubject.value;
        cache.set(key, species);
        cache.set(species.id.toString(), species);
        this.speciesCacheSubject.next(cache);
        return species;
      })
    );
  }

  /**
   * Busca todos os tipos de Pokémon disponíveis
   * @returns Observable com lista de tipos
   */
  getPokemonTypes(): Observable<PokemonListItem[]> {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}/type`).pipe(
      map(response => response.results)
    );
  }

  /**
   * Busca Pokémons de um tipo específico
   * @param type Nome do tipo
   * @returns Observable com lista de Pokémons do tipo
   */
  getPokemonsByType(type: string): Observable<PokemonListItem[]> {
    return this.http.get<any>(`${this.baseUrl}/type/${type}`).pipe(
      map(response => response.pokemon.map((p: any) => p.pokemon))
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
    this.pokemonCacheSubject.next(new Map());
    this.speciesCacheSubject.next(new Map());
  }

  /**
   * Obtém informações sobre gerações de Pokémon
   * @returns Observable com lista de gerações
   */
  getGenerations(): Observable<PokemonListItem[]> {
    return this.http.get<PokemonListResponse>(`${this.baseUrl}/generation`).pipe(
      map(response => response.results)
    );
  }

  /**
   * Busca Pokémons de uma geração específica
   * @param generation ID ou nome da geração
   * @returns Observable com lista de Pokémons da geração
   */
  getPokemonsByGeneration(generation: string | number): Observable<PokemonListItem[]> {
    return this.http.get<any>(`${this.baseUrl}/generation/${generation}`).pipe(
      map(response => response.pokemon_species)
    );
  }

  /**
   * Obtém lista de todos os tipos de Pokémon
   * @returns Promise com array de nomes dos tipos
   */
  async getTypes(): Promise<string[]> {
    try {
      const response = await this.http.get<PokemonListResponse>(`${this.baseUrl}/type`).toPromise();
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
        return this.http.get<any[]>(`${this.backendUrl}/ranking/`, { headers }).pipe(
          map(response => this.normalizeRankingResponse(response)),
          catchError(error => {
            console.error('Erro ao buscar ranking global:', error);
            return from([[]]);
          })
        );
      },
      5 * 60 * 1000 // 5 minutos TTL para rankings (dados mais dinâmicos)
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
   * Obtém o ranking local de jogadores
   * @param region Região para o ranking local
   * @returns Observable com lista de rankings locais
   */
  getLocalRanking(region: string): Observable<any[]> {
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
        return this.http.get<any[]>(`${this.backendUrl}/ranking/local`, {
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
  }

  /**
   * Obtém a URL da imagem oficial do Pokémon
   * @param identifier ID ou nome do Pokémon
   * @returns URL da imagem oficial
   */
  getPokemonOfficialArtworkUrl(identifier: string | number): Observable<string> {
    return this.getPokemon(identifier).pipe(
      map(pokemon => pokemon.sprites?.other?.['official-artwork']?.front_default || '')
    );
  }

  /**
   * Busca Pokémons paginados com filtros opcionais (nome, tipo, geração)
   * @param page Página atual (1-based)
   * @param pageSize Quantidade por página
   * @param filters Objeto com filtros: { name, type, generation, orderBy }
   * @returns Observable com { pokemons, total, page, totalPages }
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
    } = {}
  ): Observable<{ pokemons: PokemonListItem[]; total: number; page: number; totalPages: number }> {
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
    // Filtros complexos locais (nome, tipo, movimento, altura, peso)
    const hasComplexFilters = filters.name || filters.elementTypes?.length || filters.movementTypes?.length || filters.orderBy === 'height' || filters.orderBy === 'weight';
    if (hasComplexFilters) {
      return this.getPokemonList(151, 0).pipe(
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
          // Paginação
          const total = filtered.length;
          const totalPages = Math.ceil(total / pageSize);
          const start = (page - 1) * pageSize;
          const end = start + pageSize;
          const paginated = filtered.slice(start, end);
          // Buscar detalhes se necessário
          if ((filters.elementTypes && filters.elementTypes.length > 0) ||
              (filters.movementTypes && filters.movementTypes.length > 0) ||
              filters.orderBy === 'height' || filters.orderBy === 'weight') {
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
    // Sem filtros complexos: paginação real da API
    const offset = (page - 1) * pageSize;
    return this.getPokemonList(pageSize, offset).pipe(
      map(response => {
        let pokemons = response.results;
        if (filters.orderBy === 'name') {
          pokemons = pokemons.sort((a, b) => a.name.localeCompare(b.name));
        } else if (filters.orderBy === 'id') {
          pokemons = pokemons.sort((a, b) => {
            const idA = this.extractPokemonId(a.url);
            const idB = this.extractPokemonId(b.url);
            return idA - idB;
          });
        }
        if (filters.sortOrder === 'desc') {
          pokemons = pokemons.reverse();
        }
        const total = response.count;
        const totalPages = Math.ceil(total / pageSize);
        return { pokemons, total, page, totalPages };
      })
    );
  }

  /**
   * Busca ranking global de pokémons mais capturados do backend
   * @param limit Número máximo de itens a serem retornados
   * @returns Observable com array de objetos contendo pokemon_id, pokemon_name e favorite_count
   */
  getGlobalRankingFromBackend(limit: number = 10): Observable<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>> {
    const cacheKey = `ranking_backend_global_${limit}`;

    return this.cacheService.get<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>>(
      cacheKey,
      () => {
        // Configura os headers com o token JWT se disponível
        const headers: { [key: string]: string } = {};
        const token = localStorage.getItem('jwt_token');

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }

        return this.http.get<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>>(
          `${this.backendUrl}/ranking/?limit=${limit}`,
          { headers }
        ).pipe(
          catchError(error => {
            console.error('Erro ao buscar ranking global:', error);
            return of([]); // Retorna array vazio em caso de erro
          })
        );
      },
      5 * 60 * 1000 // 5 minutos TTL para ranking do backend
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
}
