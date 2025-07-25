import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule, LoadingController, ToastController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ChangeDetectorRef } from '@angular/core';
import { of, throwError } from 'rxjs';

import { RankingPage } from './ranking.page';
import { PokeApiService } from 'src/app/core/services/poke-api.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CapturedService } from 'src/app/core/services/captured.service';
import { SyncService } from 'src/app/core/services/sync.service';
import { PokemonRanking, Pokemon, BackendRankingItem } from 'src/app/models/pokemon.model';

describe('RankingPage (Mobile)', () => {
  let component: RankingPage;
  let fixture: ComponentFixture<RankingPage>;
  let pokeApiService: jasmine.SpyObj<PokeApiService>;
  let authService: jasmine.SpyObj<AuthService>;
  let capturedService: jasmine.SpyObj<CapturedService>;
  let syncService: jasmine.SpyObj<SyncService>;
  let loadingController: jasmine.SpyObj<LoadingController>;
  let toastController: jasmine.SpyObj<ToastController>;
  let translateService: jasmine.SpyObj<TranslateService>;
  let cdr: jasmine.SpyObj<ChangeDetectorRef>;

  // Mock data
  const mockPokemon: Pokemon = {
    id: 1,
    name: 'bulbasaur',
    types: [{ type: { name: 'grass', url: '' }, slot: 1 }],
    sprites: {
      front_default: 'test-image.png',
      front_shiny: 'test-shiny.png',
      back_default: 'test-back.png',
      back_shiny: 'test-back-shiny.png',
      other: {
        'official-artwork': { front_default: 'test-artwork.png' },
        home: { front_default: 'test-home.png', front_shiny: 'test-home-shiny.png' }
      }
    },
    height: 7,
    weight: 69,
    base_experience: 64,
    order: 1,
    abilities: [],
    stats: [],
    moves: [],
    species: { name: 'bulbasaur', url: '' }
  };

  const mockBackendRankingItem: BackendRankingItem = {
    pokemon_id: 1,
    favorite_count: 100,
    trend: 'up'
  };

  const mockPokemonRanking: PokemonRanking = {
    pokemon: mockPokemon,
    favoriteCount: 100,
    rank: 1,
    trend: 'up'
  };

  beforeEach(async () => {
    const pokeApiSpy = jasmine.createSpyObj('PokeApiService', [
      'getGlobalRankingFromBackend',
      'getPokemon'
    ]);
    const authSpy = jasmine.createSpyObj('AuthService', [
      'isAuthenticated',
      'getCurrentUser',
      'getAuthState'
    ], {
      currentUser$: of(null)
    });
    const capturedSpy = jasmine.createSpyObj('CapturedService', [
      'smartSync',
      'toggleCaptured',
      'getCapturedStates'
    ]);
    const syncSpy = jasmine.createSpyObj('SyncService', ['forceSyncNow']);
    const loadingSpy = jasmine.createSpyObj('LoadingController', ['create']);
    const toastSpy = jasmine.createSpyObj('ToastController', ['create']);
    const translateSpy = jasmine.createSpyObj('TranslateService', ['get']);
    const cdrSpy = jasmine.createSpyObj('ChangeDetectorRef', ['detectChanges']);

    await TestBed.configureTestingModule({
      declarations: [RankingPage],
      imports: [IonicModule.forRoot(), TranslateModule.forRoot()],
      providers: [
        { provide: PokeApiService, useValue: pokeApiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: CapturedService, useValue: capturedSpy },
        { provide: SyncService, useValue: syncSpy },
        { provide: LoadingController, useValue: loadingSpy },
        { provide: ToastController, useValue: toastSpy },
        { provide: TranslateService, useValue: translateSpy },
        { provide: ChangeDetectorRef, useValue: cdrSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RankingPage);
    component = fixture.componentInstance;

    pokeApiService = TestBed.inject(PokeApiService) as jasmine.SpyObj<PokeApiService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    capturedService = TestBed.inject(CapturedService) as jasmine.SpyObj<CapturedService>;
    syncService = TestBed.inject(SyncService) as jasmine.SpyObj<SyncService>;
    loadingController = TestBed.inject(LoadingController) as jasmine.SpyObj<LoadingController>;
    toastController = TestBed.inject(ToastController) as jasmine.SpyObj<ToastController>;
    translateService = TestBed.inject(TranslateService) as jasmine.SpyObj<TranslateService>;
    cdr = TestBed.inject(ChangeDetectorRef) as jasmine.SpyObj<ChangeDetectorRef>;

    // Setup default mocks
    authService.getAuthState.and.returnValue(of(false));
    authService.isAuthenticated.and.returnValue(false);
    authService.getCurrentUser.and.returnValue(null);
    capturedService.smartSync.and.returnValue(of([]));
    translateService.get.and.returnValue(of('Test Message'));

    const mockLoading = jasmine.createSpyObj('HTMLIonLoadingElement', ['present', 'dismiss']);
    mockLoading.present.and.returnValue(Promise.resolve());
    mockLoading.dismiss.and.returnValue(Promise.resolve());
    loadingController.create.and.returnValue(Promise.resolve(mockLoading));

    const mockToast = jasmine.createSpyObj('HTMLIonToastElement', ['present']);
    mockToast.present.and.returnValue(Promise.resolve());
    toastController.create.and.returnValue(Promise.resolve(mockToast));
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Component Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(component.globalRanking).toEqual([]);
      expect(component.loading).toBe(false);
      expect(component.isMobile).toBe(true);
      expect(component.showCompactView).toBe(true);
    });

    it('should setup authentication state on init', async () => {
      authService.getAuthState.and.returnValue(of(true));
      authService.getCurrentUser.and.returnValue({ id: '1', username: 'test', nome: 'Test User', email: 'test@example.com', role: 'user' });
      pokeApiService.getGlobalRankingFromBackend.and.returnValue(of([]));
      capturedService.smartSync.and.returnValue(of([]));

      await component.ngOnInit();

      expect(authService.getAuthState).toHaveBeenCalled();
      expect(component.isAuthenticated).toBe(true);
    });
  });

  describe('loadRanking', () => {
    it('should load ranking successfully', async () => {
      const mockBackendData = [mockBackendRankingItem];
      pokeApiService.getGlobalRankingFromBackend.and.returnValue(of(mockBackendData));
      pokeApiService.getPokemon.and.returnValue(of(mockPokemon));
      capturedService.getCapturedStates.and.returnValue(Promise.resolve({ 1: false }));

      await component.loadRanking();

      expect(component.globalRanking.length).toBe(1);
      expect(component.globalRanking[0].pokemon.id).toBe(1);
      expect(component.globalRanking[0].favoriteCount).toBe(100);
      expect(component.loading).toBe(false);
    });

    it('should handle empty backend response', async () => {
      pokeApiService.getGlobalRankingFromBackend.and.returnValue(of([]));

      await component.loadRanking();

      expect(component.globalRanking).toEqual([]);
      expect(component.loading).toBe(false);
    });

    it('should handle API errors gracefully', async () => {
      pokeApiService.getGlobalRankingFromBackend.and.returnValue(throwError('API Error'));

      await component.loadRanking();

      expect(component.globalRanking).toEqual([]);
      expect(component.loading).toBe(false);
    });
  });

  describe('getCurrentRanking', () => {
    it('should return globalRanking', () => {
      component.globalRanking = [mockPokemonRanking];

      const result = component.getCurrentRanking();

      expect(result).toBe(component.globalRanking);
      expect(result.length).toBe(1);
    });
  });

  describe('onCaptureToggle', () => {
    it('should handle capture toggle successfully', async () => {
      const event = { pokemon: mockPokemon, isCaptured: true };
      capturedService.toggleCaptured.and.returnValue(of(true));
      syncService.forceSyncNow.and.returnValue(Promise.resolve());

      await component.onCaptureToggle(event);

      expect(capturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon);
      expect(syncService.forceSyncNow).toHaveBeenCalled();
    });

    it('should handle invalid capture event', async () => {
      const event = { pokemon: null, isCaptured: true };

      await component.onCaptureToggle(event as any);

      expect(capturedService.toggleCaptured).not.toHaveBeenCalled();
    });
  });

  describe('Helper Methods', () => {
    it('should return correct rank badge color', () => {
      expect(component.getRankBadgeColor(1)).toBe('#FFD700');
      expect(component.getRankBadgeColor(2)).toBe('#C0C0C0');
      expect(component.getRankBadgeColor(3)).toBe('#CD7F32');
      expect(component.getRankBadgeColor(4)).toBe('#6C757D');
    });

    it('should return correct rank icon', () => {
      expect(component.getRankIcon(1)).toBe('🏆');
      expect(component.getRankIcon(2)).toBe('🥈');
      expect(component.getRankIcon(3)).toBe('🥉');
      expect(component.getRankIcon(4)).toBe('#4');
    });

    it('should return correct trend icon', () => {
      expect(component.getTrendIcon('up')).toBe('📈');
      expect(component.getTrendIcon('down')).toBe('📉');
      expect(component.getTrendIcon('stable')).toBe('➡️');
    });

    it('should return correct trend color', () => {
      expect(component.getTrendColor('up')).toBe('#28a745');
      expect(component.getTrendColor('down')).toBe('#dc3545');
      expect(component.getTrendColor('stable')).toBe('#6c757d');
    });
  });

  describe('debugRefreshRanking', () => {
    it('should refresh ranking and clear cache', async () => {
      spyOn(localStorage, 'removeItem');
      pokeApiService.getGlobalRankingFromBackend.and.returnValue(of([]));
      capturedService.smartSync.and.returnValue(of([]));

      await component.debugRefreshRanking();

      expect(localStorage.removeItem).toHaveBeenCalled();
    });
  });
});
