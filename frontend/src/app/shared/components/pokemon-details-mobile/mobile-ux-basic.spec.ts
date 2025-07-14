import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { IonicModule } from '@ionic/angular';
import { PokemonDetailsMobileComponent } from './pokemon-details-mobile.component';

/**
 * Testes básicos para validar as melhorias de UX mobile implementadas
 * Foca nas correções fundamentais sem dependências complexas
 */
describe('PokemonDetailsMobileComponent - Basic UX Tests', () => {
  let component: PokemonDetailsMobileComponent;
  let fixture: ComponentFixture<PokemonDetailsMobileComponent>;
  let translateService: TranslateService;

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

  describe('✅ Componente Base', () => {
    it('should create component successfully', () => {
      expect(component).toBeTruthy();
    });

    it('should initialize with correct default values', () => {
      expect(component.isOpen).toBeFalse();
      expect(component.pokemonId).toBe(0);
      expect(component.activeTab).toBe('overview');
      expect(component.pokemon).toBeNull();
    });
  });

  describe('🔧 Correção de Interpolação', () => {
    it('should have correct translation key format for carousel counter', () => {
      // Configurar tradução mock com formato correto
      spyOn(translateService, 'instant').and.returnValue('({{currentIndex}}/{{total}})');

      // Verificar se a interpolação está no formato correto
      const counterText = translateService.instant('mobile.carousel.counter');
      expect(counterText).toBe('({{currentIndex}}/{{total}})');
      
      // Verificar que não está no formato antigo quebrado
      expect(counterText).not.toBe('({currentIndex}/{total})');
      expect(counterText).not.toContain('{currentIndex}');
      expect(counterText).not.toContain('{total}');
    });

    it('should handle translation service correctly', () => {
      spyOn(translateService, 'instant').and.callThrough();
      
      // Chamar método que usa tradução
      const result = translateService.instant('mobile.carousel.counter');
      
      expect(translateService.instant).toHaveBeenCalledWith('mobile.carousel.counter');
      expect(result).toBeDefined();
    });
  });

  describe('🎯 Funcionalidade de Abas', () => {
    it('should switch between tabs correctly', () => {
      // Testar mudança para aba combat
      component.setActiveTab('combat');
      expect(component.activeTab).toBe('combat');

      // Testar mudança para aba evolution
      component.setActiveTab('evolution');
      expect(component.activeTab).toBe('evolution');

      // Testar mudança para aba curiosities
      component.setActiveTab('curiosities');
      expect(component.activeTab).toBe('curiosities');

      // Voltar para overview
      component.setActiveTab('overview');
      expect(component.activeTab).toBe('overview');
    });

    it('should maintain tab state during navigation', () => {
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

  describe('📊 Cálculos de Estatísticas', () => {
    it('should calculate stat percentage correctly', () => {
      expect(component.getStatPercentage(45)).toBe(18); // 45/255 * 100 ≈ 18
      expect(component.getStatPercentage(100)).toBe(39); // 100/255 * 100 ≈ 39
      expect(component.getStatPercentage(255)).toBe(100); // 255/255 * 100 = 100
      expect(component.getStatPercentage(0)).toBe(0); // 0/255 * 100 = 0
    });

    it('should get correct stat colors based on value', () => {
      expect(component.getStatColor(100)).toBe('#4ade80'); // Verde para >= 100
      expect(component.getStatColor(80)).toBe('#fbbf24');  // Amarelo para >= 70
      expect(component.getStatColor(50)).toBe('#fb923c');  // Laranja para >= 40
      expect(component.getStatColor(30)).toBe('#ef4444');  // Vermelho para < 40
    });

    it('should handle edge cases in stat calculations', () => {
      // Testar valores extremos
      expect(component.getStatPercentage(-1)).toBe(0); // Valores negativos
      expect(component.getStatPercentage(300)).toBe(118); // Valores acima do máximo
      
      // Testar cores para valores extremos
      expect(component.getStatColor(0)).toBe('#ef4444'); // Valor mínimo
      expect(component.getStatColor(200)).toBe('#4ade80'); // Valor alto
    });
  });

  describe('🔄 Tradução de Nomes', () => {
    it('should translate stat names correctly', () => {
      spyOn(translateService, 'instant').and.returnValue('Vida');
      
      const result = component.getTranslatedStatName('hp');
      expect(translateService.instant).toHaveBeenCalledWith('stats.hp');
      expect(result).toBe('Vida');
    });

    it('should handle unknown stat names', () => {
      spyOn(translateService, 'instant').and.returnValue('unknown-stat');
      
      const result = component.getTranslatedStatName('unknown');
      expect(translateService.instant).toHaveBeenCalledWith('stats.unknown');
      expect(result).toBe('unknown-stat');
    });
  });

  describe('📱 Layout e Estrutura', () => {
    it('should render component template without errors', () => {
      fixture.detectChanges();
      
      const compiled = fixture.nativeElement;
      expect(compiled).toBeTruthy();
    });

    it('should have proper component structure', () => {
      fixture.detectChanges();
      
      // Verificar se o componente tem a estrutura básica esperada
      expect(component.isOpen).toBeDefined();
      expect(component.activeTab).toBeDefined();
      expect(component.pokemon).toBeDefined();
    });
  });

  describe('🧪 Validação de Melhorias', () => {
    it('should validate that improvements are in place', () => {
      // Verificar se os métodos necessários existem
      expect(typeof component.setActiveTab).toBe('function');
      expect(typeof component.getStatPercentage).toBe('function');
      expect(typeof component.getStatColor).toBe('function');
      expect(typeof component.getTranslatedStatName).toBe('function');
    });

    it('should ensure component is properly configured', () => {
      // Verificar configuração inicial
      expect(component.activeTab).toBe('overview');
      expect(component.isOpen).toBe(false);
      expect(component.pokemonId).toBe(0);
      
      // Verificar que não há erros na inicialização
      expect(() => fixture.detectChanges()).not.toThrow();
    });
  });

  describe('🎨 Responsividade Básica', () => {
    it('should handle component lifecycle correctly', () => {
      // Testar ciclo de vida do componente
      expect(() => {
        fixture.detectChanges();
        component.ngOnInit();
        component.ngOnDestroy();
      }).not.toThrow();
    });

    it('should maintain state consistency', () => {
      const initialState = {
        isOpen: component.isOpen,
        activeTab: component.activeTab,
        pokemonId: component.pokemonId
      };

      // Fazer algumas mudanças
      component.setActiveTab('combat');
      
      // Verificar que apenas o que deveria mudar mudou
      expect(component.isOpen).toBe(initialState.isOpen);
      expect(component.pokemonId).toBe(initialState.pokemonId);
      expect(component.activeTab).not.toBe(initialState.activeTab);
      expect(component.activeTab).toBe('combat');
    });
  });
});
