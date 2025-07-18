import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule, ModalController } from '@ionic/angular';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';

import { DetailsModalComponent } from './details-modal.component';
import { PokemonCacheHelper } from '../../../core/services/pokemon-cache-helper.service';
import { CapturedService } from '../../../core/services/captured.service';
import { ViewedPokemonService } from '../../../core/services/viewed-pokemon.service';
import { Pokemon } from '../../../models/pokemon.model';

describe('DetailsModalComponent', () => {
  let component: DetailsModalComponent;
  let fixture: ComponentFixture<DetailsModalComponent>;
  let mockModalController: jasmine.SpyObj<ModalController>;
  let mockCacheHelper: jasmine.SpyObj<PokemonCacheHelper>;
  let mockCapturedService: jasmine.SpyObj<CapturedService>;
  let mockViewedService: jasmine.SpyObj<ViewedPokemonService>;

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
    const modalSpy = jasmine.createSpyObj('ModalController', ['dismiss']);
    const cacheHelperSpy = jasmine.createSpyObj('PokemonCacheHelper', ['getFlavorTexts']);
    const capturedSpy = jasmine.createSpyObj('CapturedService', ['isCaptured', 'toggleCapture']);
    const viewedSpy = jasmine.createSpyObj('ViewedPokemonService', ['markAsViewed']);

    await TestBed.configureTestingModule({
      declarations: [DetailsModalComponent],
      imports: [
        IonicModule.forRoot(),
        HttpClientTestingModule,
        TranslateModule.forRoot()
      ],
      providers: [
        { provide: ModalController, useValue: modalSpy },
        { provide: PokemonCacheHelper, useValue: cacheHelperSpy },
        { provide: CapturedService, useValue: capturedSpy },
        { provide: ViewedPokemonService, useValue: viewedSpy },
        TranslateService
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(DetailsModalComponent);
    component = fixture.componentInstance;

    mockModalController = TestBed.inject(ModalController) as jasmine.SpyObj<ModalController>;
    mockCacheHelper = TestBed.inject(PokemonCacheHelper) as jasmine.SpyObj<PokemonCacheHelper>;
    mockCapturedService = TestBed.inject(CapturedService) as jasmine.SpyObj<CapturedService>;
    mockViewedService = TestBed.inject(ViewedPokemonService) as jasmine.SpyObj<ViewedPokemonService>;

    component.pokemon = mockPokemon;
    component.pokemonId = 1;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with correct Pokemon data', () => {
    component.ngOnInit();

    expect(component.pokemon).toEqual(mockPokemon);
    expect(component.pokemonId).toBe(1);
  });

  it('should fetch flavor texts on initialization', () => {
    const mockFlavorTexts = ['Bulbasaur flavor text 1', 'Bulbasaur flavor text 2'];
    mockCacheService.getFlavorTexts.and.returnValue(of(mockFlavorTexts));

    component.ngOnInit();

    expect(mockCacheService.getFlavorTexts).toHaveBeenCalledWith(1, 'pt-BR');
    expect(component.flavorTexts).toEqual(mockFlavorTexts);
    expect(component.flavorText).toBe(mockFlavorTexts[0]);
  });

  it('should navigate between flavor texts correctly', () => {
    component.flavorTexts = ['Text 1', 'Text 2', 'Text 3'];
    component.currentFlavorIndex = 0;

    component.nextFlavor();
    expect(component.currentFlavorIndex).toBe(1);

    component.previousFlavor();
    expect(component.currentFlavorIndex).toBe(0);
  });

  it('should not navigate beyond flavor text boundaries', () => {
    component.flavorTexts = ['Text 1', 'Text 2'];
    component.currentFlavorIndex = 1;

    component.nextFlavor();
    expect(component.currentFlavorIndex).toBe(1); // Should not exceed array length

    component.currentFlavorIndex = 0;
    component.previousFlavor();
    expect(component.currentFlavorIndex).toBe(0); // Should not go below 0
  });

  it('should return current flavor text correctly', () => {
    component.flavorTexts = ['First text', 'Second text'];
    component.currentFlavorIndex = 1;

    const currentText = component.getCurrentFlavorText();
    expect(currentText).toBe('Second text');
  });

  it('should handle empty flavor texts gracefully', () => {
    component.flavorTexts = [];

    const currentText = component.getCurrentFlavorText();
    expect(currentText).toContain('NO_FLAVOR_TEXT_AVAILABLE');
  });

  it('should animate flavor text transitions', () => {
    spyOn(component, 'animateFlavorTransition').and.callThrough();
    component.flavorTexts = ['Text 1', 'Text 2'];
    component.currentFlavorIndex = 0;

    component.nextFlavor();

    expect(component.animateFlavorTransition).toHaveBeenCalled();
  });

  it('should close modal when closeModal is called', () => {
    component.closeModal();

    expect(mockModalController.dismiss).toHaveBeenCalled();
  });

  it('should mark Pokemon as viewed on initialization', () => {
    component.ngOnInit();

    expect(mockViewedService.markAsViewed).toHaveBeenCalledWith(mockPokemon);
  });

  it('should calculate stat percentages correctly', () => {
    const percentage = component.getStatPercentage(127);
    expect(percentage).toBe(49.8); // (127 / 255) * 100 ≈ 49.8
  });

  it('should handle maximum stat values correctly', () => {
    const percentage = component.getStatPercentage(255);
    expect(percentage).toBe(100);
  });

  it('should handle stat values above maximum correctly', () => {
    const percentage = component.getStatPercentage(300);
    expect(percentage).toBe(100); // Should cap at 100%
  });

  it('should check scroll indicator correctly', () => {
    spyOn(component, 'checkScrollIndicator').and.callThrough();

    component.resetScrollAndCheckIndicator();

    expect(component.checkScrollIndicator).toHaveBeenCalled();
  });

  it('should handle flavor text scroll events', () => {
    const mockEvent = {
      target: {
        scrollTop: 100,
        scrollHeight: 200,
        clientHeight: 100
      }
    };

    component.onFlavorTextScroll(mockEvent);

    // Should handle scroll without errors
    expect(component).toBeTruthy();
  });

  it('should ensure valid image fallback', () => {
    const validImage = component.ensureValidImage();

    expect(validImage).toBeTruthy();
    expect(typeof validImage).toBe('string');
  });

  it('should handle loading states correctly', () => {
    component.isLoadingFlavor = true;
    fixture.detectChanges();

    expect(component.isLoadingFlavor).toBeTruthy();

    component.isLoadingFlavor = false;
    fixture.detectChanges();

    expect(component.isLoadingFlavor).toBeFalsy();
  });

  it('should destroy subscriptions on component destroy', () => {
    spyOn(component['destroy$'], 'next');
    spyOn(component['destroy$'], 'complete');

    component.ngOnDestroy();

    expect(component['destroy$'].next).toHaveBeenCalled();
    expect(component['destroy$'].complete).toHaveBeenCalled();
  });
});
