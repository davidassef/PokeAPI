import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { PokemonDetailsMobileComponent } from './pokemon-details-mobile.component';

describe('PokemonDetailsMobileComponent', () => {
  let component: PokemonDetailsMobileComponent;
  let fixture: ComponentFixture<PokemonDetailsMobileComponent>;
  let translateService: TranslateService;

  const mockPokemon = {
    id: 1,
    name: 'bulbasaur',
    height: 7,
    weight: 69,
    base_experience: 64,
    types: [
      { type: { name: 'grass' } },
      { type: { name: 'poison' } }
    ],
    stats: [
      { base_stat: 45, stat: { name: 'hp' } },
      { base_stat: 49, stat: { name: 'attack' } },
      { base_stat: 49, stat: { name: 'defense' } },
      { base_stat: 65, stat: { name: 'special-attack' } },
      { base_stat: 65, stat: { name: 'special-defense' } },
      { base_stat: 45, stat: { name: 'speed' } }
    ],
    abilities: [
      { ability: { name: 'overgrow' }, is_hidden: false },
      { ability: { name: 'chlorophyll' }, is_hidden: true }
    ],
    sprites: {
      other: {
        'official-artwork': {
          front_default: 'https://example.com/bulbasaur.png'
        }
      }
    }
  };

  const mockSpecies = {
    flavor_text_entries: [
      {
        flavor_text: 'A strange seed was planted on its back at birth.',
        language: { name: 'en' },
        version: { name: 'red' }
      }
    ],
    evolution_chain: {
      url: 'https://pokeapi.co/api/v2/evolution-chain/1/'
    },
    capture_rate: 45,
    color: { name: 'green' }
  };

  const mockEvolutionChain = {
    chain: {
      species: { name: 'bulbasaur', url: 'https://pokeapi.co/api/v2/pokemon-species/1/' },
      evolution_details: [],
      evolves_to: [
        {
          species: { name: 'ivysaur', url: 'https://pokeapi.co/api/v2/pokemon-species/2/' },
          evolution_details: [{ min_level: 16, trigger: { name: 'level-up' } }],
          evolves_to: [
            {
              species: { name: 'venusaur', url: 'https://pokeapi.co/api/v2/pokemon-species/3/' },
              evolution_details: [{ min_level: 32, trigger: { name: 'level-up' } }],
              evolves_to: []
            }
          ]
        }
      ]
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [PokemonDetailsMobileComponent],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        IonicModule.forRoot()
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(PokemonDetailsMobileComponent);
    component = fixture.componentInstance;
    translateService = TestBed.inject(TranslateService);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.isOpen).toBeFalse();
    expect(component.pokemonId).toBe(0);
    expect(component.activeTab).toBe('overview');
    expect(component.pokemon).toBeNull();
    expect(component.evolutionChain).toEqual([]);
    expect(component.flavorTexts).toEqual([]);
  });

  it('should set active tab correctly', () => {
    component.setActiveTab('combat');
    expect(component.activeTab).toBe('combat');

    component.setActiveTab('evolution');
    expect(component.activeTab).toBe('evolution');

    component.setActiveTab('curiosities');
    expect(component.activeTab).toBe('curiosities');
  });

  it('should calculate stat percentage correctly', () => {
    expect(component.getStatPercentage(45)).toBe(18); // 45/255 * 100 ≈ 18
    expect(component.getStatPercentage(100)).toBe(39); // 100/255 * 100 ≈ 39
    expect(component.getStatPercentage(255)).toBe(100); // 255/255 * 100 = 100
  });

  it('should calculate total stats correctly', () => {
    component.pokemon = mockPokemon;
    const total = component.getTotalStats();
    expect(total).toBe(318); // 45+49+49+65+65+45 = 318
  });

  it('should get stat color based on value', () => {
    expect(component.getStatColor(100)).toBe('#4ade80'); // Verde para >= 100
    expect(component.getStatColor(80)).toBe('#fbbf24');  // Amarelo para >= 70
    expect(component.getStatColor(50)).toBe('#fb923c');  // Laranja para >= 40
    expect(component.getStatColor(30)).toBe('#ef4444');  // Vermelho para < 40
  });

  it('should translate stat names correctly', () => {
    spyOn(translateService, 'instant').and.returnValue('Vida');
    
    const result = component.getTranslatedStatName('hp');
    expect(translateService.instant).toHaveBeenCalledWith('stats.hp');
    expect(result).toBe('Vida');
  });

  it('should get ability description', () => {
    spyOn(translateService, 'instant').and.returnValue('Supercrescimento');
    
    const result = component.getAbilityDescription('overgrow');
    expect(translateService.instant).toHaveBeenCalledWith('abilities.overgrow');
    expect(result).toBe('Supercrescimento');
  });

  it('should check if evolution chain is ready', () => {
    component.evolutionChain = [];
    expect(component.isEvolutionChainReady()).toBeFalse();

    component.evolutionChain = [{ id: 1, name: 'bulbasaur' }];
    expect(component.isEvolutionChainReady()).toBeTrue();
  });

  it('should get capture rate from species data', () => {
    component.pokemonSpecies = mockSpecies;
    expect(component.getCaptureRate()).toBe('45');

    component.pokemonSpecies = null;
    expect(component.getCaptureRate()).toBe('N/A');
  });

  it('should get pokemon color from species data', () => {
    component.pokemonSpecies = mockSpecies;
    spyOn(translateService, 'instant').and.returnValue('Verde');
    
    const result = component.getPokemonColor();
    expect(translateService.instant).toHaveBeenCalledWith('pokemon.colors.green');
    expect(result).toBe('Verde');
  });

  it('should emit modalClosed when closeModal is called', () => {
    spyOn(component.modalClosed, 'emit');
    
    component.closeModal();
    expect(component.modalClosed.emit).toHaveBeenCalled();
  });

  it('should handle backdrop click correctly', () => {
    spyOn(component, 'closeModal');
    
    const mockEvent = {
      target: { classList: { contains: () => true } }
    } as any;
    
    component.onBackdropClick(mockEvent);
    expect(component.closeModal).toHaveBeenCalled();
  });

  it('should not close on non-backdrop click', () => {
    spyOn(component, 'closeModal');
    
    const mockEvent = {
      target: { classList: { contains: () => false } }
    } as any;
    
    component.onBackdropClick(mockEvent);
    expect(component.closeModal).not.toHaveBeenCalled();
  });

  it('should extract pokemon ID from URL correctly', () => {
    const url = 'https://pokeapi.co/api/v2/pokemon-species/25/';
    const result = component['extractPokemonIdFromUrl'](url);
    expect(result).toBe(25);
  });

  it('should handle image error', () => {
    spyOn(console, 'warn');
    
    const mockEvent = {
      target: { src: 'invalid-url.png' }
    };
    
    component.onImageError(mockEvent);
    expect(console.warn).toHaveBeenCalledWith('Erro ao carregar imagem:', 'invalid-url.png');
  });
});
