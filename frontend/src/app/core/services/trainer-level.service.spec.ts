import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { TrainerLevelService, TrainerStats } from './trainer-level.service';
import { ViewedPokemonService } from './viewed-pokemon.service';
import { CapturedService } from './captured.service';
import { AuthService } from './auth.service';

describe('TrainerLevelService', () => {
  let service: TrainerLevelService;
  let mockViewedPokemonService: jasmine.SpyObj<ViewedPokemonService>;
  let mockCapturedService: jasmine.SpyObj<CapturedService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    const viewedSpy = jasmine.createSpyObj('ViewedPokemonService', [], {
      viewedPokemon$: of({ viewedPokemonIds: new Set([1, 2, 3, 4, 5]) })
    });

    const capturedSpy = jasmine.createSpyObj('CapturedService', ['getCaptured'], {
      getCaptured: () => of([
        { id: 1, pokemon_id: 1, pokemon_name: 'Bulbasaur', user_id: 1, added_at: new Date().toISOString() },
        { id: 2, pokemon_id: 2, pokemon_name: 'Ivysaur', user_id: 1, added_at: new Date().toISOString() },
        { id: 3, pokemon_id: 3, pokemon_name: 'Venusaur', user_id: 1, added_at: new Date().toISOString() }
      ])
    });

    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated']);

    TestBed.configureTestingModule({
      providers: [
        TrainerLevelService,
        { provide: ViewedPokemonService, useValue: viewedSpy },
        { provide: CapturedService, useValue: capturedSpy },
        { provide: AuthService, useValue: authSpy }
      ]
    });

    service = TestBed.inject(TrainerLevelService);
    mockViewedPokemonService = TestBed.inject(ViewedPokemonService) as jasmine.SpyObj<ViewedPokemonService>;
    mockCapturedService = TestBed.inject(CapturedService) as jasmine.SpyObj<CapturedService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should calculate correct XP for viewed and captured Pokemon', (done) => {
    service.trainerStats$.subscribe(stats => {
      expect(stats.viewedCount).toBe(5);
      expect(stats.capturedCount).toBe(3);
      expect(stats.totalXP).toBe(200); // (5 * 10) + (3 * 50) = 50 + 150 = 200
      done();
    });
  });

  it('should calculate correct trainer level for given XP', (done) => {
    service.trainerStats$.subscribe(stats => {
      expect(stats.level.level).toBe(2); // 200 XP should be level 2
      expect(stats.level.title).toBe('Novato');
      expect(stats.level.currentXP).toBe(100); // 200 - 100 (level 1 requirement)
      expect(stats.level.requiredXP).toBe(150); // Level 2 requirement
      done();
    });
  });

  it('should return correct level titles for different levels', () => {
    const service = TestBed.inject(TrainerLevelService);
    
    // Test private method through public interface
    const level1Stats = service['calculateLevel'](50);
    expect(level1Stats.title).toBe('Novato');
    
    const level6Stats = service['calculateLevel'](1000);
    expect(level6Stats.title).toBe('Treinador');
    
    const level11Stats = service['calculateLevel'](5000);
    expect(level11Stats.title).toBe('Especialista');
  });

  it('should calculate Pokemon needed for next level correctly', () => {
    const pokemonNeeded = service.getPokemonNeededForNextLevel();
    
    expect(pokemonNeeded.viewed).toBeGreaterThan(0);
    expect(pokemonNeeded.captured).toBeGreaterThan(0);
    expect(pokemonNeeded.captured).toBeLessThan(pokemonNeeded.viewed);
  });

  it('should return progression info string', () => {
    const progressionInfo = service.getProgressionInfo();
    
    expect(progressionInfo).toContain('XP');
    expect(progressionInfo).toContain('visualizando');
    expect(progressionInfo).toContain('capturando');
  });

  it('should return current level description', () => {
    const description = service.getLevelDescription();
    
    expect(description).toContain('Nível');
    expect(description).toContain('XP');
    expect(description).toContain('%');
  });

  it('should handle zero XP correctly', () => {
    // Mock empty data
    mockViewedPokemonService.viewedPokemon$ = of({ viewedPokemonIds: new Set() });
    mockCapturedService.getCaptured.and.returnValue(of([]));
    
    const newService = new TrainerLevelService(
      mockViewedPokemonService,
      mockCapturedService,
      mockAuthService
    );

    newService.trainerStats$.subscribe(stats => {
      expect(stats.totalXP).toBe(0);
      expect(stats.level.level).toBe(1);
      expect(stats.level.title).toBe('Novato');
      expect(stats.level.currentXP).toBe(0);
      expect(stats.level.progressPercentage).toBe(0);
    });
  });

  it('should calculate high levels correctly', () => {
    const highLevelStats = service['calculateLevel'](50000);
    
    expect(highLevelStats.level).toBeGreaterThan(10);
    expect(highLevelStats.title).not.toBe('Novato');
    expect(highLevelStats.progressPercentage).toBeGreaterThanOrEqual(0);
    expect(highLevelStats.progressPercentage).toBeLessThanOrEqual(100);
  });

  it('should maintain consistent XP calculation', () => {
    const viewedXP = 10 * 10; // 10 viewed Pokemon
    const capturedXP = 5 * 50; // 5 captured Pokemon
    const expectedTotal = viewedXP + capturedXP;
    
    const calculatedTotal = service['calculateTotalXP'](10, 5);
    
    expect(calculatedTotal).toBe(expectedTotal);
  });
});
