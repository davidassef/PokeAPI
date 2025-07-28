import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { of, throwError, BehaviorSubject } from 'rxjs';

import { PokemonCardComponent } from '../shared/components/pokemon-card/pokemon-card.component';
import { DetailsModalComponent } from '../pages/web/details/details-modal.component';
import { PokemonDetailsMobileComponent } from '../shared/components/pokemon-details-mobile/pokemon-details-mobile.component';
import { CapturedService } from '../core/services/captured.service';
import { AuthService } from '../core/services/auth.service';
import { AudioService } from '../core/services/audio.service';
import { ToastNotificationService } from '../core/services/toast-notification.service';
import { Pokemon } from '../models/pokemon.model';

/**
 * Integration test suite for capture button functionality across all components
 * Tests the complete capture flow from card to modal and state synchronization
 */
describe('Capture Button Integration Tests', () => {
  let mockCapturedService: jasmine.SpyObj<CapturedService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockAudioService: jasmine.SpyObj<AudioService>;
  let mockToastService: jasmine.SpyObj<ToastNotificationService>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let capturedSubject: BehaviorSubject<any[]>;

  const mockPokemon: Pokemon = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    base_experience: 64,
    types: [
      {
        slot: 1,
        type: {
          name: 'grass',
          url: 'https://pokeapi.co/api/v2/type/12/'
        }
      }
    ],
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
      other: {
        'official-artwork': {
          front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/1.png'
        }
      }
    },
    abilities: [],
    stats: [],
    species: {
      name: 'bulbasaur',
      url: 'https://pokeapi.co/api/v2/pokemon-species/1/'
    }
  };

  const mockUser = {
    id: 1,
    nome: 'Integration Test User',
    email: 'integration@example.com'
  };

  beforeEach(async () => {
    capturedSubject = new BehaviorSubject<any[]>([]);
    
    const capturedSpy = jasmine.createSpyObj('CapturedService', ['toggleCaptured']);
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser']);
    const audioSpy = jasmine.createSpyObj('AudioService', ['playCaptureSound']);
    const toastSpy = jasmine.createSpyObj('ToastNotificationService', ['showPokemonCaptured', 'showPokemonReleased', 'showError']);
    const modalSpy = jasmine.createSpyObj('ModalController', ['create']);

    // Setup captured$ observable
    capturedSpy.captured$ = capturedSubject.asObservable();

    await TestBed.configureTestingModule({
      declarations: [
        PokemonCardComponent,
        DetailsModalComponent,
        PokemonDetailsMobileComponent
      ],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: CapturedService, useValue: capturedSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: AudioService, useValue: audioSpy },
        { provide: ToastNotificationService, useValue: toastSpy },
        { provide: ModalController, useValue: modalSpy },
        TranslateService
      ]
    }).compileComponents();

    mockCapturedService = TestBed.inject(CapturedService) as jasmine.SpyObj<CapturedService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockAudioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
    mockToastService = TestBed.inject(ToastNotificationService) as jasmine.SpyObj<ToastNotificationService>;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;

    // Setup default mocks
    mockAuthService.isAuthenticated.and.returnValue(true);
    mockAuthService.getCurrentUser.and.returnValue(mockUser);
    mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());
  });

  describe('🔄 Cross-Component State Synchronization', () => {
    it('should synchronize capture state between card and modal', async () => {
      // Create card component
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardFixture.detectChanges();

      // Create modal component
      const modalFixture = TestBed.createComponent(DetailsModalComponent);
      const modalComponent = modalFixture.componentInstance;
      modalComponent.pokemon = mockPokemon;
      modalComponent.pokemonId = 1;
      modalComponent.isOpen = true;
      modalFixture.detectChanges();

      // Initially both should be uncaptured
      expect(cardComponent.isCaptured).toBe(false);
      expect(modalComponent.isCaptured).toBe(false);

      // Capture via card
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      await cardComponent.onCaptureClick(new Event('click'));

      // Update captured list
      capturedSubject.next([{ pokemon_id: 1, captured_at: new Date() }]);

      // Both components should reflect the captured state
      expect(cardComponent.isCaptured).toBe(true);
      
      // Modal should also update when it initializes capture state
      modalComponent.initializeCaptureState();
      expect(modalComponent.isCaptured).toBe(true);
    });

    it('should synchronize capture state between web and mobile modals', async () => {
      // Create web modal component
      const webModalFixture = TestBed.createComponent(DetailsModalComponent);
      const webModalComponent = webModalFixture.componentInstance;
      webModalComponent.pokemon = mockPokemon;
      webModalComponent.pokemonId = 1;
      webModalComponent.isOpen = true;
      webModalFixture.detectChanges();

      // Create mobile modal component
      const mobileModalFixture = TestBed.createComponent(PokemonDetailsMobileComponent);
      const mobileModalComponent = mobileModalFixture.componentInstance;
      mobileModalComponent.pokemon = mockPokemon;
      mobileModalComponent.pokemonId = 1;
      mobileModalComponent.isOpen = true;
      mobileModalFixture.detectChanges();

      // Capture via web modal
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      await webModalComponent.onCaptureClick(new Event('click'));

      // Update captured list
      capturedSubject.next([{ pokemon_id: 1, captured_at: new Date() }]);

      // Both modals should reflect the captured state
      expect(webModalComponent.isCaptured).toBe(true);
      
      mobileModalComponent.initializeCaptureState();
      expect(mobileModalComponent.isCaptured).toBe(true);
    });

    it('should handle multiple pokemon capture states correctly', async () => {
      const pokemon2 = { ...mockPokemon, id: 2, name: 'ivysaur' };
      
      // Create components for different pokemon
      const card1Fixture = TestBed.createComponent(PokemonCardComponent);
      const card1Component = card1Fixture.componentInstance;
      card1Component.pokemon = mockPokemon;
      card1Component.showCaptureButton = true;
      card1Fixture.detectChanges();

      const card2Fixture = TestBed.createComponent(PokemonCardComponent);
      const card2Component = card2Fixture.componentInstance;
      card2Component.pokemon = pokemon2;
      card2Component.showCaptureButton = true;
      card2Fixture.detectChanges();

      // Capture only first pokemon
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      await card1Component.onCaptureClick(new Event('click'));

      // Update captured list with only first pokemon
      capturedSubject.next([{ pokemon_id: 1, captured_at: new Date() }]);

      // Initialize capture states
      card1Component.initializeCaptureState();
      card2Component.initializeCaptureState();

      // Only first pokemon should be captured
      expect(card1Component.isCaptured).toBe(true);
      expect(card2Component.isCaptured).toBe(false);
    });
  });

  describe('🎯 End-to-End Capture Flow', () => {
    it('should complete full capture flow from card to modal', async () => {
      // Create card component
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardFixture.detectChanges();

      // Step 1: Click capture on card
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      await cardComponent.onCaptureClick(new Event('click'));

      // Verify card capture
      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon, false);
      expect(cardComponent.isCaptured).toBe(true);
      expect(mockToastService.showPokemonCaptured).toHaveBeenCalledWith(mockPokemon.name);
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('capture');

      // Step 2: Open modal for same pokemon
      const modalFixture = TestBed.createComponent(DetailsModalComponent);
      const modalComponent = modalFixture.componentInstance;
      modalComponent.pokemon = mockPokemon;
      modalComponent.pokemonId = 1;
      modalComponent.isOpen = true;

      // Update captured list
      capturedSubject.next([{ pokemon_id: 1, captured_at: new Date() }]);
      modalComponent.initializeCaptureState();
      modalFixture.detectChanges();

      // Modal should show captured state
      expect(modalComponent.isCaptured).toBe(true);
      const captureButton = modalFixture.debugElement.query(By.css('.modal-capture-btn'));
      expect(captureButton.nativeElement.classList.contains('captured')).toBeTruthy();

      // Step 3: Release via modal
      mockCapturedService.toggleCaptured.and.returnValue(of(false));
      await modalComponent.onCaptureClick(new Event('click'));

      // Verify release
      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon, true);
      expect(modalComponent.isCaptured).toBe(false);
      expect(mockToastService.showPokemonReleased).toHaveBeenCalledWith(mockPokemon.name);
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('release');
    });

    it('should handle authentication flow across components', async () => {
      // Setup unauthenticated state
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockAuthService.getCurrentUser.and.returnValue(null);

      const mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onDidDismiss']);
      mockModal.onDidDismiss.and.returnValue(Promise.resolve({ data: null }));
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      // Test card component
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardFixture.detectChanges();

      await cardComponent.onCaptureClick(new Event('click'));
      expect(mockModalController.create).toHaveBeenCalled();

      // Test modal component
      const modalFixture = TestBed.createComponent(DetailsModalComponent);
      const modalComponent = modalFixture.componentInstance;
      modalComponent.pokemon = mockPokemon;
      modalComponent.pokemonId = 1;
      modalComponent.isOpen = true;
      modalFixture.detectChanges();

      await modalComponent.onCaptureClick(new Event('click'));
      expect(mockModalController.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('❌ Error Handling Across Components', () => {
    it('should handle network errors consistently across components', async () => {
      const networkError = { status: 0, message: 'Network error' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(networkError));

      // Test card component error handling
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardFixture.detectChanges();

      await cardComponent.onCaptureClick(new Event('click'));
      expect(mockToastService.showError).toHaveBeenCalledWith('capture.network_error');
      expect(cardComponent.isLoading).toBe(false);

      // Test modal component error handling
      const modalFixture = TestBed.createComponent(DetailsModalComponent);
      const modalComponent = modalFixture.componentInstance;
      modalComponent.pokemon = mockPokemon;
      modalComponent.pokemonId = 1;
      modalComponent.isOpen = true;
      modalFixture.detectChanges();

      await modalComponent.onCaptureClick(new Event('click'));
      expect(mockToastService.showError).toHaveBeenCalledTimes(2);
      expect(modalComponent.isCaptureLoading).toBe(false);
    });

    it('should maintain state consistency after errors', async () => {
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardComponent.isCaptured = false;
      cardFixture.detectChanges();

      // Simulate error
      const error = { status: 500, message: 'Server error' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(error));

      await cardComponent.onCaptureClick(new Event('click'));

      // State should remain unchanged after error
      expect(cardComponent.isCaptured).toBe(false);
      expect(cardComponent.isLoading).toBe(false);
      expect(cardComponent.isProcessing).toBe(false);
    });
  });

  describe('🎵 Audio Integration Across Components', () => {
    it('should play audio consistently across all components', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      // Test card audio
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardFixture.detectChanges();

      await cardComponent.onCaptureClick(new Event('click'));
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('capture');

      // Test modal audio
      const modalFixture = TestBed.createComponent(DetailsModalComponent);
      const modalComponent = modalFixture.componentInstance;
      modalComponent.pokemon = mockPokemon;
      modalComponent.pokemonId = 1;
      modalComponent.isOpen = true;
      modalFixture.detectChanges();

      await modalComponent.onCaptureClick(new Event('click'));
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledTimes(2);
    });

    it('should handle audio errors gracefully across components', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      mockAudioService.playCaptureSound.and.returnValue(Promise.reject('Audio error'));
      
      spyOn(console, 'error');

      // Test card audio error handling
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardFixture.detectChanges();

      await cardComponent.onCaptureClick(new Event('click'));
      
      // Should still complete capture despite audio error
      expect(cardComponent.isCaptured).toBe(true);
      expect(console.error).toHaveBeenCalled();
    });
  });

  describe('🔒 Performance and Memory Management', () => {
    it('should clean up subscriptions properly', () => {
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardFixture.detectChanges();

      const modalFixture = TestBed.createComponent(DetailsModalComponent);
      const modalComponent = modalFixture.componentInstance;
      modalComponent.pokemon = mockPokemon;
      modalFixture.detectChanges();

      // Destroy components
      cardComponent.ngOnDestroy();
      modalComponent.ngOnDestroy();

      // Should not throw errors
      expect(() => {
        capturedSubject.next([]);
      }).not.toThrow();
    });

    it('should prevent memory leaks from multiple rapid operations', async () => {
      const cardFixture = TestBed.createComponent(PokemonCardComponent);
      const cardComponent = cardFixture.componentInstance;
      cardComponent.pokemon = mockPokemon;
      cardComponent.showCaptureButton = true;
      cardFixture.detectChanges();

      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      // Simulate rapid operations
      const promises = Array(10).fill(null).map(() => 
        cardComponent.onCaptureClick(new Event('click'))
      );

      await Promise.all(promises);

      // Should only process one operation
      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledTimes(1);
    });
  });
});
