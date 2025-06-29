import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, from } from 'rxjs';
import { map, switchMap, catchError } from 'rxjs/operators';
import {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
  PokemonListItem
} from '../../models/pokemon.model';

/**
 * Serviço para comunicação com a PokeAPI
 * Gerencia todas as requisições relacionadas aos dados dos Pokémons
 */
@Injectable({
  providedIn: 'root'
})
export class PokeApiService {
  private readonly baseUrl = 'https://pokeapi.co/api/v2';
  private pokemonCacheSubject = new BehaviorSubject<Map<string, Pokemon>>(new Map());
  private speciesCacheSubject = new BehaviorSubject<Map<string, PokemonSpecies>>(new Map());

  constructor(private http: HttpClient) {}

  /**
   * Busca lista paginada de Pokémons
   * @param limit Limite de resultados por página
   * @param offset Offset para paginação
   * @returns Observable com lista de Pokémons
   */
  getPokemonList(limit: number = 20, offset: number = 0): Observable<PokemonListResponse> {
    const params = new HttpParams()
      .set('limit', limit.toString())
      .set('offset', offset.toString());

    return this.http.get<PokemonListResponse>(`${this.baseUrl}/pokemon`, { params });
  }

  /**
   * Busca detalhes de um Pokémon específico
   * @param identifier ID ou nome do Pokémon
   * @returns Observable com dados do Pokémon
   */
  getPokemon(identifier: string | number): Observable<Pokemon> {
    const key = identifier.toString().toLowerCase();
    const cached = this.pokemonCacheSubject.value.get(key);

    if (cached) {
      return from([cached]);
    }

    return this.http.get<Pokemon>(`${this.baseUrl}/pokemon/${identifier}`).pipe(
      map(pokemon => {
        // Adiciona ao cache
        const cache = this.pokemonCacheSubject.value;
        cache.set(key, pokemon);
        cache.set(pokemon.id.toString(), pokemon);
        this.pokemonCacheSubject.next(cache);
        return pokemon;
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
    return this.http.get<any[]>(`${this.baseUrl}/ranking/global`).pipe(
      catchError(error => {
        console.error('Erro ao buscar ranking global:', error);
        return from([[]]);
      })
    );
  }

  /**
   * Obtém o ranking local de jogadores
   * @param region Região para o ranking local
   * @returns Observable com lista de rankings locais
   */
  getLocalRanking(region: string): Observable<any[]> {
    // Ajuste: usar backend FastAPI
    return this.http.get<any[]>(`http://localhost:8000/api/v1/ranking/local`, {
      params: new HttpParams().set('region', region)
    }).pipe(
      catchError(error => {
        console.error('Erro ao buscar ranking local:', error);
        return from([[]]);
      })
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
   */
  getGlobalRankingFromBackend(limit: number = 10): Observable<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>> {
    // Corrigido para o prefixo correto do backend
    return this.http.get<Array<{ pokemon_id: number; pokemon_name: string; favorite_count: number; }>>(
      'http://localhost:8000/api/v1/ranking/?limit=' + limit
    );
  }

  /**
   * Sincroniza captura/favorito com o backend (usado pelo SyncService)
   * @param action Objeto SyncAction
   * @returns Promise<void>
   */
  async syncCapture(action: { pokemonId: number; action: 'capture' | 'favorite'; timestamp: number; payload?: any }): Promise<void> {
    const url = 'http://localhost:8000/api/v1/sync-capture/';
    try {
      console.log('[SYNC] Enviando ação para backend:', action);
      await this.http.post(url, action).toPromise();
      console.log('[SYNC] Sucesso ao sincronizar com backend');
    } catch (error) {
      console.error('[SYNC] Erro ao sincronizar com backend:', error);
      throw error;
    }
  }
}
