import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { IonicModule } from '@ionic/angular';
import { of, throwError } from 'rxjs';

import { HomePage } from './home.page';
import { PokemonService } from '../../../core/services/pokemon.service';
import { AuthService } from '../../../core/services/auth.service';
import { SettingsService } from '../../../core/services/settings.service';
import { Pokemon } from '../../../models/pokemon.model';

describe('HomePage (Mobile)', () => {
  let component: HomePage;
  let fixture: ComponentFixture<HomePage>;
  let pokemonService: jasmine.SpyObj<PokemonService>;
  let authService: jasmine.SpyObj<AuthService>;
  let settingsService: jasmine.SpyObj<SettingsService>;

  const mockPokemonList = [
    {
      id: 1,
      name: 'bulbasaur',
      types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
      sprites: {
        other: {
          'official-artwork': {
            front_default: 'https://example.com/bulbasaur.png'
          }
        }
      }
    },
    {
      id: 2,
      name: 'ivysaur',
      types: [{ type: { name: 'grass' } }, { type: { name: 'poison' } }],
      sprites: {
        other: {
          'official-artwork': {
            front_default: 'https://example.com/ivysaur.png'
          }
        }
      }
    }
  ];

  const mockUser = {
    id: 1,
    username: 'testuser',
    email: 'test@example.com',
    role: 'visitor'
  };

  beforeEach(async () => {
    const pokemonServiceSpy = jasmine.createSpyObj('PokemonService', [
      'getPokemonList',
      'searchPokemon',
      'getRandomPokemon'
    ]);
    const authServiceSpy = jasmine.createSpyObj('AuthService', ['getCurrentUser'], {
      currentUser$: of(mockUser)
    });
    const settingsServiceSpy = jasmine.createSpyObj('SettingsService', ['getCurrentSettings'], {
      settings$: of({ language: 'pt-BR', theme: 'light' })
    });

    await TestBed.configureTestingModule({
      declarations: [HomePage],
      imports: [
        HttpClientTestingModule,
        TranslateModule.forRoot(),
        IonicModule.forRoot()
      ],
      providers: [
        { provide: PokemonService, useValue: pokemonServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: SettingsService, useValue: settingsServiceSpy }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HomePage);
    component = fixture.componentInstance;
    pokemonService = TestBed.inject(PokemonService) as jasmine.SpyObj<PokemonService>;
    authService = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    settingsService = TestBed.inject(SettingsService) as jasmine.SpyObj<SettingsService>;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    expect(component.pokemon).toEqual([]);
    expect(component.loading).toBeFalse();
    expect(component.showDetailsModal).toBeFalse();
    expect(component.selectedPokemonId).toBeNull();
    expect(component.currentPage).toBe(1);
    expect(component.pokemonPerPage).toBe(8);
  });

  it('should call ngOnInit without errors', () => {
    spyOn(component, 'loadPaginatedPokemons');
    spyOn(component, 'loadCaptured');

    component.ngOnInit();

    expect(component.loadPaginatedPokemons).toHaveBeenCalled();
    expect(component.loadCaptured).toHaveBeenCalled();
  });

  it('should open details modal with correct pokemon ID', () => {
    spyOn(console, 'log');

    component.openDetailsModal(25);

    expect(component.selectedPokemonId).toBe(25);
    expect(component.showDetailsModal).toBeTrue();
    expect(console.log).toHaveBeenCalledWith(
      '🔍 Mobile Home - openDetailsModal chamado:',
      jasmine.objectContaining({ pokemonId: 25 })
    );
  });

  it('should close details modal', () => {
    component.showDetailsModal = true;
    component.selectedPokemonId = 25;

    component.closeDetailsModal();

    expect(component.showDetailsModal).toBeFalse();
    expect(component.selectedPokemonId).toBeNull();
  });

  it('should handle filter changes', () => {
    const newFilters = {
      name: 'pikachu',
      elementTypes: ['electric'],
      movementTypes: [],
      generation: 1,
      sortBy: 'name',
      sortOrder: 'asc'
    };

    component.onFiltersChanged(newFilters);

    expect(component.currentFilters).toEqual(newFilters);
  });

  it('should toggle search visibility', () => {
    expect(component.showSearch).toBeFalse();

    component.toggleSearch();

    expect(component.showSearch).toBeTrue();
  });

  it('should track pokemon by ID', () => {
    const pokemon = mockPokemonList[0] as any;

    const result = component.trackByPokemonId(0, pokemon);

    expect(result).toBe(pokemon.id);
  });
});
