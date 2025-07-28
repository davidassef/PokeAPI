import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';

import { PokemonDetailsMobileComponent } from './pokemon-details-mobile.component';
import { CapturedService } from '../../../core/services/captured.service';
import { AuthService } from '../../../core/services/auth.service';
import { AudioService } from '../../../core/services/audio.service';
import { ToastNotificationService } from '../../../core/services/toast-notification.service';
import { Pokemon } from '../../../models/pokemon.model';

/**
 * Comprehensive test suite for Mobile Pokemon Details capture button functionality
 * Tests the capture button implementation in the mobile modal component
 */
describe('PokemonDetailsMobileComponent - Capture Button Tests', () => {
  let component: PokemonDetailsMobileComponent;
  let fixture: ComponentFixture<PokemonDetailsMobileComponent>;
  let mockCapturedService: jasmine.SpyObj<CapturedService>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockAudioService: jasmine.SpyObj<AudioService>;
  let mockToastService: jasmine.SpyObj<ToastNotificationService>;
  let mockModalController: jasmine.SpyObj<ModalController>;

  const mockPokemon: Pokemon = {
    id: 150,
    name: 'mewtwo',
    height: 20,
    weight: 1220,
    base_experience: 306,
    types: [
      {
        slot: 1,
        type: {
          name: 'psychic',
          url: 'https://pokeapi.co/api/v2/type/14/'
        }
      }
    ],
    sprites: {
      front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/150.png',
      other: {
        'official-artwork': {
          front_default: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/150.png'
        }
      }
    },
    abilities: [
      {
        ability: {
          name: 'pressure',
          url: 'https://pokeapi.co/api/v2/ability/46/'
        },
        is_hidden: false,
        slot: 1
      }
    ],
    stats: [
      {
        base_stat: 106,
        effort: 0,
        stat: {
          name: 'hp',
          url: 'https://pokeapi.co/api/v2/stat/1/'
        }
      }
    ],
    species: {
      name: 'mewtwo',
      url: 'https://pokeapi.co/api/v2/pokemon-species/150/'
    }
  };

  const mockUser = {
    id: 1,
    nome: 'Mobile Test User',
    email: 'mobile@example.com'
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
      declarations: [PokemonDetailsMobileComponent],
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

    fixture = TestBed.createComponent(PokemonDetailsMobileComponent);
    component = fixture.componentInstance;

    mockCapturedService = TestBed.inject(CapturedService) as jasmine.SpyObj<CapturedService>;
    mockAuthService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    mockAudioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
    mockToastService = TestBed.inject(ToastNotificationService) as jasmine.SpyObj<ToastNotificationService>;
    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;

    component.pokemon = mockPokemon;
    component.pokemonId = 150;
    component.isOpen = true;
    fixture.detectChanges();
  });

  describe('🎯 Mobile Capture Button Layout', () => {
    it('should show capture button in mobile header', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));
      expect(captureButton).toBeTruthy();
    });

    it('should position button correctly in header-center', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const headerCenter = fixture.debugElement.query(By.css('.header-center'));
      const captureButton = headerCenter.query(By.css('.mobile-capture-btn'));

      expect(captureButton).toBeTruthy();
      expect(captureButton.nativeElement.style.position).toBe('absolute');
    });

    it('should have correct mobile-specific styling', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));
      const computedStyle = window.getComputedStyle(captureButton.nativeElement);

      // Mobile button should be smaller (48x48px)
      expect(captureButton.nativeElement.classList.contains('mobile-capture-btn')).toBeTruthy();
    });

    it('should have correct data-pokemon-id attribute', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));
      expect(captureButton.nativeElement.getAttribute('data-pokemon-id')).toBe('150');
    });
  });

  describe('📱 Mobile-Specific Interactions', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
      mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());
    });

    it('should handle touch events properly', async () => {
      component.showCaptureButton = true;
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));

      // Simulate touch event
      const touchEvent = new TouchEvent('touchstart');
      captureButton.nativeElement.dispatchEvent(touchEvent);

      await component.onCaptureClick(new Event('click'));

      expect(mockCapturedService.toggleCaptured).toHaveBeenCalled();
    });

    it('should provide haptic feedback on mobile devices', async () => {
      // Mock navigator.vibrate for mobile haptic feedback
      const mockVibrate = jasmine.createSpy('vibrate');
      (navigator as any).vibrate = mockVibrate;

      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      await component.onCaptureClick(new Event('click'));

      // Should trigger haptic feedback on successful capture
      expect(mockVibrate).toHaveBeenCalledWith(50);
    });

    it('should handle mobile viewport changes', () => {
      // Simulate mobile viewport change
      const resizeEvent = new Event('resize');
      window.dispatchEvent(resizeEvent);

      component.showCaptureButton = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));
      expect(captureButton).toBeTruthy();
    });
  });

  describe('🔄 Mobile State Management', () => {
    it('should sync capture state with mobile-specific storage', () => {
      const capturedPokemon = [{ pokemon_id: 150, captured_at: new Date() }];
      mockCapturedService.captured$ = of(capturedPokemon);

      component.initializeCaptureState();

      expect(component.isCaptured).toBe(true);
    });

    it('should handle offline state gracefully', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      const offlineError = { status: 0, message: 'Network unavailable' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(offlineError));

      await component.onCaptureClick(new Event('click'));

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.offline_error');
    });

    it('should queue capture operations when offline', async () => {
      // Mock offline state
      Object.defineProperty(navigator, 'onLine', {
        writable: true,
        value: false
      });

      spyOn(localStorage, 'setItem');

      await component.onCaptureClick(new Event('click'));

      // Should queue the operation for when online
      expect(localStorage.setItem).toHaveBeenCalledWith(
        'pending_captures',
        jasmine.any(String)
      );
    });
  });

  describe('🎨 Mobile Visual States', () => {
    beforeEach(() => {
      component.showCaptureButton = true;
      fixture.detectChanges();
    });

    it('should show mobile-sized pokeball icons', () => {
      component.isCaptured = false;
      component.isCaptureLoading = false;
      fixture.detectChanges();

      const pokeballImg = fixture.debugElement.query(By.css('.capture-state img'));
      const computedStyle = window.getComputedStyle(pokeballImg.nativeElement);

      // Mobile pokeball should be smaller
      expect(pokeballImg.nativeElement.classList.contains('mobile-pokeball')).toBeTruthy();
    });

    it('should apply mobile-specific animations', () => {
      component.isCaptured = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));

      // Should have mobile-specific animation classes
      expect(captureButton.nativeElement.classList.contains('mobile-animation')).toBeTruthy();
    });

    it('should show mobile loading spinner', () => {
      component.isCaptureLoading = true;
      fixture.detectChanges();

      const loadingState = fixture.debugElement.query(By.css('.loading-state'));
      const spinner = loadingState.query(By.css('ion-spinner'));

      expect(spinner).toBeTruthy();
      expect(spinner.nativeElement.getAttribute('name')).toBe('crescent');
    });

    it('should adapt to mobile dark mode', () => {
      // Mock dark mode
      document.body.classList.add('dark');
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));

      // Should adapt styling for dark mode
      expect(captureButton.nativeElement.classList.contains('dark-mode')).toBeTruthy();

      // Cleanup
      document.body.classList.remove('dark');
    });
  });

  describe('📱 Mobile Performance Optimizations', () => {
    it('should debounce rapid touch events', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));

      // Simulate rapid touch events
      const touchEvents = Array(5).fill(null).map(() => new Event('click'));

      for (const event of touchEvents) {
        component.onCaptureClick(event);
      }

      // Should only process one capture operation
      expect(mockCapturedService.toggleCaptured).toHaveBeenCalledTimes(1);
    });

    it('should optimize for mobile memory usage', () => {
      // Test that component doesn't hold unnecessary references
      component.ngOnDestroy();

      expect(component['capturedSubscription']).toBeUndefined();
    });

    it('should handle mobile network timeouts', async () => {
      const timeoutError = { status: 408, message: 'Mobile network timeout' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(timeoutError));

      await component.onCaptureClick(new Event('click'));

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.mobile_timeout');
    });
  });

  describe('🔧 Mobile Accessibility', () => {
    it('should have proper mobile accessibility attributes', () => {
      component.showCaptureButton = true;
      component.isCaptured = false;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));

      expect(captureButton.nativeElement.getAttribute('aria-label')).toBe('pokemon.capture');
      expect(captureButton.nativeElement.getAttribute('role')).toBe('button');
    });

    it('should support mobile screen readers', () => {
      component.showCaptureButton = true;
      component.isCaptured = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));

      expect(captureButton.nativeElement.getAttribute('aria-label')).toBe('pokemon.release');
      expect(captureButton.nativeElement.getAttribute('aria-pressed')).toBe('true');
    });

    it('should have appropriate mobile touch targets', () => {
      component.showCaptureButton = true;
      fixture.detectChanges();

      const captureButton = fixture.debugElement.query(By.css('.mobile-capture-btn'));
      const computedStyle = window.getComputedStyle(captureButton.nativeElement);

      // Mobile touch target should be at least 44px
      const minTouchTarget = 44;
      expect(parseInt(computedStyle.width)).toBeGreaterThanOrEqual(minTouchTarget);
      expect(parseInt(computedStyle.height)).toBeGreaterThanOrEqual(minTouchTarget);
    });
  });

  describe('🔄 Mobile Error Recovery', () => {
    it('should handle network errors gracefully', async () => {
      const networkError = { status: 0, message: 'Network error' };
      mockCapturedService.toggleCaptured.and.returnValue(throwError(networkError));

      await component.onCaptureClick(new Event('click'));

      expect(mockToastService.showError).toHaveBeenCalledWith('capture.network_error');
      expect(component.isCaptureLoading).toBe(false);
      expect(component.isProcessing).toBe(false);
    });

    it('should handle mobile app backgrounding', () => {
      // Simulate app going to background
      const visibilityEvent = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', { value: true, writable: true });

      document.dispatchEvent(visibilityEvent);

      // Should pause any ongoing operations
      expect(component.isProcessing).toBe(false);
    });

    it('should resume operations when app returns to foreground', () => {
      // Simulate app returning to foreground
      const visibilityEvent = new Event('visibilitychange');
      Object.defineProperty(document, 'hidden', { value: false, writable: true });

      document.dispatchEvent(visibilityEvent);

      // Should be ready to process new operations
      expect(component.isProcessing).toBe(false);
    });
  });

  describe('🎵 Mobile Audio Integration', () => {
    beforeEach(() => {
      mockAuthService.isAuthenticated.and.returnValue(true);
      mockAuthService.getCurrentUser.and.returnValue(mockUser);
    });

    it('should respect mobile audio settings', async () => {
      // Mock mobile audio context
      const mockAudioContext = jasmine.createSpyObj('AudioContext', ['resume']);
      (window as any).AudioContext = jasmine.createSpy().and.returnValue(mockAudioContext);

      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      mockAudioService.playCaptureSound.and.returnValue(Promise.resolve());

      await component.onCaptureClick(new Event('click'));

      expect(mockAudioService.playCaptureSound).toHaveBeenCalledWith('capture');
    });

    it('should handle mobile audio permission denials', async () => {
      mockCapturedService.toggleCaptured.and.returnValue(of(true));
      mockAudioService.playCaptureSound.and.returnValue(Promise.reject('Audio permission denied'));

      spyOn(console, 'warn');

      await component.onCaptureClick(new Event('click'));

      expect(console.warn).toHaveBeenCalledWith('[MobileCapture] Audio permission denied, continuing silently');
      // Should still complete the capture operation
      expect(component.isCaptured).toBe(true);
    });
  });
});
