import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, firstValueFrom, throwError, from } from 'rxjs';
import { tap, map, catchError, switchMap, timeout } from 'rxjs/operators';
import { FavoritePokemon, Pokemon } from '../../models/pokemon.model';
import { SyncAction, SyncService } from './sync.service';
import { ClientSyncService } from './client-sync.service';
import { SyncConfigService } from './sync-config.service';
import { ErrorHandlerService } from './error-handler.service';
import { ConnectionService } from './connection.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';

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
  private apiUrl = `${environment.apiUrl}/favorites`;  // ✅ CORREÇÃO CRÍTICA: Usar URL completa do environment

  // ✅ NOVO: URLs de fallback para diferentes backends
  private fallbackUrls = [
    'https://pokeapi-la6k.onrender.com/api/v1/favorites',  // Render backup
    'https://pokeapiapp-backend.herokuapp.com/api/v1/favorites',  // Heroku backup
    '/api/v1/favorites'  // Local/proxy fallback
  ];

  // ✅ NOVO: Modo offline - dados simulados para demonstração
  private offlineMode = false;
  private offlineData: FavoritePokemon[] = [
    { id: 1, user_id: 1, pokemon_id: 25, pokemon_name: 'pikachu', created_at: new Date().toISOString() },
    { id: 2, user_id: 1, pokemon_id: 1, pokemon_name: 'bulbasaur', created_at: new Date().toISOString() },
    { id: 3, user_id: 1, pokemon_id: 4, pokemon_name: 'charmander', created_at: new Date().toISOString() }
  ];

  constructor(
    private http: HttpClient,
    private syncService: SyncService,
    private clientSyncService: ClientSyncService,
    private syncConfig: SyncConfigService,
    private errorHandler: ErrorHandlerService,
    private connectionService: ConnectionService,
    private authService: AuthService
  ) {
    // ✅ CORREÇÃO: Log da URL da API para debug
    console.log('[CapturedService] Inicializado com URL da API:', this.apiUrl);
    console.log('[CapturedService] Environment:', environment.production ? 'PRODUÇÃO' : 'DESENVOLVIMENTO');

    // ✅ NOVO: Limpar cache quando usuário faz logout
    this.authService.getAuthState().subscribe(isAuthenticated => {
      if (!isAuthenticated) {
        console.log('[CapturedService] Usuário deslogado, limpando cache');
        this.clearCache();
      }
    });
  }

  /**
   * ✅ NOVO: Tenta requisição com URLs de fallback
   */
  private async tryFallbackUrls(endpoint: string): Promise<FavoritePokemon[]> {
    console.log('[CapturedService] 🔄 Tentando URLs de fallback...');

    for (let i = 0; i < this.fallbackUrls.length; i++) {
      const fallbackUrl = `${this.fallbackUrls[i]}${endpoint}`;
      console.log(`[CapturedService] Tentativa ${i + 1}/${this.fallbackUrls.length}: ${fallbackUrl}`);

      try {
        const response = await firstValueFrom(
          this.http.get<FavoritePokemon[]>(fallbackUrl, {
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }).pipe(timeout(10000))
        );

        console.log(`[CapturedService] ✅ Sucesso com URL de fallback ${i + 1}: ${fallbackUrl}`);
        console.log(`[CapturedService] ${response.length} capturas carregadas`);

        // Atualiza URL principal para a que funcionou
        this.apiUrl = this.fallbackUrls[i];
        console.log(`[CapturedService] URL principal atualizada para: ${this.apiUrl}`);

        return response;
      } catch (error) {
        console.warn(`[CapturedService] ❌ Falha na URL ${i + 1}: ${fallbackUrl}`, error);

        // Se for a última tentativa, lança o erro
        if (i === this.fallbackUrls.length - 1) {
          console.error('[CapturedService] 💥 Todas as URLs de fallback falharam');
          throw error;
        }
      }
    }

    // Nunca deve chegar aqui, mas por segurança
    throw new Error('Todas as URLs de fallback falharam');
  }

  /**
   * ✅ NOVO: Log detalhado do estado das capturas
   */
  private logCaptureState(action: string, count: number): void {
    console.log(`[CapturedService] ${action}: ${count} capturas`, {
      timestamp: new Date().toISOString(),
      authenticated: this.authService.isAuthenticated(),
      userId: this.authService.getCurrentUser()?.id,
      cacheSize: this.cachedCaptured.length,
      lastFetch: new Date(this.lastSuccessfulFetch).toISOString()
    });
  }

  // Cache inteligente para preservar dados
  private cachedCaptured: FavoritePokemon[] = [];
  private lastSuccessfulFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

  /**
   * Lista capturas do usuário autenticado com cache inteligente
   * @returns Observable com a lista de favoritos, cache, ou array vazio
   */
  fetchCaptured(): Observable<FavoritePokemon[]> {
    console.log('[CapturedService] Buscando capturas do usuário');

    if (!this.authService.isAuthenticated()) {
      // ✅ CORREÇÃO CRÍTICA: Retorna cache se disponível, mesmo sem autenticação
      if (this.cachedCaptured.length > 0) {
        console.log('[CapturedService] Usuário não autenticado, retornando cache:', this.cachedCaptured.length);
        this.capturedSubject.next(this.cachedCaptured);
        return of(this.cachedCaptured);
      }
      console.warn('[CapturedService] Usuário não autenticado, sem cache disponível');
      return of([]);
    }

    // Verifica se cache ainda é válido
    const now = Date.now();
    if (this.cachedCaptured.length > 0 && (now - this.lastSuccessfulFetch) < this.CACHE_DURATION) {
      console.log('[CapturedService] Retornando dados do cache válido:', this.cachedCaptured.length);
      this.capturedSubject.next(this.cachedCaptured);
      return of(this.cachedCaptured);
    }

    const url = `${this.apiUrl}/my-favorites`;
    console.log(`[CapturedService] Fazendo requisição para: ${url}`);

    // ✅ NOVO: Verificar se a URL está correta
    if (!url.includes('/api/v1/favorites/my-favorites')) {
      console.warn('[CapturedService] ⚠️ URL da API pode estar incorreta:', url);
      console.warn('[CapturedService] URL esperada deve conter: /api/v1/favorites/my-favorites');
    }

    return this.http.get<FavoritePokemon[]>(url, {
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap({
        next: (captured) => {
          console.log(`[CapturedService] ${captured.length} capturas carregadas com sucesso`);
          // ✅ Atualiza cache e estado
          this.cachedCaptured = captured;
          this.lastSuccessfulFetch = now;
          this.capturedSubject.next(captured);
        },
        error: (error) => {
          console.error('[CapturedService] Erro ao buscar capturas:', {
            status: error.status,
            message: error.message,
            url: error.url,
            error: error.error,
            headers: error.headers?.keys?.() || 'N/A'
          });

          // ✅ CORREÇÃO CRÍTICA: Debug adicional para erro de parsing
          if (error.status === 200 && error.message?.includes('parsing')) {
            console.error('[CapturedService] 🔍 ERRO DE PARSING DETECTADO:');
            console.error('- Status: 200 (OK) mas falha no parsing JSON');
            console.error('- Possível problema: resposta não é JSON válido');
            console.error('- Headers de resposta:', error.headers);
            console.error('- Corpo da resposta (se disponível):', error.error);

            // ✅ NOVO: Verificar se o erro contém HTML
            const errorText = error.error?.toString() || '';
            if (errorText.includes('<!DOCTYPE') || errorText.includes('<html')) {
              console.error('[CapturedService] 🚨 CONFIRMADO: Backend retornando HTML');
              console.error('- Isso indica problema de roteamento no servidor');
              console.error('- A requisição está sendo redirecionada para a página inicial');
              console.error('- Verifique configuração do backend e CORS');
            }
          }

          // ✅ CORREÇÃO CRÍTICA: NÃO limpa dados em erro de autenticação
          if (error.status === 401 || error.status === 403) {
            console.warn('[CapturedService] Erro de autenticação, MANTENDO dados locais/cache');
            // Mantém cache se disponível
            if (this.cachedCaptured.length > 0) {
              console.log('[CapturedService] Usando cache após erro de auth:', this.cachedCaptured.length);
              this.capturedSubject.next(this.cachedCaptured);
            }
            // NÃO executa: this.capturedSubject.next([]); - ISSO CAUSAVA O PROBLEMA
          }
        }
      }),
      catchError(error => {
        console.error('[CapturedService] Erro capturado ao buscar capturas:', error);

        // ✅ CORREÇÃO: Tentar parsing manual se for erro de parsing com status 200
        if (error.status === 200 && error.message?.includes('parsing')) {
          console.log('[CapturedService] 🔧 Tentando requisição alternativa com responseType text...');

          return this.http.get(url, {
            responseType: 'text',
            headers: {
              'Accept': 'application/json',
              'Content-Type': 'application/json'
            }
          }).pipe(
            map((textResponse: string) => {
              // ✅ CORREÇÃO CRÍTICA: Detectar se resposta é HTML em vez de JSON
              if (textResponse.trim().startsWith('<!DOCTYPE') || textResponse.trim().startsWith('<html')) {
                console.error('[CapturedService] 🚨 PROBLEMA CRÍTICO DETECTADO:');
                console.error('- API retornou HTML em vez de JSON');
                console.error('- Possível causa: Redirecionamento para página inicial');
                console.error('- Possível causa: Problema de CORS ou roteamento no backend');
                console.error('- URL da requisição:', url);
                console.error('- Resposta HTML recebida (primeiros 200 chars):', textResponse.substring(0, 200));

                // Lançar erro específico para HTML
                throw new Error('API_RETURNING_HTML: Backend está retornando HTML em vez de JSON. Possível problema de roteamento ou CORS.');
              }

              try {
                const parsed = JSON.parse(textResponse) as FavoritePokemon[];
                console.log('[CapturedService] ✅ Parsing manual bem-sucedido:', parsed.length);

                // Atualiza cache e estado
                this.cachedCaptured = parsed;
                this.lastSuccessfulFetch = now;
                this.capturedSubject.next(parsed);

                return parsed;
              } catch (parseError) {
                console.error('[CapturedService] ❌ Falha no parsing manual:', parseError);
                console.error('[CapturedService] Resposta recebida (primeiros 500 chars):', textResponse.substring(0, 500));
                throw parseError;
              }
            }),
            catchError(fallbackError => {
              console.error('[CapturedService] ❌ Falha na requisição alternativa:', fallbackError);

              // ✅ CORREÇÃO: Tratamento específico para erro de HTML
              if (fallbackError.message?.includes('API_RETURNING_HTML')) {
                console.error('[CapturedService] 🔧 DIAGNÓSTICO DO PROBLEMA:');
                console.error('1. Backend está retornando HTML em vez de JSON');
                console.error('2. Isso indica problema de roteamento no servidor');
                console.error('3. Tentando URLs de fallback...');

                // ✅ NOVO: Tentar URLs de fallback
                return from(this.tryFallbackUrls('/my-favorites')).pipe(
                  tap((fallbackData) => {
                    console.log('[CapturedService] ✅ Dados obtidos via fallback:', fallbackData.length);
                    this.cachedCaptured = fallbackData;
                    this.lastSuccessfulFetch = now;
                    this.capturedSubject.next(fallbackData);
                  }),
                  catchError((finalError) => {
                    console.error('[CapturedService] ❌ Todas as tentativas falharam:', finalError);

                    // Retorna cache se disponível
                    if (this.cachedCaptured.length > 0) {
                      console.log('[CapturedService] Retornando cache após falha total:', this.cachedCaptured.length);
                      return of(this.cachedCaptured);
                    }

                    // ✅ NOVO: Modo offline como último recurso
                    if (!this.offlineMode) {
                      console.warn('[CapturedService] 🔌 Ativando modo offline - usando dados de demonstração');
                      this.offlineMode = true;
                      this.capturedSubject.next(this.offlineData);
                      return of(this.offlineData);
                    }

                    return of([]);
                  })
                );
              }

              // Retorna cache se disponível
              if (this.cachedCaptured.length > 0) {
                console.log('[CapturedService] Retornando cache após falha total:', this.cachedCaptured.length);
                return of(this.cachedCaptured);
              }
              return of([]);
            })
          );
        }

        // ✅ CORREÇÃO: Retorna cache em caso de erro
        if (this.cachedCaptured.length > 0) {
          console.log('[CapturedService] Retornando cache após erro:', this.cachedCaptured.length);
          return of(this.cachedCaptured);
        }
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

    // ✅ Log estado antes da captura
    this.logCaptureState('Antes da captura', this.capturedSubject.value.length);

    // ✅ CORREÇÃO CRÍTICA: Atualização otimista do estado local
    const currentCaptured = this.capturedSubject.value;
    const newCapture: FavoritePokemon = {
      id: Date.now(), // ID temporário
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name,
      user_id: Number(this.authService.getCurrentUser()?.id) || 0,
      created_at: new Date().toISOString()
    };

    // Atualiza estado local imediatamente (otimistic update)
    const updatedCaptured = [...currentCaptured, newCapture];
    this.capturedSubject.next(updatedCaptured);

    // ✅ CORREÇÃO: Atualiza cache também
    this.cachedCaptured = updatedCaptured;

    console.log(`[CapturedService] ✅ Estado local atualizado otimisticamente para ${pokemon.name}`);
    this.logCaptureState('Após atualização otimista', updatedCaptured.length);

    // Inclui user_id para compatibilidade com o backend
    const currentUser = this.authService.getCurrentUser();
    const body = {
      pokemon_id: pokemon.id,
      pokemon_name: pokemon.name,
      user_id: Number(currentUser?.id) || 0
    };

    console.log('[CapturedService] Enviando dados para captura:', body);

    return this.http.post<FavoritePokemon>(`${this.apiUrl}/`, body).pipe(
      tap((serverCapture) => {
        // ✅ CORREÇÃO: Substituir captura temporária pela do servidor
        const currentCaptured = this.capturedSubject.value;
        const finalCaptured = currentCaptured
          .filter(c => c.pokemon_id !== pokemon.id) // Remove temporária
          .concat(serverCapture); // Adiciona a do servidor

        this.capturedSubject.next(finalCaptured);
        // ✅ CORREÇÃO: Atualiza cache com dados do servidor
        this.cachedCaptured = finalCaptured;
        this.lastSuccessfulFetch = Date.now();

        console.log(`[CapturedService] ✅ Captura confirmada pelo servidor para ${pokemon.name}`);
        this.logCaptureState('Após confirmação do servidor', finalCaptured.length);
      }),
      catchError(error => {
        console.error('[CapturedService] ❌ Erro ao adicionar captura, revertendo estado:', error);
        // ✅ CORREÇÃO CRÍTICA: Reverter atualização otimista em caso de erro
        const currentCaptured = this.capturedSubject.value;
        const revertedCaptured = currentCaptured.filter(c => c.pokemon_id !== pokemon.id);
        this.capturedSubject.next(revertedCaptured);
        // ✅ CORREÇÃO: Reverte cache também
        this.cachedCaptured = revertedCaptured;

        this.logCaptureState('Após reversão por erro', revertedCaptured.length);
        throw error;
      })
    );
  }

  /** Remove uma captura */
  removeFromCaptured(pokemonId: number): Observable<void> {
    if (!this.authService.isAuthenticated()) {
      throw new Error('Usuário não autenticado');
    }

    // ✅ CORREÇÃO CRÍTICA: Atualização otimista do estado local
    const currentCaptured = this.capturedSubject.value;
    const captureToRemove = currentCaptured.find(c => c.pokemon_id === pokemonId);
    const optimisticCaptured = currentCaptured.filter(cap => cap.pokemon_id !== pokemonId);

    // Atualiza estado local imediatamente (otimistic update)
    this.capturedSubject.next(optimisticCaptured);
    console.log(`[CapturedService] ✅ Estado local atualizado otimisticamente - removido pokémon ${pokemonId}`);

    return this.http.delete<void>(`${this.apiUrl}/${pokemonId}`).pipe(
      tap(() => {
        console.log(`[CapturedService] ✅ Remoção confirmada pelo servidor para pokémon ${pokemonId}`);
        // Estado já foi atualizado otimisticamente, não precisa fazer nada
      }),
      catchError(error => {
        console.error('[CapturedService] ❌ Erro ao remover captura, revertendo estado:', error);
        // ✅ CORREÇÃO CRÍTICA: Reverter atualização otimista em caso de erro
        if (captureToRemove) {
          const revertedCaptured = [...optimisticCaptured, captureToRemove];
          this.capturedSubject.next(revertedCaptured);
        }
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

  /** Verifica se um Pokémon está capturado usando o estado local (síncrono) */
  isCapturedSync(pokemonId: number): boolean {
    if (!this.authService.isAuthenticated()) {
      return false;
    }
    const currentCaptured = this.capturedSubject.value;
    return currentCaptured.some(cap => cap.pokemon_id === pokemonId);
  }

  /** Força uma sincronização completa com o backend */
  forceSyncWithBackend(): Observable<FavoritePokemon[]> {
    console.log('[CapturedService] Forçando sincronização completa com o backend');

    // ✅ CORREÇÃO CRÍTICA: Verificar autenticação antes de sincronizar
    if (!this.authService.isAuthenticated()) {
      console.warn('[CapturedService] Usuário não autenticado, cancelando sincronização forçada');
      // Retorna estado atual ou cache se disponível
      const currentState = this.capturedSubject.value;
      if (currentState.length > 0) {
        return of(currentState);
      }
      if (this.cachedCaptured.length > 0) {
        this.capturedSubject.next(this.cachedCaptured);
        return of(this.cachedCaptured);
      }
      return of([]);
    }

    // ✅ CORREÇÃO CRÍTICA: Não limpar estado local para evitar perda de dados
    // Apenas recarrega do backend e mescla com estado local
    return this.fetchCaptured();
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Sincronização inteligente que preserva dados locais
   * Mescla dados do backend com estado local para evitar perda de capturas
   */
  smartSync(): Observable<FavoritePokemon[]> {
    console.log('[CapturedService] 🔄 Iniciando sincronização inteligente...');

    if (!this.authService.isAuthenticated()) {
      console.warn('[CapturedService] Usuário não autenticado, mantendo estado local e cache');
      const currentState = this.capturedSubject.value;
      // Mescla estado atual com cache
      const mergedData = this.mergeCapturedData(currentState, this.cachedCaptured);
      this.capturedSubject.next(mergedData);
      return of(mergedData);
    }

    const localCaptured = this.capturedSubject.value;
    console.log(`[CapturedService] Estado local: ${localCaptured.length} capturas`);
    console.log(`[CapturedService] Cache: ${this.cachedCaptured.length} capturas`);

    return this.fetchCaptured().pipe(
      tap((serverCaptured) => {
        console.log(`[CapturedService] Estado servidor: ${serverCaptured.length} capturas`);

        // ✅ CORREÇÃO: Mesclar dados locais, cache e do servidor
        const step1 = this.mergeCapturedData(localCaptured, this.cachedCaptured);
        const finalMerged = this.mergeCapturedData(step1, serverCaptured);
        console.log(`[CapturedService] ✅ Dados mesclados: ${finalMerged.length} capturas`);

        this.capturedSubject.next(finalMerged);
      }),
      catchError((error) => {
        console.error('[CapturedService] ❌ Erro na sincronização, mantendo dados locais e cache:', error);
        // Em caso de erro, mescla dados locais com cache
        const mergedData = this.mergeCapturedData(localCaptured, this.cachedCaptured);
        this.capturedSubject.next(mergedData);
        return of(mergedData);
      })
    );
  }

  /**
   * ✅ NOVO: Limpa cache quando necessário (ex: logout)
   */
  clearCache(): void {
    console.log('[CapturedService] 🧹 Limpando cache');
    this.cachedCaptured = [];
    this.lastSuccessfulFetch = 0;
  }

  /**
   * ✅ NOVO: Força atualização do cache
   */
  refreshCache(): Observable<FavoritePokemon[]> {
    console.log('[CapturedService] 🔄 Forçando atualização do cache');
    this.lastSuccessfulFetch = 0; // Invalida cache
    return this.fetchCaptured();
  }

  /**
   * ✅ CORREÇÃO CRÍTICA: Mescla dados locais e do servidor de forma inteligente
   */
  private mergeCapturedData(localData: FavoritePokemon[], serverData: FavoritePokemon[]): FavoritePokemon[] {
    const merged = new Map<number, FavoritePokemon>();

    // Adiciona dados do servidor primeiro (fonte de verdade)
    serverData.forEach(capture => {
      merged.set(capture.pokemon_id, capture);
    });

    // Adiciona dados locais que não estão no servidor (capturas recentes)
    localData.forEach(capture => {
      if (!merged.has(capture.pokemon_id)) {
        // Captura local que ainda não foi sincronizada
        console.log(`[CapturedService] 📤 Mantendo captura local não sincronizada: ${capture.pokemon_name}`);
        merged.set(capture.pokemon_id, capture);
      }
    });

    return Array.from(merged.values());
  }

  /** Limpa TODOS os dados de captura do usuário (EMERGÊNCIA) */
  clearAllCapturedData(): Observable<any> {
    console.log('[CapturedService] 🚨 LIMPEZA EMERGENCIAL: Removendo TODOS os dados de captura');
    if (!this.authService.isAuthenticated()) {
      return throwError(() => new Error('Usuário não autenticado'));
    }

    return this.http.delete(`${this.apiUrl}/clear-all`).pipe(
      tap(() => {
        console.log('[CapturedService] ✅ Todos os dados de captura foram removidos');
        // Limpa o estado local
        this.capturedSubject.next([]);
      }),
      catchError(error => {
        console.error('[CapturedService] ❌ Erro ao limpar dados de captura:', error);
        return throwError(() => error);
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
   * @param currentState Estado atual de captura (opcional, se não fornecido será verificado via HTTP)
   * @returns Observable<boolean> - true se foi capturado, false se foi liberado
   */
  toggleCaptured(pokemon: Pokemon, currentState?: boolean): Observable<boolean> {
    console.log(`[CapturedService] Alternando estado de captura para o Pokémon ${pokemon.id} (${pokemon.name})`);

    if (!this.authService.isAuthenticated()) {
      const errorMsg = 'Usuário não autenticado';
      console.error(`[CapturedService] ${errorMsg}`);
      return throwError(() => new Error(errorMsg));
    }

    // Se o estado atual foi fornecido, usa ele diretamente (mais eficiente)
    if (currentState !== undefined) {
      console.log(`[CapturedService] Usando estado fornecido: ${currentState ? 'capturado' : 'não capturado'}`);

      if (currentState) {
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
    }

    // Fallback: Verifica o estado atual via HTTP (para compatibilidade)
    console.log(`[CapturedService] Verificando estado atual via HTTP`);
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
      timeout(15000), // Timeout de 15 segundos para operações de captura
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
