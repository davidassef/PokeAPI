import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { ViewedPokemonService, ViewedPokemonData } from './viewed-pokemon.service';
import { AuthService } from './auth.service';
import { User } from '../../models/user.model';

describe('ViewedPokemonService', () => {
  let service: ViewedPokemonService;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  const mockUser: User = {
    id: '1',
    name: 'Test User',
    email: 'test@example.com',
    contact: '123456789',
    security_question: 'Test Question',
    security_answer: 'Test Answer'
  };

  beforeEach(() => {
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser', 'getAuthState']);

    TestBed.configureTestingModule({
      providers: [
        ViewedPokemonService,
        { provide: AuthService, useValue: authServiceSpy }
      ]
    });

    service = TestBed.inject(ViewedPokemonService);
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;

    // Setup default mocks
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAuthService.getAuthState.and.returnValue(of(true));

    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with empty viewed Pokemon data', () => {
    const currentData = service.getCurrentData();
    expect(currentData.viewedPokemonIds.size).toBe(0);
    expect(currentData.totalPokemonCount).toBe(1010);
  });

  it('should mark Pokemon as viewed', () => {
    service.markPokemonAsViewed(1);
    
    const currentData = service.getCurrentData();
    expect(currentData.viewedPokemonIds.has(1)).toBeTrue();
    expect(service.getViewedCount()).toBe(1);
  });

  it('should not duplicate viewed Pokemon', () => {
    service.markPokemonAsViewed(1);
    service.markPokemonAsViewed(1);
    
    expect(service.getViewedCount()).toBe(1);
  });

  it('should track multiple unique Pokemon', () => {
    service.markPokemonAsViewed(1);
    service.markPokemonAsViewed(25);
    service.markPokemonAsViewed(150);
    
    expect(service.getViewedCount()).toBe(3);
    expect(service.isPokemonViewed(1)).toBeTrue();
    expect(service.isPokemonViewed(25)).toBeTrue();
    expect(service.isPokemonViewed(150)).toBeTrue();
    expect(service.isPokemonViewed(2)).toBeFalse();
  });

  it('should calculate completion percentage correctly', () => {
    // Mark 101 Pokemon as viewed (10.1% of 1010)
    for (let i = 1; i <= 101; i++) {
      service.markPokemonAsViewed(i);
    }
    
    const percentage = service.getCompletionPercentage();
    expect(percentage).toBe(10); // Should round to 10%
  });

  it('should get viewed Pokemon IDs as array', () => {
    service.markPokemonAsViewed(1);
    service.markPokemonAsViewed(25);
    service.markPokemonAsViewed(150);
    
    const viewedIds = service.getViewedPokemonIds();
    expect(viewedIds).toContain(1);
    expect(viewedIds).toContain(25);
    expect(viewedIds).toContain(150);
    expect(viewedIds.length).toBe(3);
  });

  it('should save and load viewed Pokemon data from localStorage', () => {
    service.markPokemonAsViewed(1);
    service.markPokemonAsViewed(25);
    
    // Create new service instance to test loading
    const newService = new ViewedPokemonService(mockAuthService);
    
    expect(newService.getViewedCount()).toBe(2);
    expect(newService.isPokemonViewed(1)).toBeTrue();
    expect(newService.isPokemonViewed(25)).toBeTrue();
  });

  it('should use user-specific storage key when authenticated', () => {
    service.markPokemonAsViewed(1);
    
    const storageKey = `viewed_pokemon_data_${mockUser.id}`;
    const storedData = localStorage.getItem(storageKey);
    
    expect(storedData).toBeTruthy();
    const parsedData = JSON.parse(storedData!);
    expect(parsedData.viewedPokemonIds).toContain(1);
    expect(parsedData.userId).toBe(mockUser.id);
  });

  it('should use anonymous storage key when not authenticated', () => {
    mockAuthService.getCurrentUser.and.returnValue(null);
    
    const anonymousService = new ViewedPokemonService(mockAuthService);
    anonymousService.markPokemonAsViewed(1);
    
    const storageKey = 'viewed_pokemon_data';
    const storedData = localStorage.getItem(storageKey);
    
    expect(storedData).toBeTruthy();
    const parsedData = JSON.parse(storedData!);
    expect(parsedData.viewedPokemonIds).toContain(1);
    expect(parsedData.userId).toBeUndefined();
  });

  it('should clear viewed Pokemon on logout', () => {
    service.markPokemonAsViewed(1);
    service.markPokemonAsViewed(25);
    
    expect(service.getViewedCount()).toBe(2);
    
    // Simulate logout
    mockAuthService.getAuthState.and.returnValue(of(false));
    const newService = new ViewedPokemonService(mockAuthService);
    
    expect(newService.getViewedCount()).toBe(0);
  });

  it('should import viewed Pokemon data', () => {
    const pokemonIds = [1, 2, 3, 4, 5];
    service.importViewedPokemon(pokemonIds);
    
    expect(service.getViewedCount()).toBe(5);
    pokemonIds.forEach(id => {
      expect(service.isPokemonViewed(id)).toBeTrue();
    });
  });

  it('should merge imported data with existing data', () => {
    service.markPokemonAsViewed(1);
    service.markPokemonAsViewed(2);
    
    const newPokemonIds = [3, 4, 5];
    service.importViewedPokemon(newPokemonIds);
    
    expect(service.getViewedCount()).toBe(5);
    expect(service.isPokemonViewed(1)).toBeTrue();
    expect(service.isPokemonViewed(2)).toBeTrue();
    expect(service.isPokemonViewed(3)).toBeTrue();
    expect(service.isPokemonViewed(4)).toBeTrue();
    expect(service.isPokemonViewed(5)).toBeTrue();
  });

  it('should handle corrupted localStorage data gracefully', () => {
    // Set corrupted data in localStorage
    localStorage.setItem('viewed_pokemon_data_1', 'invalid json');
    
    const newService = new ViewedPokemonService(mockAuthService);
    
    // Should reset to empty state
    expect(newService.getViewedCount()).toBe(0);
  });

  it('should emit updates through observable', (done) => {
    let emissionCount = 0;
    
    service.viewedPokemon$.subscribe((data: ViewedPokemonData) => {
      emissionCount++;
      
      if (emissionCount === 1) {
        // Initial emission
        expect(data.viewedPokemonIds.size).toBe(0);
      } else if (emissionCount === 2) {
        // After marking Pokemon as viewed
        expect(data.viewedPokemonIds.size).toBe(1);
        expect(data.viewedPokemonIds.has(1)).toBeTrue();
        done();
      }
    });
    
    // Trigger update
    service.markPokemonAsViewed(1);
  });
});
