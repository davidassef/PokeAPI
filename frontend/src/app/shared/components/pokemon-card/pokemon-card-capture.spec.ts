import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { PokemonCardComponent } from './pokemon-card.component';
import { CapturedService } from '../../../core/services/captured.service';
import { AuthService } from '../../../core/services/auth.service';
import { AudioService } from '../../../core/services/audio.service';
import { ToastNotificationService } from '../../../core/services/toast-notification.service';
import { Pokemon } from '../../../models/pokemon.model';

/**
 * Comprehensive test suite for Pokemon Card capture button functionality
 * Tests all aspects of the capture system including authentication, states, and error handling
 */
describe('PokemonCardComponent - Capture Button Tests', () => {
  let component: PokemonCardComponent;
  let fixture: ComponentFixture<PokemonCardComponent>;
  let mockCapturedService: jasmine.SpyObj<CapturedService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockAudioService: jasmine.SpyObj<AudioService>;
  let mockToastService: jasmine.SpyObj<ToastNotificationService>;
  let mockModalController: jasmine.SpyObj<ModalController>;

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
    nome: 'Test User',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    const capturedSpy = jasmine.createSpyObj('CapturedService', ['toggleCaptured']);
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser']);
    const audioSpy = jasmine.createSpyObj('AudioService', ['playCaptureSound']);
    const toastSpy = jasmine.createSpyObj('ToastNotificationService', ['showPokemonCaptured', 'showPokemonReleased', 'showError']);
    const modalSpy = jasmine.createSpyObj('ModalController', ['create']);

    await TestBed.configureTestingModule({
      declarations: [PokemonCardComponent],
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

    fixture = TestBed.createComponent(PokemonCardComponent);
    component = fixture.componentInstance;
    
    mockCapturedService = TestBed.inject(CapturedService) as jasmine.SpyObj<CapturedService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockAudioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
    mockToastService = TestBed.inject(ToastNotificationService) as jasmine.SpyObj<ToastNotificationService>;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;

    component.pokemon = mockPokemon;
    component.showCaptureButton = true;
    fixture.detectChanges();
  });

  describe('🎯 Capture Button Visibility', () => {
    it('should show capture button when showCaptureButton is true', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      expect(captureButton).toBeTruthy();
    });

    it('should hide capture button when showCaptureButton is false', () => {
      component.showCaptureButton = false;
      fixture.detectChanges();
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      expect(captureButton).toBeFalsy();
    });

    it('should have correct aria-label for capture state', () => {
      component.isCaptured = false;
      fixture.detectChanges();
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      expect(captureButton.nativeElement.getAttribute('aria-label')).toBe('pokemon.capture');
    });

    it('should have correct aria-label for release state', () => {
      component.isCaptured = true;
      fixture.detectChanges();
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      expect(captureButton.nativeElement.getAttribute('aria-label')).toBe('pokemon.release');
    });
  });

  describe('🔐 Authentication Flow', () => {
    it('should open auth modal when user is not authenticated', async () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockAuthService.getCurrentUser.and.returnValue(null);
      
      const mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onDidDismiss']);
      mockModal.onDidDismiss.and.returnValue(Promise.resolve({ data: null }));
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockModalController.create).toHaveBeenCalled();
      expect(mockModal.present).toHaveBeenCalled();
    });

    it('should proceed with capture when user is authenticated', async () => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon, false);
    });
  });

  describe('🎮 Capture/Release Functionality', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());
    });

    it('should capture pokemon when not captured', async () => {
      component.isCaptured = false;
      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon, false);
      expect(component.isCaptured).toBe(true);
      expect(mockToastService.showPokemonCaptured).toHaveBeenCalledWith(mockPokemon.name);
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('capture');
    });

    it('should release pokemon when captured', async () => {
      component.isCaptured = true;
      mockCapturedService.toggleCaptured.and.returnValue(of(false));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon, true);
      expect(component.isCaptured).toBe(false);
      expect(mockToastService.showPokemonReleased).toHaveBeenCalledWith(mockPokemon.name);
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('release');
    });

    it('should emit captureToggle event on successful capture', async () => {
      spyOn(component.captureToggle, 'emit');
      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(component.captureToggle.emit).toHaveBeenCalledWith({
        pokemon: mockPokemon,
        isCaptured: true
      });
    });
  });

  describe('🎨 Visual States', () => {
    it('should apply captured class when pokemon is captured', () => {
      component.isCaptured = true;
      fixture.detectChanges();
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      expect(captureButton.nativeElement.classList.contains('captured')).toBeTruthy();
    });

    it('should apply capturing class when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      expect(captureButton.nativeElement.classList.contains('capturing')).toBeTruthy();
    });

    it('should disable button when loading', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      expect(captureButton.nativeElement.disabled).toBeTruthy();
    });

    it('should show loading spinner when capturing', () => {
      component.isLoading = true;
      fixture.detectChanges();
      
      const spinner = fixture.debugElement.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should show correct pokeball image for uncaptured state', () => {
      component.isCaptured = false;
      component.isLoading = false;
      fixture.detectChanges();
      
      const pokeballImg = fixture.debugElement.query(By.css('.capture-state img'));
      expect(pokeballImg.nativeElement.src).toContain('opened_pokeball.png');
    });

    it('should show correct pokeball image for captured state', () => {
      component.isCaptured = true;
      component.isLoading = false;
      fixture.detectChanges();
      
      const pokeballImg = fixture.debugElement.query(By.css('.captured-state img'));
      expect(pokeballImg.nativeElement.src).toContain('closed_pokeball.png');
    });
  });

  describe('❌ Error Handling', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
    });

    it('should handle network errors gracefully', async () => {
      const networkError = { status: 0, message: 'Network error' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(networkError));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.network_error');
      expect(component.isLoading).toBe(false);
      expect(component.isProcessing).toBe(false);
    });

    it('should handle authentication errors', async () => {
      const authError = { status: 401, message: 'Unauthorized' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(authError));
      
      const mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onDidDismiss']);
      mockModal.onDidDismiss.and.returnValue(Promise.resolve({ data: null }));
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockModalController.create).toHaveBeenCalled();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { status: 408, message: 'Request timeout' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(timeoutError));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.timeout');
    });

    it('should handle generic errors', async () => {
      const genericError = { status: 500, message: 'Internal server error' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(genericError));

      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      await captureButton.nativeElement.click();

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.error');
    });
  });

  describe('🔒 Multiple Click Prevention', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
    });

    it('should prevent multiple rapid clicks', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      
      // Simulate rapid clicks
      component.onCaptureClick(new Event('click'));
      component.onCaptureClick(new Event('click'));
      component.onCaptureClick(new Event('click'));

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledTimes(1);
    });

    it('should allow clicks after operation completes', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      
      // First click
      await component.onCaptureClick(new Event('click'));
      
      // Wait for operation to complete
      expect(component.isProcessing).toBe(false);
      
      // Second click should work
      await component.onCaptureClick(new Event('click'));
      
      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledTimes(2);
    });
  });

  describe('🎵 Audio Integration', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
    });

    it('should play capture sound on successful capture', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());

      await component.onCaptureClick(new Event('click'));

      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('capture');
    });

    it('should play release sound on successful release', async () => {
      component.isCaptured = true;
      mockCapturedService.toggleCaptured.and.returnValue(of(false));
      mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());

      await component.onCaptureClick(new Event('click'));

      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('release');
    });

    it('should handle audio errors gracefully', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      mockAudioService.playCaptureSound.and.returnValue(Promise.reject('Audio error'));
      
      spyOn(console, 'error');

      await component.onCaptureClick(new Event('click'));

      expect(console.error).toHaveBeenCalled();
      // Should still complete the capture operation
      expect(component.isCaptured).toBe(true);
    });
  });

  describe('🔄 Event Propagation', () => {
    it('should stop event propagation when capture button is clicked', () => {
      const clickEvent = new Event('click');
      spyOn(clickEvent, 'stopPropagation');
      
      component.onCaptureClick(clickEvent);
      
      expect(clickEvent.stopPropagation).toHaveBeenCalled();
    });

    it('should not trigger card click when capture button is clicked', () => {
      spyOn(component.cardClick, 'emit');
      
      const captureButton = fixture.debugElement.query(By.css('.capture-btn'));
      captureButton.nativeElement.click();
      
      expect(component.cardClick.emit).not.toHaveBeenCalled();
    });
  });
});
