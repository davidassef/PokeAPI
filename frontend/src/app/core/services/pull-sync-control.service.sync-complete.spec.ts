import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PullSyncControlService } from './pull-sync-control.service';
import { SyncConfigService } from './sync-config.service';

describe('PullSyncControlService - Sync Complete', () => {
  let service: PullSyncControlService;
  let httpMock: HttpTestingController;
  let syncConfigService: SyncConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PullSyncControlService, SyncConfigService]
    });

    service = TestBed.inject(PullSyncControlService);
    httpMock = TestBed.inject(HttpTestingController);
    syncConfigService = TestBed.inject(SyncConfigService);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should call sync complete endpoint', () => {
    const mockResponse = {
      success: true,
      clients_consulted: 1,
      total_captured_in_clients: 5,
      total_in_database: 3,
      added_to_database: 2,
      removed_from_database: 0,
      processing_time: 1.5
    };

    service.forceSyncCompleteWithVerification().subscribe(response => {
      expect(response).toEqual(mockResponse);
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/pull-sync/sync-complete-state');
    expect(req.request.method).toBe('POST');
    req.flush(mockResponse);
  });

  it('should handle sync complete endpoint errors', () => {
    const errorMessage = 'Erro na sincronização';

    service.forceSyncCompleteWithVerification().subscribe({
      next: () => fail('Should have failed'),
      error: (error) => {
        expect(error.status).toBe(500);
      }
    });

    const req = httpMock.expectOne('http://localhost:8000/api/v1/pull-sync/sync-complete-state');
    req.flush(errorMessage, { status: 500, statusText: 'Internal Server Error' });
  });
});
