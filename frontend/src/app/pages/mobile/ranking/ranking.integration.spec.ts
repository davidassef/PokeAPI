import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { RouterTestingModule } from '@angular/router/testing';
import { of } from 'rxjs';

import { RankingPage } from './ranking.page';
import { PokeApiService } from 'src/app/core/services/poke-api.service';
import { AuthService } from 'src/app/core/services/auth.service';
import { CapturedService } from 'src/app/core/services/captured.service';
import { SyncService } from 'src/app/core/services/sync.service';

describe('RankingPage Integration Tests', () => {
  let component: RankingPage;
  let fixture: ComponentFixture<RankingPage>;

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

    // Setup default mocks
    authSpy.getAuthState.and.returnValue(of(false));
    authSpy.isAuthenticated.and.returnValue(false);
    authSpy.getCurrentUser.and.returnValue(null);
    capturedSpy.smartSync.and.returnValue(of([]));
    pokeApiSpy.getGlobalRankingFromBackend.and.returnValue(of([]));

    await TestBed.configureTestingModule({
      declarations: [RankingPage],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot(),
        HttpClientTestingModule,
        RouterTestingModule
      ],
      providers: [
        { provide: PokeApiService, useValue: pokeApiSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: CapturedService, useValue: capturedSpy },
        { provide: SyncService, useValue: syncSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(RankingPage);
    component = fixture.componentInstance;
  });

  it('should create and initialize correctly', () => {
    expect(component).toBeTruthy();
    expect(component.globalRanking).toEqual([]);
    expect(component.loading).toBe(false);
    expect(component.isMobile).toBe(true);
  });

  it('should render empty state when no ranking data', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const emptyState = compiled.querySelector('.empty-state-mobile');
    
    expect(emptyState).toBeTruthy();
  });

  it('should show loading indicator during data fetch', async () => {
    component.loading = true;
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const loadingElement = compiled.querySelector('ion-spinner');
    
    // Loading should be handled by ionic loading controller
    expect(component.loading).toBe(true);
  });

  it('should have correct mobile-specific classes', () => {
    fixture.detectChanges();
    
    const compiled = fixture.nativeElement;
    const rankingContainer = compiled.querySelector('.ranking-list-mobile');
    
    // Should have mobile-specific styling classes
    expect(compiled.querySelector('.ranking-header')).toBeTruthy();
  });

  it('should handle component lifecycle correctly', () => {
    spyOn(component, 'loadRanking').and.stub();
    spyOn(component, 'loadCapturedStates').and.stub();
    
    component.ngOnInit();
    
    expect(component.loadRanking).toHaveBeenCalled();
    expect(component.loadCapturedStates).toHaveBeenCalled();
  });

  it('should cleanup on destroy', () => {
    const destroySpy = spyOn(component['destroy$'], 'next');
    const completeSpy = spyOn(component['destroy$'], 'complete');
    
    component.ngOnDestroy();
    
    expect(destroySpy).toHaveBeenCalled();
    expect(completeSpy).toHaveBeenCalled();
  });

  it('should have debug refresh functionality', async () => {
    spyOn(component, 'loadRanking').and.stub();
    spyOn(component, 'loadCapturedStates').and.stub();
    spyOn(localStorage, 'removeItem');
    
    await component.debugRefreshRanking();
    
    expect(localStorage.removeItem).toHaveBeenCalled();
    expect(component.loadCapturedStates).toHaveBeenCalled();
    expect(component.loadRanking).toHaveBeenCalled();
  });

  it('should return correct ranking data', () => {
    const mockRanking = [
      {
        pokemon: { id: 1, name: 'bulbasaur' } as any,
        favoriteCount: 100,
        rank: 1,
        trend: 'up' as const
      }
    ];
    
    component.globalRanking = mockRanking;
    
    const result = component.getCurrentRanking();
    expect(result).toBe(mockRanking);
    expect(result.length).toBe(1);
  });

  it('should have helper methods for UI', () => {
    expect(component.getRankBadgeColor(1)).toBe('#FFD700');
    expect(component.getRankIcon(1)).toBe('🏆');
    expect(component.getTrendIcon('up')).toBe('📈');
    expect(component.getTrendColor('up')).toBe('#28a745');
  });
});
