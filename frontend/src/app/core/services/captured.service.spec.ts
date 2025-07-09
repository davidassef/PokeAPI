import { TestBed } from '@angular/core/testing';
import { CapturedService } from './captured.service';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';
import { of } from 'rxjs';
import { Pokemon } from '../../models/pokemon.model';
import { Storage } from '@ionic/storage-angular';

describe('CapturedService', () => {
  let service: CapturedService;
  let httpClientSpy: jasmine.SpyObj<HttpClient>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let storageSpy: jasmine.SpyObj<Storage>;

  beforeEach(() => {
    httpClientSpy = jasmine.createSpyObj('HttpClient', ['post', 'get', 'delete']);
    authServiceSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getToken']);
    storageSpy = jasmine.createSpyObj('Storage', ['get', 'set', 'remove', 'clear', 'create']);

    TestBed.configureTestingModule({
      providers: [
        CapturedService,
        { provide: HttpClient, useValue: httpClientSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: Storage, useValue: storageSpy }
      ]
    });
    service = TestBed.inject(CapturedService);
  });

  it('não deve enviar captura se usuário não estiver autenticado', () => {
    authServiceSpy.isAuthenticated.and.returnValue(false);
    const pokemon: Pokemon = { id: 25, name: 'pikachu' } as any;
    service.addToCaptured(pokemon).subscribe();
    expect(httpClientSpy.post).not.toHaveBeenCalled();
  });

  it('deve enviar captura se usuário estiver autenticado', () => {
    authServiceSpy.isAuthenticated.and.returnValue(true);
    httpClientSpy.post.and.returnValue(of({}));
    const pokemon: Pokemon = { id: 25, name: 'pikachu' } as any;
    service.addToCaptured(pokemon).subscribe();
    expect(httpClientSpy.post).toHaveBeenCalledWith(
      jasmine.stringMatching(/favorites\//),
      { pokemon_id: 25, pokemon_name: 'pikachu' }
    );
  });
}); 