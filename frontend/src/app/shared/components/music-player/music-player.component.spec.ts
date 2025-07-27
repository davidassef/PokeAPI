import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MusicPlayerComponent } from './music-player.component';
import { AudioService } from '../../../core/services/audio.service';
import { SettingsService } from '../../../core/services/settings.service';

describe('MusicPlayerComponent - Volume Control Bug Fix', () => {
  let component: MusicPlayerComponent;
  let fixture: ComponentFixture<MusicPlayerComponent>;
  let audioService: jasmine.SpyObj<AudioService>;
  let settingsService: jasmine.SpyObj<SettingsService>;

  beforeEach(async () => {
    const audioServiceSpy = jasmine.createSpyObj('AudioService', ['setVolume']);
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['saveSettings']);

    await TestBed.configureTestingModule({
      declarations: [MusicPlayerComponent],
      providers: [
        { provide: AudioService, useValue: audioServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MusicPlayerComponent);
    component = fixture.componentInstance;
    audioService = TestBed.inject(AudioService) as jasmine.SpyObj<AudioService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
  });

  describe('setVolume() - Bug Fix Tests', () => {
    it('deve aplicar volume ao AudioService sempre, independente do estado de mute', () => {
      // Arrange
      component.isMuted = true; // Simula estado mutado
      const mockEvent = { detail: { value: 50 } }; // 50% volume

      // Act
      component.setVolume(mockEvent);

      // Assert
      expect(audioService.setVolume).toHaveBeenCalledWith(0.5);
      expect(component.volume).toBe(0.5);
    });

    it('deve desmutar automaticamente quando volume > 0', () => {
      // Arrange
      component.isMuted = true;
      const mockEvent = { detail: { value: 75 } }; // 75% volume

      // Act
      component.setVolume(mockEvent);

      // Assert
      expect(component.isMuted).toBe(false);
      expect(settingsService.saveSettings).toHaveBeenCalledWith({
        musicEnabled: true,
        musicVolume: 0.75
      });
    });

    it('deve mutar automaticamente quando volume = 0', () => {
      // Arrange
      component.isMuted = false;
      const mockEvent = { detail: { value: 0 } }; // 0% volume

      // Act
      component.setVolume(mockEvent);

      // Assert
      expect(component.isMuted).toBe(true);
      expect(settingsService.saveSettings).toHaveBeenCalledWith({
        musicEnabled: false,
        musicVolume: 0
      });
    });

    it('deve manter volume padrão de 50% (0.5)', () => {
      // Assert
      expect(component.volume).toBe(0.5);
    });

    it('deve aplicar volume corretamente em diferentes valores', () => {
      const testCases = [
        { input: 25, expected: 0.25 },
        { input: 50, expected: 0.5 },
        { input: 75, expected: 0.75 },
        { input: 100, expected: 1.0 }
      ];

      testCases.forEach(testCase => {
        // Arrange
        const mockEvent = { detail: { value: testCase.input } };

        // Act
        component.setVolume(mockEvent);

        // Assert
        expect(audioService.setVolume).toHaveBeenCalledWith(testCase.expected);
        expect(component.volume).toBe(testCase.expected);
      });
    });
  });

  describe('toggleMute() - Funcionalidade independente', () => {
    it('deve continuar funcionando independentemente das correções de volume', () => {
      // Arrange
      component.isMuted = false;
      component.volume = 0.7;

      // Act
      component.toggleMute();

      // Assert
      expect(component.isMuted).toBe(true);
      expect(audioService.setVolume).toHaveBeenCalledWith(0);
      expect(settingsService.saveSettings).toHaveBeenCalledWith({ musicEnabled: false });
    });

    it('deve restaurar volume ao desmutar', () => {
      // Arrange
      component.isMuted = true;
      component.volume = 0.6;

      // Act
      component.toggleMute();

      // Assert
      expect(component.isMuted).toBe(false);
      expect(audioService.setVolume).toHaveBeenCalledWith(0.6);
      expect(settingsService.saveSettings).toHaveBeenCalledWith({ musicEnabled: true });
    });
  });
});
