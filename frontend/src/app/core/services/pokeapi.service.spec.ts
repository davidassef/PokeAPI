import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PokeApiService } from './pokeapi.service';

const mockRanking = [
  { pokemon_id: 1, pokemon_name: 'bulbasaur', favorite_count: 5 },
  { pokemon_id: 4, pokemon_name: 'charmander', favorite_count: 3 }
];

describe('PokeApiService', () => {
  let service: PokeApiService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [PokeApiService]
    });
    service = TestBed.inject(PokeApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('deve buscar o ranking global do backend', (done) => {
    service.getGlobalRankingFromBackend(2).subscribe(data => {
      expect(data).toEqual(mockRanking);
      done();
    });
    const req = httpMock.expectOne('http://localhost:8000/api/v1/ranking/?limit=2');
    expect(req.request.method).toBe('GET');
    req.flush(mockRanking);
  });

  it('deve tratar erro ao buscar ranking global', (done) => {
    service.getGlobalRankingFromBackend(2).subscribe({
      next: () => {},
      error: (err) => {
        expect(err.status).toBe(500);
        done();
      }
    });
    const req = httpMock.expectOne('http://localhost:8000/api/v1/ranking/?limit=2');
    req.flush('Erro interno', { status: 500, statusText: 'Server Error' });
  });

  it('deve buscar o ranking local corretamente', (done) => {
    const mockLocalRanking = [
      { player: 'Ash', score: 10 },
      { player: 'Misty', score: 8 }
    ];
    service.getLocalRanking('kanto').subscribe(data => {
      expect(data).toEqual(mockLocalRanking);
      done();
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/ranking/local'));
    expect(req.request.method).toBe('GET');
    expect(req.request.params.get('region')).toBe('kanto');
    req.flush(mockLocalRanking);
  });

  it('deve retornar lista vazia em caso de erro ao buscar ranking local', (done) => {
    service.getLocalRanking('johto').subscribe(data => {
      expect(data).toEqual([]);
      done();
    });
    const req = httpMock.expectOne(r => r.url.includes('/api/v1/ranking/local'));
    req.error(new ErrorEvent('Network error'));
  });
});
