import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent, HttpResponse } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { ClientSyncService } from '../services/client-sync.service';

/**
 * Interceptor para simular endpoints do cliente que o backend irá acessar
 * Usado no sistema pull-based de sincronização
 */
@Injectable()
export class ClientApiInterceptor implements HttpInterceptor {

  constructor(private clientSyncService: ClientSyncService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Verificar se é uma requisição para os endpoints do cliente
    const url = req.url;

    // Health check endpoint
    if (url.includes('/api/client/health') && req.method === 'GET') {
      return this.handleHealthCheck();
    }

    // Sync data endpoint
    if (url.includes('/api/client/sync-data') && req.method === 'GET') {
      return this.handleSyncData(req);
    }

    // Acknowledge endpoint
    if (url.includes('/api/client/acknowledge') && req.method === 'POST') {
      return this.handleAcknowledge(req);
    }

    // Stats endpoint
    if (url.includes('/api/client/stats') && req.method === 'GET') {
      return this.handleStats();
    }

    // Passar requisição adiante se não for para endpoints do cliente
    return next.handle(req);
  }

  private handleHealthCheck(): Observable<HttpEvent<any>> {
    const response = this.clientSyncService.getHealthStatus();
    return of(new HttpResponse({
      status: 200,
      body: response
    }));
  }

  private handleSyncData(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const since = req.params.get('since');

    return new Observable(observer => {
      this.clientSyncService.getSyncData(since || undefined).then((data: any) => {
        observer.next(new HttpResponse({
          status: 200,
          body: data
        }));
        observer.complete();
      }).catch((error: any) => {
        observer.error(error);
      });
    });
  }

  private handleAcknowledge(req: HttpRequest<any>): Observable<HttpEvent<any>> {
    const captureIds = req.body?.capture_ids || [];

    return new Observable(observer => {
      this.clientSyncService.acknowledgeSyncedCaptures(captureIds).then(() => {
        observer.next(new HttpResponse({
          status: 200,
          body: {
            message: 'Captures acknowledged successfully',
            count: captureIds.length
          }
        }));
        observer.complete();
      }).catch((error: any) => {
        observer.error(error);
      });
    });
  }

  private handleStats(): Observable<HttpEvent<any>> {
    return new Observable(observer => {
      this.clientSyncService.getSyncStats().then((stats: any) => {
        observer.next(new HttpResponse({
          status: 200,
          body: stats
        }));
        observer.complete();
      }).catch((error: any) => {
        observer.error(error);
      });
    });
  }
}
