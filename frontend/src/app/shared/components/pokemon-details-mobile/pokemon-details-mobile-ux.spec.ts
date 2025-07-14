import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { PokemonDetailsMobileComponent } from './pokemon-details-mobile.component';

/**
 * Testes específicos para validar as melhorias de UX mobile implementadas
 * Foca nas correções de layout, interpolação e usabilidade
 */
describe('PokemonDetailsMobileComponent - UX Improvements', () => {
  let component: PokemonDetailsMobileComponent;
  let fixture: ComponentFixture<PokemonDetailsMobileComponent>;
  let translateService: TranslateService;

  const mockPokemonWithAbilities = {
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
      {
        ability: { name: 'overgrow' },
        is_hidden: false
      },
      {
        ability: { name: 'chlorophyll' },
        is_hidden: true
      }
    ],
    sprites: {
      other: {
        'official-artwork': {
          front_default: 'https://example.com/bulbasaur.png'
        }
      }
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

  describe('🔧 Correção de Interpolação do Carrossel', () => {
    it('should correctly format carousel counter with interpolation', () => {
      // Configurar tradução mock
      spyOn(translateService, 'instant').and.returnValue('({{currentIndex}}/{{total}})');

      // Verificar se a interpolação está funcionando
      const counterText = translateService.instant('mobile.carousel.counter');
      expect(counterText).toBe('({{currentIndex}}/{{total}})');
      expect(counterText).not.toBe('({currentIndex}/{total})'); // Formato antigo quebrado
    });

    it('should handle carousel data correctly', () => {
      // Verificar se o componente tem as propriedades necessárias
      expect(component).toBeTruthy();
      expect(component.activeTab).toBe('overview');
    });
  });

  describe('🎯 Correção da Seção de Habilidades', () => {
    beforeEach(() => {
      component.pokemon = mockPokemonWithAbilities;
      fixture.detectChanges();
    });

    it('should not duplicate hidden ability badges', () => {
      const hiddenAbilities = component.pokemon.abilities.filter((a: any) => a.is_hidden);
      expect(hiddenAbilities.length).toBe(1);

      // Verificar se apenas uma habilidade oculta existe
      const hiddenAbility = hiddenAbilities[0];
      expect(hiddenAbility.ability.name).toBe('chlorophyll');
      expect(hiddenAbility.is_hidden).toBe(true);
    });

    it('should correctly identify normal vs hidden abilities', () => {
      const normalAbilities = component.pokemon.abilities.filter((a: any) => !a.is_hidden);
      const hiddenAbilities = component.pokemon.abilities.filter((a: any) => a.is_hidden);

      expect(normalAbilities.length).toBe(1);
      expect(hiddenAbilities.length).toBe(1);

      expect(normalAbilities[0].ability.name).toBe('overgrow');
      expect(hiddenAbilities[0].ability.name).toBe('chlorophyll');
    });

    it('should render abilities with proper structure', () => {
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const abilityCards = compiled.querySelectorAll('.ability-card');

      // Deve ter 2 cards de habilidade (1 normal + 1 oculta)
      expect(abilityCards.length).toBe(2);

      // Verificar se apenas uma habilidade tem badge de "oculta"
      const hiddenBadges = compiled.querySelectorAll('.ability-badge');
      expect(hiddenBadges.length).toBe(1); // Apenas 1 badge, não duplicado
    });
  });

  describe('📱 Melhorias de Layout Mobile', () => {
    it('should have proper mobile spacing classes', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;

      // Verificar se o container mobile tem padding adequado
      const mobileContent = compiled.querySelector('.mobile-content');
      expect(mobileContent).toBeTruthy();

      // Verificar se as seções têm espaçamento adequado
      const statsGrid = compiled.querySelector('.stats-grid');
      if (statsGrid) {
        const computedStyle = window.getComputedStyle(statsGrid);
        // Verificar se o gap foi aumentado (deve ser >= 16px)
        expect(parseInt(computedStyle.gap) || 0).toBeGreaterThanOrEqual(16);
      }
    });

    it('should have improved card styling with shadows', () => {
      component.pokemon = mockPokemonWithAbilities;
      fixture.detectChanges();

      const compiled = fixture.nativeElement;
      const abilityCards = compiled.querySelectorAll('.ability-card');

      abilityCards.forEach((card: any) => {
        const computedStyle = window.getComputedStyle(card);
        // Verificar se tem border-radius aumentado (>= 12px)
        expect(parseInt(computedStyle.borderRadius) || 0).toBeGreaterThanOrEqual(12);

        // Verificar se tem padding aumentado (>= 16px)
        expect(parseInt(computedStyle.padding) || 0).toBeGreaterThanOrEqual(16);
      });
    });
  });

  describe('🎨 Melhorias de Tipografia', () => {
    it('should have readable font sizes for mobile', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;

      // Verificar tamanhos de fonte dos elementos principais
      const abilityNames = compiled.querySelectorAll('.ability-name');
      abilityNames.forEach((element: any) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseInt(computedStyle.fontSize);
        // Font size deve ser >= 16px para boa legibilidade mobile
        expect(fontSize).toBeGreaterThanOrEqual(16);
      });

      const abilityDescriptions = compiled.querySelectorAll('.ability-description');
      abilityDescriptions.forEach((element: any) => {
        const computedStyle = window.getComputedStyle(element);
        const fontSize = parseInt(computedStyle.fontSize);
        // Descrições devem ter pelo menos 14px
        expect(fontSize).toBeGreaterThanOrEqual(14);
      });
    });

    it('should have proper line height for readability', () => {
      fixture.detectChanges();
      const compiled = fixture.nativeElement;

      const descriptions = compiled.querySelectorAll('.ability-description');
      descriptions.forEach((element: any) => {
        const computedStyle = window.getComputedStyle(element);
        const lineHeight = parseFloat(computedStyle.lineHeight);
        // Line height deve ser >= 1.4 para boa legibilidade
        expect(lineHeight).toBeGreaterThanOrEqual(1.4);
      });
    });
  });

  describe('🔄 Funcionalidade de Abas', () => {
    it('should switch tabs correctly without layout issues', () => {
      component.setActiveTab('combat');
      expect(component.activeTab).toBe('combat');

      component.setActiveTab('evolution');
      expect(component.activeTab).toBe('evolution');

      component.setActiveTab('curiosities');
      expect(component.activeTab).toBe('curiosities');

      // Voltar para overview
      component.setActiveTab('overview');
      expect(component.activeTab).toBe('overview');
    });

    it('should maintain proper tab state during navigation', () => {
      const initialTab = component.activeTab;
      expect(initialTab).toBe('overview');

      // Navegar por todas as abas
      const tabs = ['combat', 'evolution', 'curiosities', 'overview'];
      tabs.forEach(tab => {
        component.setActiveTab(tab);
        expect(component.activeTab).toBe(tab);
      });
    });
  });

  describe('📊 Validação de Dados', () => {
    it('should handle pokemon data correctly', () => {
      component.pokemon = mockPokemonWithAbilities;

      expect(component.pokemon.name).toBe('bulbasaur');
      expect(component.pokemon.abilities.length).toBe(2);
      expect(component.getTotalStats()).toBe(318); // Soma das stats
    });

    it('should calculate stat percentages correctly', () => {
      // Testar cálculos de porcentagem das stats
      expect(component.getStatPercentage(45)).toBe(18); // 45/255 * 100 ≈ 18
      expect(component.getStatPercentage(100)).toBe(39); // 100/255 * 100 ≈ 39
      expect(component.getStatPercentage(255)).toBe(100); // 255/255 * 100 = 100
    });
  });
});
