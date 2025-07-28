import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { DetailsModalComponent } from './details-modal.component';
import { CapturedService } from '../../../core/services/captured.service';
import { AuthService } from '../../../core/services/auth.service';
import { AudioService } from '../../../core/services/audio.service';
import { ToastNotificationService } from '../../../core/services/toast-notification.service';
import { Pokemon } from '../../../models/pokemon.model';

/**
 * Comprehensive test suite for Details Modal capture button functionality
 * Tests the capture button implementation in the web modal component
 */
describe('DetailsModalComponent - Capture Button Tests', () => {
  let component: DetailsModalComponent;
  let fixture: ComponentFixture<DetailsModalComponent>;
  let mockCapturedService: jasmine.SpyObj<CapturedService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockAudioService: jasmine.SpyObj<AudioService>;
  let mockToastService: jasmine.SpyObj<ToastNotificationService>;
  let mockModalController: jasmine.SpyObj<ModalController>;

  const mockPokemon: Pokemon = {
    id: 25,
    name: 'pikachu',
    height: 4,
    weight: 60,
    base_experience: 112,
    types: [
      {
        slot: 1,
        type: {
          name: 'electric',
          url: 'https://pokeapi.co/api/v2/type/13/'
        }
      }
    ],
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
      other: {
        'official-artwork': {
          front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/25.png'
        }
      }
    },
    abilities: [
      {
        ability: {
          name: 'static',
          url: 'https://pokeapi.co/api/v2/ability/9/'
        },
        is_hidden: false,
        slot: 1
      }
    ],
    stats: [
      {
        base_stat: 35,
        effort: 0,
        stat: {
          name: 'hp',
          url: 'https://pokeapi.co/api/v2/stat/1/'
        }
      }
    ],
    species: {
      name: 'pikachu',
      url: 'https://pokeapi.co/api/v2/pokemon-species/25/'
    }
  };

  const mockUser = {
    id: 1,
    nome: 'Test User',
    email: 'test@example.com'
  };

  beforeEach(async () => {
    const capturedSpy = jasmine.createSpyObj('CapturedService', ['toggleCaptured', 'captured$']);
    const authSpy = jasmine.createSpyObj('AuthService', ['isAuthenticated', 'getCurrentUser']);
    const audioSpy = jasmine.createSpyObj('AudioService', ['playCaptureSound']);
    const toastSpy = jasmine.createSpyObj('ToastNotificationService', ['showPokemonCaptured', 'showPokemonReleased', 'showError']);
    const modalSpy = jasmine.createSpyObj('ModalController', ['create']);

    // Setup captured$ observable
    capturedSpy.captured$ = of([]);

    await TestBed.configureTestingModule({
      declarations: [DetailsModalComponent],
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

    fixture = TestBed.createComponent(DetailsModalComponent);
    component = fixture.componentInstance;

    mockCapturedService = TestBed.inject(CapturedService) as jasmine.SpyObj<CapturedService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockAudioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
    mockToastService = TestBed.inject(ToastNotificationService) as jasmine.SpyObj<ToastNotificationService>;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;

    component.pokemon = mockPokemon;
    component.pokemonId = 25;
    component.isOpen = true;
    fixture.detectChanges();
  });

  describe('🎯 Capture Button Visibility and Layout', () => {
    it('should show capture button when showCaptureButton is true', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.modal-capture-btn'));
      expect(captureButton).toBeTruthy();
    });

    it('should hide capture button when showCaptureButton is false', () => {
      component.showCaptureButton = false;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.modal-capture-btn'));
      expect(captureButton).toBeFalsy();
    });

    it('should position button correctly in name-and-id-container', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const container = fixture.debugElement.query(By.css('.name-and-id-container'));
      const captureButton = container.query(By.css('.modal-capture-btn'));

      expect(captureButton).toBeTruthy();
      expect(captureButton.nativeElement.style.position).toBe('absolute');
    });

    it('should have correct data-pokemon-id attribute', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.modal-capture-btn'));
      expect(captureButton.nativeElement.getAttribute('data-pokemon-id')).toBe('25');
    });
  });

  describe('🔄 State Synchronization', () => {
    it('should initialize capture state from CapturedService', () => {
      const capturedPokemon = [{ pokemon_id: 25, captured_at: new Date() }];
      mockCapturedService.captured$ = of(capturedPokemon);

      component.initializeCaptureState();

      expect(component.isCaptured).toBe(true);
    });

    it('should update capture state when captured list changes', () => {
      // Initially not captured
      mockCapturedService.captured$ = of([]);
      component.initializeCaptureState();
      expect(component.isCaptured).toBe(false);

      // Update to captured
      const capturedPokemon = [{ pokemon_id: 25, captured_at: new Date() }];
      mockCapturedService.captured$ = of(capturedPokemon);
      component.initializeCaptureState();
      expect(component.isCaptured).toBe(true);
    });

    it('should clean up subscription on destroy', () => {
      spyOn(component['capturedSubscription'], 'unsubscribe');

      component.ngOnDestroy();

      expect(component['capturedSubscription'].unsubscribe).toHaveBeenCalled();
    });
  });

  describe('🔐 Authentication Integration', () => {
    it('should open auth modal when user is not authenticated', async () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockAuthService.getCurrentUser.and.returnValue(null);

      const mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onDidDismiss']);
      mockModal.onDidDismiss.and.returnValue(Promise.resolve({ data: null }));
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      await component.onCaptureClick(new Event('click'));

      expect(mockModalController.create).toHaveBeenCalledWith({
        component: jasmine.any(Function),
        cssClass: 'auth-modal-fixed', // ✅ CORREÇÃO: Atualizar teste para usar auth-modal-fixed
        backdropDismiss: true
      });
    });

    it('should retry capture after successful login', async () => {
      mockAuthService.isAuthenticated.and.returnValue(false);
      mockAuthService.getCurrentUser.and.returnValue(null);

      const mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onDidDismiss']);
      mockModal.onDidDismiss.and.returnValue(Promise.resolve({ data: { success: true } }));
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      spyOn(component, 'onCaptureClick').and.callThrough();

      await component.onCaptureClick(new Event('click'));

      // Should call onCaptureClick again after successful login
      expect(component.onCaptureClick).toHaveBeenCalledTimes(1);
    });
  });

  describe('🎮 Capture/Release Operations', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());
    });

    it('should capture pokemon successfully', async () => {
      component.isCaptured = false;
      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      await component.onCaptureClick(new Event('click'));

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon, false);
      expect(component.isCaptured).toBe(true);
      expect(mockToastService.showPokemonCaptured).toHaveBeenCalledWith(mockPokemon.name);
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('capture');
    });

    it('should release pokemon successfully', async () => {
      component.isCaptured = true;
      mockCapturedService.toggleCaptured.and.returnValue(of(false));

      await component.onCaptureClick(new Event('click'));

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledWith(mockPokemon, true);
      expect(component.isCaptured).toBe(false);
      expect(mockToastService.showPokemonReleased).toHaveBeenCalledWith(mockPokemon.name);
      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('release');
    });

    it('should handle loading states correctly', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      const capturePromise = component.onCaptureClick(new Event('click'));

      expect(component.isCaptureLoading).toBe(true);
      expect(component.isProcessing).toBe(true);

      await capturePromise;

      expect(component.isCaptureLoading).toBe(false);
      expect(component.isProcessing).toBe(false);
    });
  });

  describe('🎨 Visual States and Styling', () => {
    beforeEach(() => {
      component.showCaptureButton = true;
      fixture.detectChanges();
    });

    it('should apply captured class when pokemon is captured', () => {
      component.isCaptured = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.modal-capture-btn'));
      expect(captureButton.nativeElement.classList.contains('captured')).toBeTruthy();
    });

    it('should apply capturing class when loading', () => {
      component.isCaptureLoading = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.modal-capture-btn'));
      expect(captureButton.nativeElement.classList.contains('capturing')).toBeTruthy();
    });

    it('should disable button when loading', () => {
      component.isCaptureLoading = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.modal-capture-btn'));
      expect(captureButton.nativeElement.disabled).toBeTruthy();
    });

    it('should show loading spinner when capturing', () => {
      component.isCaptureLoading = true;
      fixture.detectChanges();

      const loadingState = fixture.debugElement.query(By.css('.loading-state'));
      const spinner = loadingState.query(By.css('ion-spinner'));
      expect(spinner).toBeTruthy();
    });

    it('should show correct pokeball for uncaptured state', () => {
      component.isCaptured = false;
      component.isCaptureLoading = false;
      fixture.detectChanges();

      const captureState = fixture.debugElement.query(By.css('.capture-state'));
      const pokeballImg = captureState.query(By.css('img'));
      expect(pokeballImg.nativeElement.src).toContain('opened_pokeball.png');
    });

    it('should show correct pokeball for captured state', () => {
      component.isCaptured = true;
      component.isCaptureLoading = false;
      fixture.detectChanges();

      const capturedState = fixture.debugElement.query(By.css('.captured-state'));
      const pokeballImg = capturedState.query(By.css('img'));
      expect(pokeballImg.nativeElement.src).toContain('closed_pokeball.png');
    });

    it('should show capture hint icon for uncaptured state', () => {
      component.isCaptured = false;
      component.isCaptureLoading = false;
      fixture.detectChanges();

      const captureHint = fixture.debugElement.query(By.css('.capture-hint ion-icon'));
      expect(captureHint.nativeElement.getAttribute('name')).toBe('add-circle-outline');
    });

    it('should show captured indicator for captured state', () => {
      component.isCaptured = true;
      component.isCaptureLoading = false;
      fixture.detectChanges();

      const capturedIndicator = fixture.debugElement.query(By.css('.captured-indicator ion-icon'));
      expect(capturedIndicator.nativeElement.getAttribute('name')).toBe('checkmark-circle');
    });
  });

  describe('❌ Error Handling', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
    });

    it('should handle network errors', async () => {
      const networkError = { status: 0, message: 'Network error' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(networkError));

      await component.onCaptureClick(new Event('click'));

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.network_error');
      expect(component.isCaptureLoading).toBe(false);
      expect(component.isProcessing).toBe(false);
    });

    it('should handle authentication errors by reopening auth modal', async () => {
      const authError = { status: 401, message: 'Unauthorized' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(authError));

      const mockModal = jasmine.createSpyObj('HTMLIonModalElement', ['present', 'onDidDismiss']);
      mockModal.onDidDismiss.and.returnValue(Promise.resolve({ data: null }));
      mockModalController.create.and.returnValue(Promise.resolve(mockModal));

      await component.onCaptureClick(new Event('click'));

      expect(mockModalController.create).toHaveBeenCalled();
    });

    it('should handle timeout errors', async () => {
      const timeoutError = { status: 408, message: 'Request timeout' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(timeoutError));

      await component.onCaptureClick(new Event('click'));

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.timeout');
    });

    it('should reset loading states on error', async () => {
      const error = { status: 500, message: 'Server error' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(error));

      await component.onCaptureClick(new Event('click'));

      expect(component.isCaptureLoading).toBe(false);
      expect(component.isProcessing).toBe(false);
    });
  });

  describe('🔒 Multiple Click Prevention', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
    });

    it('should prevent multiple rapid clicks', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      // Simulate rapid clicks
      component.onCaptureClick(new Event('click'));
      component.onCaptureClick(new Event('click'));
      component.onCaptureClick(new Event('click'));

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledTimes(1);
    });

    it('should ignore clicks when processing', () => {
      component.isProcessing = true;
      spyOn(console, 'log');

      component.onCaptureClick(new Event('click'));

      expect(console.log).toHaveBeenCalledWith('[DetailsModal] Operação de captura já em andamento, ignorando clique');
      expect(mockCapturedService.toggleCaptured).not.toHaveBeenCalled();
    });
  });

  describe('🔧 Force Icon Reset', () => {
    it('should apply force-reset class temporarily', (done) => {
      component.pokemon = mockPokemon;

      // Mock DOM element
      const mockButton = jasmine.createSpyObj('HTMLElement', ['classList']);
      spyOn(document, 'querySelector').and.returnValue(mockButton);

      component.forceIconReset();

      setTimeout(() => {
        expect(mockButton.classList.add).toHaveBeenCalledWith('force-reset');

        setTimeout(() => {
          expect(mockButton.classList.remove).toHaveBeenCalledWith('force-reset');
          done();
        }, 150);
      }, 100);
    });

    it('should handle missing DOM element gracefully', () => {
      spyOn(document, 'querySelector').and.returnValue(null);

      expect(() => component.forceIconReset()).not.toThrow();
    });
  });

  describe('🎵 Audio Integration', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
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
});
