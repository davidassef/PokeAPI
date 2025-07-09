import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, timer } from 'rxjs';
import { catchError, map, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import { SyncConfigService } from './sync-config.service';
import { ErrorHandlerService } from './error-handler.service';

export interface ConnectionStatus {
  isOnline: boolean;
  serverReachable: boolean;
  lastChecked: Date;
  errorCount: number;
}

@Injectable({
  providedIn: 'root'
})
export class ConnectionService {
  private connectionStatusSubject = new BehaviorSubject<ConnectionStatus>({
    isOnline: navigator.onLine,
    serverReachable: false,
    lastChecked: new Date(),
    errorCount: 0
  });

  public connectionStatus$ = this.connectionStatusSubject.asObservable();
  private checkInterval = 30000; // 30 segundos
  private isChecking = false;

  constructor(
    private http: HttpClient,
    private syncConfig: SyncConfigService,
    private errorHandler: ErrorHandlerService
  ) {
    this.initConnectionMonitoring();
  }

  private initConnectionMonitoring(): void {
    // Monitorar mudanças na conexão de internet
    window.addEventListener('online', () => this.updateOnlineStatus(true));
    window.addEventListener('offline', () => this.updateOnlineStatus(false));

    // Verificação periódica da conectividade com o servidor
    this.startPeriodicCheck();
  }

  private updateOnlineStatus(isOnline: boolean): void {
    const current = this.connectionStatusSubject.value;
    this.connectionStatusSubject.next({
      ...current,
      isOnline,
      lastChecked: new Date()
    });

    if (isOnline) {
      this.checkServerConnectivity();
    }
  }

  private startPeriodicCheck(): void {
    timer(0, this.checkInterval).subscribe(() => {
      if (!this.isChecking && navigator.onLine) {
        this.checkServerConnectivity();
      }
    });
  }

  private checkServerConnectivity(): void {
    if (this.isChecking) return;

    this.isChecking = true;
    const serverUrl = this.syncConfig.getClientServerUrl();

    this.http.get(`${serverUrl}/api/client/health`, { observe: 'response' })
      .pipe(
        timeout(3000),
        map(() => true),
        catchError(() => of(false))
      )
      .subscribe(isReachable => {
        this.handleServerResponse(isReachable);
        this.isChecking = false;
      });
  }

  private handleServerResponse(isReachable: boolean): void {
    const current = this.connectionStatusSubject.value;
    const wasReachable = current.serverReachable;
    const newErrorCount = isReachable ? 0 : current.errorCount + 1;

    this.connectionStatusSubject.next({
      ...current,
      serverReachable: isReachable,
      lastChecked: new Date(),
      errorCount: newErrorCount
    });

    // Notificar sobre mudanças na conectividade
    if (wasReachable && !isReachable) {
      this.errorHandler.addConnectionWarning(this.syncConfig.getClientServerUrl());
    }
  }

  /**
   * Força uma verificação imediata da conectividade
   */
  public forceCheck(): void {
    this.checkServerConnectivity();
  }

  /**
   * Obtém o status atual da conexão
   */
  public getCurrentStatus(): ConnectionStatus {
    return this.connectionStatusSubject.value;
  }

  /**
   * Verifica se o servidor está acessível
   */
  public isServerReachable(): boolean {
    return this.connectionStatusSubject.value.serverReachable;
  }

  /**
   * Verifica se está online
   */
  public isOnline(): boolean {
    return this.connectionStatusSubject.value.isOnline;
  }
}
