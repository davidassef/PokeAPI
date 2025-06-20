import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import {
  Pokemon,
  PokemonListResponse,
  PokemonSpecies,
} from '../models/pokemon.model';
import { EvolutionChain } from '../models/evolution.model';
import { API_URLS, PAGINATION } from '../constants/app.constants';

@Injectable({
  providedIn: 'root',
})
export class PokemonApiService {
  private readonly baseUrl = API_URLS.BASE_URL;
  private readonly itemsPerPage = PAGINATION.ITEMS_PER_PAGE;

  constructor(private http: HttpClient) {}

  /**
   * Busca lista paginada de Pokémons
   */
  getPokemonList(
    offset: number = 0,
    limit: number = this.itemsPerPage,
  ): Observable<PokemonListResponse> {
    const url = `${this.baseUrl}/pokemon?offset=${offset}&limit=${limit}`;

    return this.http.get<PokemonListResponse>(url).pipe(
      catchError(this.handleError),
    );
  }

  /**
   * Busca detalhes completos de um Pokémon pelo ID
   */
  getPokemonDetails(id: number): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${id}`;

    return this.http.get<Pokemon>(url).pipe(
      catchError(this.handleError),
    );
  }

  /**
   * Busca detalhes do Pokémon por URL completa
   */
  getPokemonDetailsByUrl(url: string): Observable<Pokemon> {
    return this.http.get<Pokemon>(url).pipe(
      catchError(this.handleError),
    );
  }

  /**
   * Busca informações da espécie do Pokémon (para descrições)
   */
  getPokemonSpecies(id: number): Observable<PokemonSpecies> {
    const url = `${this.baseUrl}/pokemon-species/${id}`;

    return this.http.get<PokemonSpecies>(url).pipe(
      catchError(this.handleError),
    );
  }

  /**
   * Busca Pokémon pelo nome
   */
  searchPokemonByName(name: string): Observable<Pokemon> {
    const url = `${this.baseUrl}/pokemon/${name.toLowerCase()}`;

    return this.http.get<Pokemon>(url).pipe(
      catchError(this.handleError),
    );
  }

  /**
   * Extrai ID do Pokémon a partir da URL
   */
  extractPokemonId(url: string): number {
    const matches = url.match(/\/pokemon\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  /**
   * Constrói URL da imagem oficial do Pokémon
   */
  getPokemonImageUrl(id: number): string {
    return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
  }

  /**
   * Formata nome do Pokémon (primeira letra maiúscula)
   */
  formatPokemonName(name: string): string {
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  /**
   * Busca a cadeia evolutiva de um Pokémon
   */
  getEvolutionChain(chainUrl: string): Observable<EvolutionChain> {
    return this.http.get<EvolutionChain>(chainUrl).pipe(
      catchError(this.handleError),
    );
  }

  /**
   * Trata erros das requisições HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro desconhecido';

    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      switch (error.status) {
        case 404:
          errorMessage = 'Pokémon não encontrado';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor';
          break;
        case 0:
          errorMessage = 'Erro de conexão com a internet';
          break;
        default:
          errorMessage = `Erro ${error.status}: ${error.message}`;
      }
    }

    console.error('Erro na API:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
