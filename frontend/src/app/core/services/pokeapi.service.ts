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
}
