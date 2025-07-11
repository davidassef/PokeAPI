import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { RbacService, Permission } from './rbac.service';
import { Pokemon } from '../../models/pokemon.model';

/**
 * Interface para dados de criação/atualização de Pokemon
 */
export interface PokemonCreateData {
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string } }>;
  sprites: {
    front_default?: string;
    front_shiny?: string;
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
}

/**
 * Interface para dados de atualização de Pokemon
 */
export interface PokemonUpdateData extends PokemonCreateData {
  id: number;
}

/**
 * Interface para resposta da API
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Serviço para gerenciamento de Pokemon (CRUD operations)
 * Requer permissões de administrador para todas as operações
 */
@Injectable({
  providedIn: 'root'
})
export class PokemonManagementService {
  private readonly apiUrl = 'http://localhost:8000/api'; // URL base da API
  
  constructor(
    private http: HttpClient,
    private authService: AuthService,
    private rbacService: RbacService
  ) {}

  /**
   * Obtém headers HTTP com token de autenticação
   */
  private getAuthHeaders(): HttpHeaders {
    const token = this.authService.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  /**
   * Verifica se o usuário tem permissão para gerenciar Pokemon
   */
  private async checkAdminPermission(): Promise<boolean> {
    return new Promise((resolve) => {
      this.rbacService.hasPermission(Permission.ADD_POKEMON).subscribe(canAdd => {
        this.rbacService.hasPermission(Permission.EDIT_POKEMON).subscribe(canEdit => {
          this.rbacService.hasPermission(Permission.DELETE_POKEMON).subscribe(canDelete => {
            resolve(canAdd || canEdit || canDelete);
          });
        });
      });
    });
  }

  /**
   * Manipula erros HTTP
   */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let errorMessage = 'Erro desconhecido';
    
    if (error.error instanceof ErrorEvent) {
      // Erro do lado do cliente
      errorMessage = `Erro: ${error.error.message}`;
    } else {
      // Erro do lado do servidor
      switch (error.status) {
        case 401:
          errorMessage = 'Não autorizado. Faça login novamente.';
          break;
        case 403:
          errorMessage = 'Acesso negado. Permissões de administrador necessárias.';
          break;
        case 404:
          errorMessage = 'Pokemon não encontrado.';
          break;
        case 409:
          errorMessage = 'Pokemon já existe com este nome.';
          break;
        case 422:
          errorMessage = 'Dados inválidos fornecidos.';
          break;
        case 500:
          errorMessage = 'Erro interno do servidor.';
          break;
        default:
          errorMessage = `Erro ${error.status}: ${error.error?.message || error.message}`;
      }
    }
    
    console.error('PokemonManagementService Error:', error);
    return throwError(errorMessage);
  }

  /**
   * Cria um novo Pokemon
   * Requer permissão ADD_POKEMON
   */
  async createPokemon(pokemonData: PokemonCreateData): Promise<Observable<ApiResponse<Pokemon>>> {
    const hasPermission = await this.checkAdminPermission();
    if (!hasPermission) {
      return throwError('Permissões de administrador necessárias para criar Pokemon');
    }

    const headers = this.getAuthHeaders();
    
    return this.http.post<ApiResponse<Pokemon>>(
      `${this.apiUrl}/pokemon`,
      pokemonData,
      { headers }
    ).pipe(
      map(response => {
        console.log('Pokemon criado com sucesso:', response);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Atualiza um Pokemon existente
   * Requer permissão EDIT_POKEMON
   */
  async updatePokemon(pokemonData: PokemonUpdateData): Promise<Observable<ApiResponse<Pokemon>>> {
    const hasPermission = await this.checkAdminPermission();
    if (!hasPermission) {
      return throwError('Permissões de administrador necessárias para atualizar Pokemon');
    }

    const headers = this.getAuthHeaders();
    
    return this.http.put<ApiResponse<Pokemon>>(
      `${this.apiUrl}/pokemon/${pokemonData.id}`,
      pokemonData,
      { headers }
    ).pipe(
      map(response => {
        console.log('Pokemon atualizado com sucesso:', response);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Exclui um Pokemon
   * Requer permissão DELETE_POKEMON
   */
  async deletePokemon(pokemonId: number): Promise<Observable<ApiResponse<void>>> {
    const hasPermission = await this.checkAdminPermission();
    if (!hasPermission) {
      return throwError('Permissões de administrador necessárias para excluir Pokemon');
    }

    const headers = this.getAuthHeaders();
    
    return this.http.delete<ApiResponse<void>>(
      `${this.apiUrl}/pokemon/${pokemonId}`,
      { headers }
    ).pipe(
      map(response => {
        console.log('Pokemon excluído com sucesso:', response);
        return response;
      }),
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Obtém detalhes de um Pokemon específico
   * Disponível para todos os usuários (não requer autenticação)
   */
  getPokemon(pokemonId: number): Observable<ApiResponse<Pokemon>> {
    return this.http.get<ApiResponse<Pokemon>>(
      `${this.apiUrl}/pokemon/${pokemonId}`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Lista todos os Pokemon com paginação
   * Disponível para todos os usuários (não requer autenticação)
   */
  listPokemon(page: number = 1, limit: number = 20): Observable<ApiResponse<{
    pokemon: Pokemon[];
    total: number;
    page: number;
    totalPages: number;
  }>> {
    return this.http.get<ApiResponse<any>>(
      `${this.apiUrl}/pokemon?page=${page}&limit=${limit}`
    ).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Busca Pokemon por nome ou filtros
   * Disponível para todos os usuários (não requer autenticação)
   */
  searchPokemon(query: string, filters?: any): Observable<ApiResponse<Pokemon[]>> {
    let url = `${this.apiUrl}/pokemon/search?q=${encodeURIComponent(query)}`;
    
    if (filters) {
      const filterParams = new URLSearchParams(filters).toString();
      url += `&${filterParams}`;
    }
    
    return this.http.get<ApiResponse<Pokemon[]>>(url).pipe(
      catchError(this.handleError.bind(this))
    );
  }

  /**
   * Verifica se o usuário atual pode gerenciar Pokemon
   */
  canManagePokemon(): Observable<boolean> {
    return this.rbacService.canManagePokemon();
  }

  /**
   * Obtém informações sobre os endpoints disponíveis
   * Para fins de documentação e debug
   */
  getEndpointsInfo(): {
    public: string[];
    admin: string[];
    description: string;
  } {
    return {
      public: [
        'GET /api/pokemon - Lista todos os Pokemon',
        'GET /api/pokemon/{id} - Obtém detalhes de um Pokemon',
        'GET /api/pokemon/search - Busca Pokemon por nome/filtros'
      ],
      admin: [
        'POST /api/pokemon - Cria novo Pokemon (Admin)',
        'PUT /api/pokemon/{id} - Atualiza Pokemon (Admin)',
        'DELETE /api/pokemon/{id} - Exclui Pokemon (Admin)'
      ],
      description: 'Endpoints públicos são acessíveis a todos. Endpoints admin requerem autenticação e role de administrador.'
    };
  }
}
