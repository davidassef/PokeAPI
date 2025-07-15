import { ComponentFixture, TestBed } from '@angular/core/testing';
import { IonicModule } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DebugElement } from '@angular/core';
import { By } from '@angular/platform-browser';

import { PokemonCardComponent } from './pokemon-card.component';
import { Pokemon } from '../../../models/pokemon.model';

describe('PokemonCardComponent', () => {
  let component: PokemonCardComponent;
  let fixture: ComponentFixture<PokemonCardComponent>;
  let debugElement: DebugElement;

  const mockPokemon: Pokemon = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    base_experience: 64,
    order: 1,
    is_default: true,
    location_area_encounters: '',
    sprites: {
      front_default: 'https://example.com/bulbasaur.png',
      front_shiny: 'https://example.com/bulbasaur-shiny.png',
      other: {
        'official-artwork': {
          front_default: 'https://example.com/bulbasaur-artwork.png'
        }
      }
    },
    abilities: [
      {
        ability: {
          name: 'overgrow',
          url: 'https://pokeapi.co/api/v2/ability/65/'
        },
        is_hidden: false,
        slot: 1
      }
    ],
    types: [
      {
        slot: 1,
        type: {
          name: 'grass',
          url: 'https://pokeapi.co/api/v2/type/12/'
        }
      },
      {
        slot: 2,
        type: {
          name: 'poison',
          url: 'https://pokeapi.co/api/v2/type/4/'
        }
      }
    ],
    stats: [
      {
        base_stat: 45,
        effort: 0,
        stat: {
          name: 'hp',
          url: 'https://pokeapi.co/api/v2/stat/1/'
        }
      }
    ],
    species: {
      name: 'bulbasaur',
      url: 'https://pokeapi.co/api/v2/pokemon-species/1/'
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PokemonCardComponent],
      imports: [
        IonicModule.forRoot(),
        TranslateModule.forRoot()
      ],
      providers: [TranslateService]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonCardComponent);
    component = fixture.componentInstance;
    debugElement = fixture.debugElement;
    
    component.pokemon = mockPokemon;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should display Pokemon name correctly', () => {
    const nameElement = debugElement.query(By.css('.pokemon-name'));
    expect(nameElement.nativeElement.textContent.trim()).toBe('Bulbasaur');
  });

  it('should display Pokemon number with correct formatting', () => {
    const numberElement = debugElement.query(By.css('.pokemon-number'));
    expect(numberElement.nativeElement.textContent.trim()).toBe('#001');
  });

  it('should display Pokemon types', () => {
    const typeElements = debugElement.queryAll(By.css('.type-badge'));
    expect(typeElements.length).toBe(2);
  });

  it('should show capture button when showCaptureButton is true', () => {
    component.showCaptureButton = true;
    fixture.detectChanges();
    
    const captureButton = debugElement.query(By.css('.capture-btn'));
    expect(captureButton).toBeTruthy();
  });

  it('should hide capture button when showCaptureButton is false', () => {
    component.showCaptureButton = false;
    fixture.detectChanges();
    
    const captureButton = debugElement.query(By.css('.capture-btn'));
    expect(captureButton).toBeFalsy();
  });

  it('should emit cardClick event when card is clicked', () => {
    spyOn(component.cardClick, 'emit');
    
    const cardElement = debugElement.query(By.css('.pokemon-card'));
    cardElement.nativeElement.click();
    
    expect(component.cardClick.emit).toHaveBeenCalledWith(mockPokemon);
  });

  it('should emit captureToggle event when capture button is clicked', () => {
    spyOn(component.captureToggle, 'emit');
    component.showCaptureButton = true;
    fixture.detectChanges();
    
    const captureButton = debugElement.query(By.css('.capture-btn'));
    captureButton.nativeElement.click();
    
    expect(component.captureToggle.emit).toHaveBeenCalledWith({
      pokemon: mockPokemon,
      isCaptured: component.isCaptured
    });
  });

  it('should show correct capture state visual feedback', () => {
    component.showCaptureButton = true;
    component.isCaptured = false;
    fixture.detectChanges();
    
    const captureState = debugElement.query(By.css('.capture-state'));
    expect(captureState).toBeTruthy();
    
    const capturedState = debugElement.query(By.css('.captured-state'));
    expect(capturedState).toBeFalsy();
  });

  it('should show correct captured state visual feedback', () => {
    component.showCaptureButton = true;
    component.isCaptured = true;
    fixture.detectChanges();
    
    const capturedState = debugElement.query(By.css('.captured-state'));
    expect(capturedState).toBeTruthy();
    
    const captureState = debugElement.query(By.css('.capture-state'));
    expect(captureState).toBeFalsy();
  });

  it('should show loading state when isLoading is true', () => {
    component.showCaptureButton = true;
    component.isLoading = true;
    fixture.detectChanges();
    
    const loadingState = debugElement.query(By.css('.loading-state'));
    expect(loadingState).toBeTruthy();
    
    const spinner = debugElement.query(By.css('ion-spinner'));
    expect(spinner).toBeTruthy();
  });

  it('should disable capture button when loading', () => {
    component.showCaptureButton = true;
    component.isLoading = true;
    fixture.detectChanges();
    
    const captureButton = debugElement.query(By.css('.capture-btn'));
    expect(captureButton.nativeElement.disabled).toBeTruthy();
  });

  it('should apply captured class when Pokemon is captured', () => {
    component.showCaptureButton = true;
    component.isCaptured = true;
    fixture.detectChanges();
    
    const captureButton = debugElement.query(By.css('.capture-btn'));
    expect(captureButton.nativeElement.classList.contains('captured')).toBeTruthy();
  });

  it('should apply capturing class when loading', () => {
    component.showCaptureButton = true;
    component.isLoading = true;
    fixture.detectChanges();
    
    const captureButton = debugElement.query(By.css('.capture-btn'));
    expect(captureButton.nativeElement.classList.contains('capturing')).toBeTruthy();
  });

  it('should display favorite count badge when provided', () => {
    component.favoriteCount = 42;
    fixture.detectChanges();
    
    const favoriteBadge = debugElement.query(By.css('.capture-count-badge'));
    expect(favoriteBadge).toBeTruthy();
    expect(favoriteBadge.nativeElement.textContent.trim()).toContain('42');
  });

  it('should display custom ranking badge when provided', () => {
    component.customBadge = 3;
    fixture.detectChanges();
    
    const rankingBadge = debugElement.query(By.css('.grid-badge'));
    expect(rankingBadge).toBeTruthy();
    expect(rankingBadge.nativeElement.textContent.trim()).toBe('3');
  });

  it('should format Pokemon number correctly for different IDs', () => {
    expect(component.formatPokemonNumber(1)).toBe('#001');
    expect(component.formatPokemonNumber(25)).toBe('#025');
    expect(component.formatPokemonNumber(150)).toBe('#150');
    expect(component.formatPokemonNumber(1000)).toBe('#1000');
  });

  it('should capitalize Pokemon name correctly', () => {
    expect(component.capitalizeName('bulbasaur')).toBe('Bulbasaur');
    expect(component.capitalizeName('PIKACHU')).toBe('Pikachu');
    expect(component.capitalizeName('mr-mime')).toBe('Mr-mime');
  });

  it('should prevent event propagation when capture button is clicked', () => {
    spyOn(component.captureToggle, 'emit');
    component.showCaptureButton = true;
    fixture.detectChanges();
    
    const captureButton = debugElement.query(By.css('.capture-btn'));
    const clickEvent = new Event('click');
    spyOn(clickEvent, 'stopPropagation');
    
    captureButton.nativeElement.dispatchEvent(clickEvent);
    
    expect(clickEvent.stopPropagation).toHaveBeenCalled();
  });
});
