import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, firstValueFrom, throwError } from 'rxjs';
import { tap, map, catchError, switchMap } from 'rxjs/operators';
import { FavoritePokemon, Pokemon } from '../../models/pokemon.model';
import { SyncAction, SyncService } from './sync.service';
import { ClientSyncService } from './client-sync.service';
import { SyncConfigService } from './sync-config.service';
import { ErrorHandlerService } from './error-handler.service';
import { ConnectionService } from './connection.service';
import { AuthService } from './auth.service';

/**
 * Serviço para gerenciar Pokémons capturados
 * Utiliza Ionic Storage para persistência local
 */
@Injectable({
  providedIn: 'root'
})
export class CapturedService {
  private capturedSubject = new BehaviorSubject<FavoritePokemon[]>([]);
  public captured$ = this.capturedSubject.asObservable();
  private apiUrl = '/api/v1/favorites';

  constructor(
    private http: HttpClient,
    private syncService: SyncService,
    private clientSyncService: ClientSyncService,
    private syncConfig: SyncConfigService,
    private errorHandler: ErrorHandlerService,
    private connectionService: ConnectionService,
    private authService: AuthService
  ) {}

  /** 
   * Lista capturas do usuário autenticado 
   * @returns Observable com a lista de favoritos ou array vazio em caso de erro
   */
  fetchCaptured(): Observable<FavoritePokemon[]> {
    console.log('[CapturedService] Buscando capturas do usuário');
    
    if (!this.authService.isAuthenticated()) {
      console.warn('[CapturedService] Usuário não autenticado, retornando lista vazia');
      return of([]);
    }
    
    const url = `${this.apiUrl}/my-favorites`;
    console.log(`[CapturedService] Fazendo requisição para: ${url}`);
    
    return this.http.get<FavoritePokemon[]>(url).pipe(
      tap({
        next: (captured) => {
          console.log(`[CapturedService] ${captured.length} capturas carregadas com sucesso`);
          this.capturedSubject.next(captured);
        },
        error: (error) => {
          console.error('[CapturedService] Erro ao buscar capturas:', {
            status: error.status,
            message: error.message,
            url: error.url,
            error: error.error
          });
          
          // Se for erro de autenticação, limpa o estado
          if (error.status === 401 || error.status === 403) {
            console.warn('[CapturedService] Erro de autenticação, limpando estado');
            this.capturedSubject.next([]);
          }
        }
      }),
      catchError(error => {
        console.error('[CapturedService] Erro capturado ao buscar capturas:', error);
        return of([]);
      })
    );
  }

  /**
   * Obtém o estado de captura de múltiplos Pokémons de uma só vez
   * @param pokemonIds Array de IDs dos Pokémons a serem verificados
   * @returns Um objeto onde as chaves são os IDs dos Pokémons e os valores são booleanos indicando se estão capturados
   */
  async getCapturedStates(pokemonIds: number[]): Promise<{ [key: string]: boolean }> {
    if (!pokemonIds || pokemonIds.length === 0) {
      return {};
    }

    try {
      // Verifica se o usuário está autenticado
      if (!this.authService.isAuthenticated()) {
        return {};
      }

      const response = await firstValueFrom(
        this.http.post<{ [key: string]: boolean }>(
          `${this.apiUrl}/check-captured`,
          { pokemon_ids: pokemonIds }
        )
      );

      return response || {};
    } catch (error) {
      console.error('Erro ao verificar estados de captura:', error);
      return {};
    }
  }

  /** Adiciona uma captura */
  addToCaptured(pokemon: Pokemon): Observable<FavoritePokemon> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }
    
    const body = { pokemon_id: pokemon.id, pokemon_name: pokemon.name };
    return this.http.post<FavoritePokemon>(`${this.apiUrl}/`, body).pipe(
      tap(() => this.fetchCaptured().subscribe()),
      catchError(error => {
        console.error('Erro ao adicionar captura:', error);
        throw error;
      })
    );
  }

  /** Remove uma captura */
  removeFromCaptured(pokemonId: number): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }
    
    return this.http.delete<void>(`${this.apiUrl}/${pokemonId}`).pipe(
      tap(() => this.fetchCaptured().subscribe()),
      catchError(error => {
        console.error('Erro ao remover captura:', error);
        throw error;
      })
    );
  }

  /** Limpa todas as capturas do usuário autenticado */
  clearAllCaptured(): Observable<any> {
    // Não há endpoint direto, então remove uma a uma
    return this.fetchCaptured().pipe(
      tap(captured => {
        captured.forEach(cap => {
          this.removeFromCaptured(cap.pokemon_id).subscribe();
        });
      })
    );
  }

  /** Verifica se um Pokémon está capturado */
  isCaptured(pokemonId: number): Observable<boolean> {
    if (!this.authService.isAuthenticated()) {
      return of(false);
    }
    
    return this.http.get<boolean>(`${this.apiUrl}/check/${pokemonId}`).pipe(
      catchError(error => {
        console.error('Erro ao verificar captura:', error);
        return of(false);
      })
    );
  }

  /** Retorna a lista reativa de capturados */
  getCaptured(): Observable<FavoritePokemon[]> {
    return this.captured$;
  }

  /**
   * Alterna o estado de captura de um Pokémon
   * @param pokemon Pokémon a ser capturado/liberado
   * @returns Observable<boolean> - true se foi capturado, false se foi liberado
   */
  toggleCaptured(pokemon: Pokemon): Observable<boolean> {
    console.log(`[CapturedService] Alternando estado de captura para o Pokémon ${pokemon.id} (${pokemon.name})`);
    
    if (!this.authService.isAuthenticated()) {
      const errorMsg = 'Usuário não autenticado';
      console.error(`[CapturedService] ${errorMsg}`);
      return throwError(() => new Error(errorMsg));
    }
    
    return this.isCaptured(pokemon.id).pipe(
      tap(isCaptured => console.log(`[CapturedService] Estado atual de captura: ${isCaptured ? 'capturado' : 'não capturado'}`)),
      switchMap((isCaptured: boolean) => {
        if (isCaptured) {
          console.log(`[CapturedService] Removendo Pokémon ${pokemon.id} dos favoritos`);
          return this.removeFromCaptured(pokemon.id).pipe(
            tap(() => console.log(`[CapturedService] Pokémon ${pokemon.id} removido com sucesso`)),
            map(() => false)
          );
        } else {
          console.log(`[CapturedService] Adicionando Pokémon ${pokemon.id} aos favoritos`);
          return this.addToCaptured(pokemon).pipe(
            tap(() => console.log(`[CapturedService] Pokémon ${pokemon.id} adicionado com sucesso`)),
            map(() => true)
          );
        }
      }),
      catchError((error: any) => {
        console.error('[CapturedService] Erro ao alternar estado de captura:', {
          pokemonId: pokemon.id,
          error: error.error || error.message,
          status: error.status
        });
        return throwError(() => error);
      })
    );
  }

  exportCaptured(): string {
    return JSON.stringify(this.capturedSubject.value, null, 2);
  }

  async importCaptured(jsonData: string): Promise<boolean> {
    try {
      const captured: FavoritePokemon[] = JSON.parse(jsonData);
      const isValid = Array.isArray(captured) &&
        captured.every(c => c.pokemon_id && c.pokemon_name && typeof c.pokemon_id === 'number');
      if (!isValid) throw new Error('Formato de dados inválido');
      await this.capturedSubject.next(captured);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Sincroniza captura baseado na configuração (push ou pull)
   */
  private async syncCapture(pokemonId: number, pokemonName: string, action: string, removed: boolean): Promise<void> {
    try {
      const syncType = this.syncConfig.getSyncType();

      if (this.syncConfig.isDebugMode()) {
        console.log(`[CapturedService] Sincronizando com modo: ${syncType}`);
      }

      // Sistema Pull (prioritário para evitar duplicação)
      if (this.syncConfig.shouldUsePullSync()) {
        await this.sendToClientServer(pokemonId, pokemonName, action, removed);

        if (this.syncConfig.isDebugMode()) {
          console.log('[CapturedService] ✅ Dados enviados via sistema PULL-BASED');
        }

        // Se está em modo estrito, não executa o push
        if (this.syncConfig.isStrictMode()) {
          return;
        }
      }

      // Sistema Push (apenas se não estiver em modo estrito)
      if (this.syncConfig.shouldUsePushSync() && !this.syncConfig.isStrictMode()) {
        const syncAction: SyncAction = {
          pokemonId: pokemonId,
          action: action as 'capture' | 'favorite',
          timestamp: Date.now(),
          payload: {
            pokemonName: pokemonName,
            removed: removed
          }
        };

        await this.syncService.addToQueue(syncAction);

        // Forçar sincronização imediata no sistema push
        setTimeout(() => {
          this.syncService.forceSyncNow();
        }, 1000);

        if (this.syncConfig.isDebugMode()) {
          console.log('[CapturedService] ⚠️  Dados enviados via sistema PUSH:', syncAction);
        }
      }

    } catch (error) {
      console.error('[CapturedService] Erro na sincronização:', error);
    }
  }

  /**
   * Envia captura para o servidor do cliente (sistema pull)
   */
  private async sendToClientServer(pokemonId: number, pokemonName: string, action: string, removed: boolean): Promise<void> {
    // Verificar se o servidor está acessível antes de tentar
    if (!this.connectionService.isServerReachable()) {
      if (this.syncConfig.isDebugMode()) {
        console.warn('[CapturedService] ⚠️ Servidor não está acessível, pulando sincronização');
      }
      return;
    }

    try {
      const clientServerUrl = this.syncConfig.getClientServerUrl();

      // Timeout mais curto para evitar demora excessiva
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Timeout')), 3000);
      });

      const requestPromise = this.http.post(`${clientServerUrl}/api/client/add-capture`, {
        pokemon_id: pokemonId,
        pokemon_name: pokemonName,
        action: action,
        removed: removed
      }).toPromise();

      await Promise.race([requestPromise, timeoutPromise]);

      if (this.syncConfig.isDebugMode()) {
        console.log(`[CapturedService] 📡 Captura enviada para ${clientServerUrl} (pull-based)`);
      }
    } catch (error) {
      if (this.syncConfig.isDebugMode()) {
        console.warn('[CapturedService] ⚠️ Erro na sincronização, será tentado novamente');
      }

      // Força uma verificação da conectividade
      this.connectionService.forceCheck();

      // Não gerar erro crítico - apenas log de aviso
      // O Pokemon já foi salvo localmente, então a funcionalidade continua
    }
  }
}
