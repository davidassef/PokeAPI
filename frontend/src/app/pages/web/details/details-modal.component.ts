import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy, SimpleChanges, OnChanges, HostBinding, HostListener } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { modalAnimations } from './modal.animations';
import { ViewedPokemonService } from '../../../core/services/viewed-pokemon.service';
import { PokemonDetailsManager } from '../../../core/services/pokemon-details-manager.service';
import { PokemonThemeService } from '../../../core/services/pokemon-theme.service';
import { PokemonNavigationService } from '../../../core/services/pokemon-navigation.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';

@Component({
  selector: 'app-details-modal',
  templateUrl: './details-modal.component.html',
  styleUrls: ['./details-modal.component.scss'],
  animations: modalAnimations
})
export class DetailsModalComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() pokemon: any;
  @Input() pokemonId: number = 0;
  @Input() isOpen: boolean = false;
  @Output() modalClose = new EventEmitter<void>();
  @ViewChild('flavorTextWrapper', { static: false }) flavorTextWrapper?: ElementRef;

  // ✅ CORREÇÃO: HostBinding para controlar visibilidade do modal
  @HostBinding('class.modal-open') get modalOpen() {
    return this.isOpen;
  }

  private destroy$ = new Subject<void>();

  // Propriedades do carrossel
  carouselImages: any[] = [];
  currentImageIndex: number = 0;
  currentCarouselIndex: number = 0;
  currentCarouselImage: string = '';

  // Propriedades das abas
  activeTab: string = 'overview';
  isTabTransitioning: boolean = false;
  isOverviewCombatTransition: boolean = false;
  disableTabAnimation: boolean = false;

  // Controle de carregamento de dados por aba
  tabDataLoaded: { [key: string]: boolean } = {
    overview: false,
    combat: false,
    evolution: false,
    curiosities: false
  };

  // ✅ FASE 4: Estados simplificados inspirados no mobile
  isLoadingTabData: boolean = false;

  // Propriedades dos flavor texts
  flavorText: string = '';
  flavorTexts: string[] = [];
  currentFlavorIndex: number = 0;
  isLoadingFlavor: boolean = false;
  showScrollIndicator: boolean = false;

  // Propriedades de tema e animação
  pokemonTheme: any = null;
  headerState: string = 'idle';

  // Dados adicionais
  speciesData: any = null;
  evolutionChain: any[] = [];
  abilityDescriptions: { [key: string]: string } = {};
  isSpeciesDataReady = false;

  // Estados de loading
  private isLoadingPokemonData: boolean = false;

  // ✅ FASE 4: Métodos de verificação simplificados
  isOverviewDataReady(): boolean {
    return !!this.pokemon;
  }

  isCombatDataReady(): boolean {
    return !!this.pokemon && !this.isLoadingTabData;
  }

  isEvolutionDataReady(): boolean {
    return !!this.pokemon && !this.isLoadingTabData;
  }

  isCuriositiesDataReady(): boolean {
    return !!this.pokemon && !this.isLoadingTabData;
  }

  shouldShowCombatData(): boolean {
    return this.isCombatDataReady();
  }

  shouldShowSpeciesDataInEvolution(): boolean {
    return this.activeTab === 'evolution' && this.isSpeciesDataReady && !!this.speciesData;
  }

  shouldShowSpeciesDataInCuriosities(): boolean {
    return this.activeTab === 'curiosities' && this.isSpeciesDataReady;
  }

  isEvolutionChainReady(): boolean {
    return this.evolutionChain.length > 0;
  }

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private http: HttpClient,
    private viewedPokemonService: ViewedPokemonService,
    private pokemonDetailsManager: PokemonDetailsManager,
    private pokemonThemeService: PokemonThemeService,
    private pokemonNavigationService: PokemonNavigationService,
    private pokeApiService: PokeApiService
  ) {}

  ngOnInit() {
    // ✅ LIMPEZA: Log de inicialização removido - componente estável
    // console.log('🚀 DetailsModalComponent - ngOnInit:', {
    //   pokemon: !!this.pokemon,
    //   pokemonId: this.pokemonId,
    //   isOpen: this.isOpen,
    //   timestamp: new Date().toISOString()
    // });

    if (this.pokemon) {
      // ✅ LIMPEZA: Log de disponibilidade removido - fluxo estável
      // console.log('✅ Pokemon já disponível, inicializando dados');
      this.initializePokemonData();
    } else if (this.pokemonId && this.pokemonId > 0) {
      // ✅ LIMPEZA: Log de carregamento removido - fluxo estável
      // console.log('🔍 Carregando Pokemon com PokemonDetailsManager');
      this.loadPokemonById(this.pokemonId);
    } else {
      // ✅ MANTER: Warning crítico para debugging
      console.warn('⚠️ Nenhum Pokemon ou ID fornecido');
    }

    // Ouvir mudanças de idioma
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onLanguageChange();
      });
  }

  private loadPokemonById(id: number) {
    if (this.isLoadingPokemonData) {
      console.log(`⚠️ Já carregando dados do Pokémon ID: ${id}, ignorando chamada duplicada`);
      return;
    }

    // ✅ CORREÇÃO: Carregamento direto sem debounce desnecessário
    console.log(`🔍 Carregando dados do Pokémon ID: ${id}`);
    this.loadPokemonDetailsDirectly(id);
  }

  // ✅ CORREÇÃO: Propriedade loadingDebounceTimer removida - carregamento direto implementado

  /**
   * ✅ OTIMIZAÇÃO: Método otimizado para carregar apenas dados essenciais inicialmente
   * Implementa lazy loading para melhor performance
   */
  private async loadPokemonDetailsDirectly(id: number): Promise<void> {
    this.isLoadingPokemonData = true;

    try {
      // ✅ OTIMIZAÇÃO: Carregar dados básicos e species em paralelo
      const [pokemon, species] = await Promise.all([
        this.pokeApiService.getPokemon(id).toPromise(),
        this.pokeApiService.getPokemonSpecies(id).toPromise()
      ]);

      this.pokemon = pokemon;
      this.speciesData = species;

      // ✅ OTIMIZAÇÃO: Configurar carrossel apenas com dados básicos
      this.carouselImages = this.pokemonDetailsManager.generateCarouselImages(pokemon);

      // ✅ OTIMIZAÇÃO: Não carregar flavor texts inicialmente - lazy load na aba
      this.flavorTexts = [];
      this.currentFlavorIndex = 0;

      this.isSpeciesDataReady = !!this.speciesData;
      this.initializePokemonData();
      this.isLoadingPokemonData = false;

      // ✅ OTIMIZAÇÃO: Pré-carregar imagens em background
      this.preloadCarouselImages();

    } catch (error) {
      console.error('❌ Erro ao carregar detalhes:', error);
      this.handleLoadingError(id);
    }
  }

  /**
   * ✅ OTIMIZAÇÃO: Pré-carregamento de imagens em background
   */
  private preloadCarouselImages(): void {
    if (!this.carouselImages || this.carouselImages.length === 0) return;

    // Pré-carregar apenas as primeiras 3 imagens para não sobrecarregar
    const imagesToPreload = this.carouselImages.slice(0, 3);

    imagesToPreload.forEach((imageData, index) => {
      if (imageData.url && this.isValidImageUrl(imageData.url)) {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Imagem ${index + 1} pré-carregada:`, imageData.label);
        };
        img.onerror = () => {
          console.warn(`❌ Erro ao pré-carregar imagem ${index + 1}:`, imageData.label);
        };
        img.src = imageData.url;
      }
    });
  }

  private handleLoadingError(id?: number): void {
    console.error('❌ Erro ao carregar dados do Pokémon');
    if (id) {
      this.pokemon = this.createPlaceholderPokemon(id);
    }
    this.initializePokemonData();
    this.isLoadingPokemonData = false;
  }

  private createPlaceholderPokemon(id: number) {
    const placeholderImage = this.ensureValidImage();
    return {
      id: id,
      name: 'Pokemon Desconhecido',
      sprites: {
        front_default: placeholderImage,
        back_default: placeholderImage,
        other: {
          'official-artwork': {
            front_default: placeholderImage
          }
        }
      },
      types: [{ type: { name: 'unknown' } }],
      stats: [],
      abilities: [],
      height: 0,
      weight: 0,
      base_experience: 0,
      species: { url: '' }
    };
  }

  private initializePokemonData() {
    if (!this.pokemon) {
      console.error('❌ initializePokemonData: Pokemon não disponível');
      return;
    }

    console.log(`🔧 Inicializando dados para: ${this.pokemon.name} (ID: ${this.pokemon.id})`);

    // Mark Pokemon as viewed when details are initialized
    this.viewedPokemonService.markPokemonAsViewed(this.pokemon.id);

    // ✅ CORREÇÃO: Resetar dados de abas, mas manter curiosities se já temos flavor texts
    this.tabDataLoaded = {
      overview: false,
      combat: false,
      evolution: false,
      curiosities: this.flavorTexts && this.flavorTexts.length > 0 // Marcar como carregado se já temos dados
    };

    console.log('📊 Estado inicial tabDataLoaded:', this.tabDataLoaded);

    // Resetar estado das abas
    this.activeTab = 'overview';
    this.isTabTransitioning = false;
    this.isOverviewCombatTransition = false;
    this.disableTabAnimation = false;

    // Gerar tema baseado nos tipos do Pokémon usando o serviço especializado
    this.generatePokemonTheme();

    // Configurar carrossel de imagens se não foi feito pelo PokemonDetailsManager
    if (!this.carouselImages || this.carouselImages.length === 0) {
      this.setupCarousel();
    } else {
      this.updateCurrentCarouselImage();
    }

    // ✅ CORREÇÃO CRÍTICA: Remover carregamento automático para evitar duplicação
    // Dados serão carregados apenas quando aba for acessada (lazy loading)
    console.log('🎯 Inicialização sem carregamento automático - usando lazy loading');

    console.log('✅ Inicialização completa. Estado final:', {
      pokemon: !!this.pokemon,
      activeTab: this.activeTab,
      tabDataLoaded: this.tabDataLoaded,
      isOverviewDataReady: this.isOverviewDataReady(),
      note: 'Dados serão carregados via lazy loading'
    });
  }

  ngAfterViewInit() {
    // Pequeno delay para garantir que os elementos foram renderizados
    setTimeout(() => {
      this.animateElements();
    }, 100);
  }

  setupCarousel() {
    console.log('🖼️ Configurando carrossel para:', this.pokemon?.name);

    // Usar o PokemonDetailsManager para gerar as imagens do carrossel
    this.carouselImages = this.pokemonDetailsManager.generateCarouselImages(this.pokemon);

    console.log('Imagens do carrossel:', this.carouselImages);

    // Inicializar com a primeira imagem válida
    this.currentImageIndex = 0;
    this.currentCarouselIndex = 0;
    this.updateCurrentCarouselImage();
  }













  // ✅ CORREÇÃO: Método corrigido para usar chaves de tradução estruturadas
  getEvolutionTriggerText(detailsOrTrigger: any): string {
    // Se for uma string simples (trigger name), traduzir diretamente
    if (typeof detailsOrTrigger === 'string') {
      const triggerKey = detailsOrTrigger.replace(/-/g, '_');
      return this.translate.instant(`evolution.triggers.${triggerKey}`) || detailsOrTrigger;
    }

    // Se for um objeto details, processar com chaves estruturadas
    const details = detailsOrTrigger;

    // ✅ CORREÇÃO: Usar chave de tradução com interpolação em vez de concatenação
    if (details.min_level) {
      return this.translate.instant('evolution.triggers.level_up', { level: details.min_level });
    }

    if (details.item) {
      const itemName = details.item.name?.replace(/-/g, ' ') || 'Unknown Item';
      return this.translate.instant('evolution.triggers.use_item', { item: itemName });
    }

    if (details.trigger?.name === 'trade') {
      return this.translate.instant('evolution.triggers.trade');
    }

    if (details.min_happiness) {
      return this.translate.instant('evolution.triggers.happiness', { happiness: details.min_happiness });
    }

    // ✅ CORREÇÃO: Verificar outros tipos de trigger
    if (details.trigger?.name) {
      const triggerKey = details.trigger.name.replace(/-/g, '_');
      return this.translate.instant(`evolution.triggers.${triggerKey}`) || details.trigger.name;
    }

    return this.translate.instant('evolution.triggers.special');
  }



  // Métodos da interface
  getOffensiveStats() {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter((stat: any) =>
      ['attack', 'special-attack'].includes(stat.stat.name)
    );
  }

  getDefensiveStats() {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter((stat: any) =>
      ['defense', 'special-defense', 'hp'].includes(stat.stat.name)
    );
  }

  getUtilityStats() {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter((stat: any) =>
      ['speed'].includes(stat.stat.name)
    );
  }

  getAbilityDescription(abilityName: string): string {
    // BLOQUEIO POR ABA: só retornar dados se estivermos na aba correta
    if (this.activeTab !== 'combat') {
      return ''; // Retorna vazio para não exibir nada no template
    }

    const description = this.abilityDescriptions[abilityName];
    if (description && description !== this.translate.instant('app.loading')) {
      return description;
    }

    // Se não há descrição ou está carregando, retornar mensagem de carregamento
    if (!description) {
      return this.translate.instant('app.loading');
    }

    return description;
  }

  getEvolutionMethodText(method: string): string {
    if (!method) return '';

    // Mapear métodos para chaves de tradução corretas
    const methodMapping: { [key: string]: string } = {
      'level': 'evolution.methods.level',
      'level-up': 'evolution.triggers.level-up',
      'level_up': 'evolution.triggers.level-up',
      'trade': 'evolution.triggers.trade',
      'stone': 'evolution.triggers.stone',
      'happiness': 'evolution.triggers.happiness',
      'special': 'evolution.triggers.special'
    };

    const methodKey = method.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    const translationKey = methodMapping[methodKey] || `evolution.methods.${methodKey}`;

    const translated = this.translate.instant(translationKey);
    return translated !== translationKey ? translated : method;
  }


  getEggGroups(): string {
    // BLOQUEIO POR ABA: só retornar dados se estivermos na aba correta
    if (this.activeTab !== 'evolution' && this.activeTab !== 'curiosities') {
      return ''; // Retorna vazio para não exibir nada no template
    }

    if (!this.isSpeciesDataReady) {
      return this.translate.instant('app.loading');
    }
    if (!this.speciesData?.egg_groups) return this.translate.instant('app.not_available');

    return this.speciesData.egg_groups
      .map((group: any) => {
        const translated = this.translate.instant(`egg_groups.${group.name}`);
        return translated !== `egg_groups.${group.name}` ? translated : group.name;
      })
      .join(', ');
  }

  getGrowthRate(): string {
    // BLOQUEIO POR ABA: só retornar dados se estivermos na aba correta
    if (this.activeTab !== 'evolution' && this.activeTab !== 'curiosities') {
      return ''; // Retorna vazio para não exibir nada no template
    }

    if (!this.isSpeciesDataReady) {
      return this.translate.instant('app.loading');
    }

    if (!this.speciesData?.growth_rate) return this.translate.instant('app.not_available');

    const growthRateName = this.speciesData.growth_rate.name;
    const translated = this.translate.instant(`growth_rates.${growthRateName}`);
    return translated !== `growth_rates.${growthRateName}` ? translated : growthRateName;
  }

  // Métodos de navegação
  getCurrentFlavorText(): string {
    if (!this.flavorTexts || this.flavorTexts.length === 0) {
      return this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
    }
    return this.flavorTexts[this.currentFlavorIndex] || this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
  }

  previousFlavor(): void {
    if (this.currentFlavorIndex > 0) {
      this.animateFlavorTransition(() => {
        this.currentFlavorIndex--;
        this.resetScrollAndCheckIndicator();
      });
    }
  }

  nextFlavor(): void {
    if (this.currentFlavorIndex < this.flavorTexts.length - 1) {
      this.animateFlavorTransition(() => {
        this.currentFlavorIndex++;
        this.resetScrollAndCheckIndicator();
      });
    }
  }

  private animateFlavorTransition(callback: () => void): void {
    const flavorWrapper = document.querySelector('.flavor-text-wrapper');
    if (flavorWrapper) {
      flavorWrapper.classList.add('flavor-transition');
      setTimeout(() => {
        callback();
        setTimeout(() => {
          flavorWrapper.classList.remove('flavor-transition');
        }, 150);
      }, 150);
    } else {
      callback();
    }
  }

  getPokemonBMI(): string {
    if (!this.pokemon?.height || !this.pokemon?.weight) return this.translate.instant('app.not_available');

    const heightInMeters = this.pokemon.height / 10;
    const weightInKg = this.pokemon.weight / 10;
    const bmi = weightInKg / (heightInMeters * heightInMeters);

    const bmiValue = bmi.toFixed(1);

    if (bmi < 18.5) return `${bmiValue} (${this.translate.instant('bmi_categories.light')})`;
    if (bmi < 25) return `${bmiValue} (${this.translate.instant('bmi_categories.normal')})`;
    if (bmi < 30) return `${bmiValue} (${this.translate.instant('bmi_categories.heavy')})`;
    return `${bmiValue} (${this.translate.instant('bmi_categories.very_heavy')})`;
  }

  getPokemonTrivia(): string[] {
    const trivia: string[] = [];

    if (!this.pokemon) return [];

    // 1. Trivia sobre tipos
    if (this.pokemon.types && this.pokemon.types.length > 0) {
      const types = this.pokemon.types.map((t: any) => this.getTranslatedTypeName(t.type.name));

      if (types.length === 1) {
        trivia.push(this.translate.instant('mobile.trivia.single_type', { type: types[0] }));
      } else if (types.length > 1) {
        trivia.push(this.translate.instant('mobile.trivia.dual_type', {
          type1: types[0],
          type2: types[1]
        }));
      }
    }

    // 2. Trivia sobre peso e altura
    if (this.pokemon.weight && this.pokemon.height) {
      const weight = this.pokemon.weight / 10; // Converte para kg
      const height = this.pokemon.height / 10; // Converte para metros

      if (weight > 200) {
        trivia.push(this.translate.instant('mobile.trivia.heavy_weight'));
      } else if (weight < 10) {
        trivia.push(this.translate.instant('mobile.trivia.light_weight'));
      }

      if (height > 2) {
        trivia.push(this.translate.instant('mobile.trivia.tall_height'));
      } else if (height < 0.5) {
        trivia.push(this.translate.instant('mobile.trivia.small_height'));
      }
    }

    // 3. Trivia sobre estatísticas
    if (this.pokemon.stats) {
      const stats = this.pokemon.stats.reduce((acc: any, stat: any) => {
        acc[stat.stat.name] = stat.base_stat;
        return acc;
      }, {});

      // Verifica se tem alguma estatística muito alta ou muito baixa
      if (stats.hp > 150) {
        trivia.push(this.translate.instant('mobile.trivia.high_hp'));
      }

      if (stats.attack > 120) {
        trivia.push(this.translate.instant('mobile.trivia.high_attack'));
      }

      if (stats.speed > 120) {
        trivia.push(this.translate.instant('mobile.trivia.high_speed'));
      }
    }

    // 4. Trivia sobre espécie (se disponível)
    if (this.speciesData) {
      if (this.speciesData.is_legendary) {
        trivia.push(this.translate.instant('mobile.trivia.legendary'));
      }

      if (this.speciesData.is_mythical) {
        trivia.push(this.translate.instant('mobile.trivia.mythical'));
      }

      if (this.speciesData.habitat) {
        trivia.push(this.translate.instant('mobile.trivia.habitat', {
          habitat: this.translate.instant(`pokemon.habitats.${this.speciesData.habitat.name}`)
        }));
      }
    }

    // 5. Easter eggs específicos
    if (this.pokemon.id === 1) {
      trivia.push(this.translate.instant('mobile.trivia.bulbasaur_first'));
    }

    if (this.pokemon.id === 150) {
      trivia.push(this.translate.instant('mobile.trivia.mewtwo_origin'));
    }

    if (this.pokemon.id === 151) {
      trivia.push(this.translate.instant('mobile.trivia.mew_original'));
    }

    if (this.pokemon.id === 25) {
      trivia.push(this.translate.instant('mobile.trivia.pikachu_mascot'));
    }

    // 6. Garante que temos pelo menos uma curiosidade
    if (trivia.length === 0) {
      trivia.push(this.translate.instant('mobile.trivia.default'));
    }

    return trivia;
  }

  getTotalStats(): number {
    if (!this.pokemon?.stats) return 0;
    return this.pokemon.stats.reduce((total: number, stat: any) => total + stat.base_stat, 0);
  }

  getBaseExperience(): string {
    return this.pokemon?.base_experience?.toString() || this.translate.instant('app.not_available');
  }
  // ✅ CORREÇÃO: Método otimizado sem bloqueio por aba (como na versão mobile)
  getCaptureRate(): string {
    // ✅ CORREÇÃO: Remover bloqueio por aba que causava loop infinito
    // if (this.activeTab !== 'curiosities') {
    //   return ''; // REMOVIDO - causava problemas de loading
    // }

    // ✅ CORREÇÃO: Verificação direta dos dados sem dependência de isSpeciesDataReady
    if (!this.speciesData || this.speciesData.capture_rate === undefined) {
      return this.translate.instant('app.not_available');
    }

    return this.speciesData.capture_rate.toString();
  }

  // ✅ CORREÇÃO: Método otimizado sem bloqueio por aba (como na versão mobile)
  getBaseHappiness(): string {
    // ✅ CORREÇÃO: Remover bloqueio por aba que causava loop infinito
    // if (this.activeTab !== 'curiosities') {
    //   return ''; // REMOVIDO - causava problemas de loading
    // }

    // ✅ CORREÇÃO: Verificação direta dos dados sem dependência de isSpeciesDataReady
    if (!this.speciesData || this.speciesData.base_happiness === undefined) {
      return this.translate.instant('app.not_available');
    }

    return this.speciesData.base_happiness.toString();
  }

  // ✅ CORREÇÃO: Método otimizado sem bloqueio por aba (como na versão mobile)
  getPokemonColor(): string {
    // ✅ CORREÇÃO: Remover bloqueio por aba que causava loop infinito
    // if (this.activeTab !== 'curiosities') {
    //   return ''; // REMOVIDO - causava problemas de loading
    // }

    // ✅ CORREÇÃO: Verificação direta dos dados sem dependência de isSpeciesDataReady
    if (!this.speciesData || !this.speciesData.color?.name) {
      return this.translate.instant('app.not_available');
    }

    const colorName = this.speciesData.color.name;
    const translated = this.translate.instant(`colors.${colorName}`);
    return translated !== `colors.${colorName}` ? translated : colorName;
  }

  getTranslatedStatName(statName: string): string {
    return this.translate.instant(`stats.${statName}`) || statName;
  }

  getTranslatedTypeName(typeName: string): string {
    return this.translate.instant(`types.${typeName}`) || typeName;
  }

  getTranslatedAbilityName(abilityName: string): string {
    const translated = this.translate.instant(`abilities.${abilityName}`);
    return translated !== `abilities.${abilityName}` ? translated : abilityName.replace('-', ' ');
  }

  getTranslatedAbilityDescription(abilityName: string): string {
    return this.getAbilityDescription(abilityName);
  }

  // Métodos do carrossel
  previousCarouselImage(): void {
    if (this.currentImageIndex > 0) {
      this.currentImageIndex--;
    } else {
      this.currentImageIndex = this.carouselImages.length - 1;
    }
    this.updateCurrentCarouselImage();
  }

  nextCarouselImage(): void {
    if (this.currentImageIndex < this.carouselImages.length - 1) {
      this.currentImageIndex++;
    } else {
      this.currentImageIndex = 0;
    }
    this.updateCurrentCarouselImage();
  }

  selectCarouselImage(index: number): void {
    this.currentImageIndex = index;
    this.currentCarouselIndex = index;
    this.updateCurrentCarouselImage();

    // Forçar atualização do carrossel
    console.log('🎯 Selecionando imagem do carrossel:', index);
    this.updateCarouselView();
  }

  private updateCarouselView(): void {
    // Garantir que o carrossel seja atualizado corretamente
    setTimeout(() => {
      const offset = this.getThumbnailSlideOffset();
      console.log('🎯 Atualizando vista do carrossel com offset:', offset);
    }, 0);
  }

  getThumbnailSlideOffset(): number {
    // Calcular o offset para centralizar as miniaturas
    const thumbnailWidth = 52; // largura da miniatura (44px) + gap (8px)
    const maxVisible = 5; // Máximo de 5 miniaturas visíveis

    if (this.carouselImages.length <= maxVisible) {
      console.log('🎯 Carrossel: Menos de 5 imagens, sem scroll necessário');
      return 0;
    }

    // Calcular offset para manter a miniatura ativa no centro
    const centerIndex = Math.floor(maxVisible / 2); // índice 2 (terceira posição)
    let targetOffset = 0;

    if (this.currentCarouselIndex < centerIndex) {
      // Início da lista - não mover, mostrar primeiras 5
      targetOffset = 0;
      console.log('🎯 Carrossel: Início da lista, offset = 0');
    } else if (this.currentCarouselIndex >= this.carouselImages.length - centerIndex) {
      // Final da lista - mostrar as últimas 5
      targetOffset = (this.carouselImages.length - maxVisible) * thumbnailWidth;
      console.log('🎯 Carrossel: Final da lista, offset =', targetOffset);
    } else {
      // Meio da lista - centralizar a miniatura ativa na posição central
      targetOffset = (this.currentCarouselIndex - centerIndex) * thumbnailWidth;
      console.log('🎯 Carrossel: Meio da lista, centralizando índice', this.currentCarouselIndex, 'offset =', targetOffset);
    }

    console.log('🎯 Carrossel: Offset final =', -targetOffset, 'para índice', this.currentCarouselIndex);
    return -targetOffset;
  }

  private updateCurrentCarouselImage(): void {
    const imageUrl = this.carouselImages[this.currentImageIndex]?.url || '';
    this.currentCarouselImage = this.isValidImageUrl(imageUrl)
      ? imageUrl
      : this.ensureValidImage();
    this.currentCarouselIndex = this.currentImageIndex;

    console.log('🔄 Imagem atual do carrossel:', this.currentCarouselImage);
  }

  // Método para obter as miniaturas visíveis (máximo 5)
  getVisibleThumbnails(): any[] {
    const maxVisible = 5;

    if (this.carouselImages.length <= maxVisible) {
      return this.carouselImages;
    }

    const centerIndex = Math.floor(maxVisible / 2);
    let startIndex = 0;

    if (this.currentCarouselIndex < centerIndex) {
      startIndex = 0;
    } else if (this.currentCarouselIndex >= this.carouselImages.length - centerIndex) {
      startIndex = this.carouselImages.length - maxVisible;
    } else {
      startIndex = this.currentCarouselIndex - centerIndex;
    }

    const visibleThumbnails = this.carouselImages.slice(startIndex, startIndex + maxVisible);
    console.log('🎯 Miniaturas visíveis:', visibleThumbnails.length, 'de', this.carouselImages.length, 'total');

    return visibleThumbnails;
  }

  // Método para verificar se uma miniatura deve estar visível
  isThumbnailVisible(index: number): boolean {
    const maxVisible = 5;

    if (this.carouselImages.length <= maxVisible) {
      return true;
    }

    const centerIndex = Math.floor(maxVisible / 2);
    let startIndex = 0;

    if (this.currentCarouselIndex < centerIndex) {
      startIndex = 0;
    } else if (this.currentCarouselIndex >= this.carouselImages.length - centerIndex) {
      startIndex = this.carouselImages.length - maxVisible;
    } else {
      startIndex = this.currentCarouselIndex - centerIndex;
    }

    return index >= startIndex && index < startIndex + maxVisible;
  }

  isValidImageUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const trimmedUrl = url.trim();

    // Verificar se a URL não está vazia e não contém valores inválidos
    if (trimmedUrl === '' ||
        trimmedUrl.includes('undefined') ||
        trimmedUrl.includes('null') ||
        trimmedUrl === 'null' ||
        trimmedUrl === 'undefined') {
      return false;
    }

    // Verificar se é uma URL válida (HTTP/HTTPS ou asset local)
    return trimmedUrl.startsWith('http://') ||
           trimmedUrl.startsWith('https://') ||
           trimmedUrl.startsWith('assets/');
  }

  onImageLoad(event: any): void {
    // ✅ LIMPEZA: Log de sucesso de imagem removido - fallback funciona corretamente
    // console.log('✅ Imagem carregada com sucesso:', event.target.src);
    // Remover classe de erro se existir
    const container = event.target.closest('.main-image-container');
    if (container) {
      container.classList.remove('image-failed');
    }
  }

  /**
   * ✅ FASE 3: Método de tratamento de erro de imagem atualizado
   * Remove dependência do arquivo corrompido pokemon-placeholder.png
   */
  onImageError(event: any): void {
    const failedUrl = event.target.src;
    const elementInfo = {
      className: event.target.className,
      alt: event.target.alt,
      parent: event.target.parentElement?.className
    };

    // ✅ MANTER: Logs de erro de imagem são críticos para debugging
    console.warn('❌ Erro ao carregar imagem:', failedUrl);
    console.warn('📍 Elemento:', elementInfo);

    // ✅ REMOVER referência ao arquivo corrompido
    if (!failedUrl.includes('pokeball.png') &&
        !failedUrl.includes('data:image/svg+xml')) {
      const placeholderPath = this.ensureValidImage();
      console.log('🔄 Usando placeholder válido:', placeholderPath);
      event.target.src = placeholderPath;
    } else {
      // ✅ Usar SVG inline como último recurso
      console.log('💥 Usando fallback SVG absoluto');
      event.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4MCIgZmlsbD0iI0Y1RjVGNSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNMjAgMTAwaDE2MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjQiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjE1IiBmaWxsPSIjRkZGIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg==';
      event.target.style.display = 'block'; // Garantir que a imagem seja visível

      // Adicionar classe para mostrar placeholder alternativo
      const container = event.target.closest('.main-image-container, .evolution-image, .thumbnail-btn-inline');
      if (container) {
        container.classList.add('image-failed');
      }
    }
  }  // Métodos das abas - função setActiveTab movida para seção simplificada

  private instantCleanupOverviewCombat(fromTab: string, toTab: string): void {
    console.log(`⚡ LIMPEZA INSTANTÂNEA OVERVIEW ↔ COMBAT: ${fromTab} -> ${toTab}`);

    if (fromTab === 'overview' && toTab === 'combat') {
      // Visão Geral → Combate: Não há dados específicos para limpar da overview
      // (dados básicos do Pokémon são compartilhados)
      console.log('🧹 Overview → Combat: Sem dados específicos para limpar');

    } else if (fromTab === 'combat' && toTab === 'overview') {
      // Combate → Visão Geral: Limpar dados específicos de combate
      console.log('🧹 Combat → Overview: Limpando dados de combate');
      // Não limpar abilityDescriptions pois podem ser reutilizadas
      // Apenas garantir que não serão exibidas na overview
    }

    // ✅ CORREÇÃO: Limpeza seletiva - não limpar flavor texts se vamos para curiosities
    // Só limpar evolution chain para transições overview ↔ combat
    this.evolutionChain = [];

    // ✅ NÃO LIMPAR flavor texts aqui - eles são necessários para curiosities
    // this.flavorTexts = []; // REMOVIDO
    // this.flavorText = ''; // REMOVIDO
    // this.isLoadingFlavor = false; // REMOVIDO
  }

  private cleanupDataForTabSwitch(fromTab: string, toTab: string): void {
    console.log(`🧹 Limpeza seletiva: ${fromTab} -> ${toTab}`);

    // Limpar apenas dados que NÃO pertencem à nova aba
    switch (toTab) {
      case 'overview':
        // Dados básicos já carregados no initializePokemonData
        // Apenas marcar como carregado se o pokemon existe
        if (this.pokemon) {
          this.tabDataLoaded['overview'] = true;
        }
        break;

      case 'combat':
        // ✅ CORREÇÃO: Dados de combate serão carregados pelo loadTabData principal
        // Removido chamada duplicada para evitar loops
        break;

      case 'evolution':
        // ✅ CORREÇÃO: Dados de evolução serão carregados pelo loadTabData principal
        // Removido chamada duplicada para evitar loops infinitos
        break;

      case 'curiosities':
        // ✅ CORREÇÃO: Dados de curiosidades serão carregados pelo loadTabData principal
        // Removido chamada duplicada para evitar loops
        break;
    }
  }

  loadTabData(tab: string): void {
    console.log(`🎯 Loading tab data for ${tab}`, {
      pokemon: !!this.pokemon,
      pokemonName: this.pokemon?.name,
      currentTabDataLoaded: this.tabDataLoaded
    });

    if (!this.pokemon) {
      console.error('❌ loadTabData: Pokemon não disponível');
      return;
    }

    // Se os dados já foram carregados, não recarregar
    if (this.tabDataLoaded[tab]) {
      console.log(`✅ Dados da aba ${tab} já carregados`);
      return;
    }

    // ✅ CORREÇÃO CRÍTICA: Usar o PokemonDetailsManager com parâmetros corretos
    this.pokemonDetailsManager.loadTabData(tab, this.pokemon, this.speciesData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tabData) => {
          console.log(`✅ Dados da aba ${tab} carregados:`, tabData);

          // ✅ CORREÇÃO: Processar dados corretamente baseado no tipo retornado
          switch (tab) {
            case 'overview':
              // Overview retorna dados básicos do pokemon
              if (tabData && typeof tabData === 'object') {
                console.log('📊 Dados de overview processados:', Object.keys(tabData));
              }
              this.tabDataLoaded['overview'] = true;
              break;

            case 'combat':
              // Combat retorna diretamente as descrições das habilidades
              if (tabData && typeof tabData === 'object') {
                this.abilityDescriptions = { ...this.abilityDescriptions, ...tabData };
                console.log('⚔️ Habilidades carregadas:', Object.keys(tabData));
              }
              this.tabDataLoaded['combat'] = true;
              break;

            case 'evolution':
              // Evolution retorna diretamente o array da cadeia
              if (tabData && Array.isArray(tabData)) {
                this.evolutionChain = tabData;
                console.log('🔄 Cadeia de evolução carregada:', tabData.length, 'estágios');
              }
              this.tabDataLoaded['evolution'] = true;
              break;

            case 'curiosities':
              // ✅ CORREÇÃO: Curiosities retorna null, dados já estão no pokemon enriquecido
              if (tabData === null) {
                console.log('🎭 Curiosidades: usando dados já carregados no enriquecimento');
              }
              this.tabDataLoaded['curiosities'] = true;
              break;
          }
        },
        error: (error) => {
          console.error(`❌ Erro ao carregar dados da aba ${tab}:`, error);
          // Marcar como carregado mesmo com erro para evitar loops
          this.tabDataLoaded[tab] = true;
        }
      });
  }

  private clearNonTabData(currentTab: string): void {
    // Limpar dados que não pertencem à aba atual para evitar vazamentos - LIMPEZA INTELIGENTE
    console.log(`🧹 Limpeza inteligente de dados não relacionados à aba: ${currentTab}`);

    switch (currentTab) {
      case 'overview':
        // Limpar dados de outras abas ao entrar na overview
        this.evolutionChain = [];
        this.flavorTexts = [];
        this.flavorText = '';
        this.isLoadingFlavor = false;
        // Não limpar abilityDescriptions pois são dados pequenos e podem ser reutilizados
        break;

      case 'combat':
        // Limpar dados não relacionados ao combate
        this.evolutionChain = [];
        this.flavorTexts = [];
        this.flavorText = '';
        this.isLoadingFlavor = false;
        break;

      case 'evolution':
        // Limpar dados não relacionados à evolução
        this.flavorTexts = [];
        this.flavorText = '';
        this.isLoadingFlavor = false;
        // NÃO limpar evolutionChain aqui para evitar re-carregamento desnecessário
        // Manter speciesData pois é necessário para evolução
        break;

      case 'curiosities':
        // Limpar dados não relacionados às curiosidades
        this.evolutionChain = [];
        // Manter speciesData pois é necessário para curiosidades
        break;
    }
  }

  onTabKeydown(event: KeyboardEvent): void {
    const tabs = ['overview', 'combat', 'evolution', 'curiosities'];
    const currentIndex = tabs.indexOf(this.activeTab);

    if (event.key === 'ArrowRight' && currentIndex < tabs.length - 1) {
      this.setActiveTab(tabs[currentIndex + 1]);
      event.preventDefault();
    } else if (event.key === 'ArrowLeft' && currentIndex > 0) {
      this.setActiveTab(tabs[currentIndex - 1]);
      event.preventDefault();
    }
  }

  // Métodos de scroll
  onFlavorTextScroll(event: any): void {
    const element = event.target;
    const isScrolledToBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 5;

    if (isScrolledToBottom) {
      this.showScrollIndicator = false;
    }
  }

  private resetScrollAndCheckIndicator(): void {
    if (this.flavorTextWrapper?.nativeElement) {
      this.flavorTextWrapper.nativeElement.scrollTop = 0;
    }
    setTimeout(() => this.checkScrollIndicator(), 100);
  }

  private checkScrollIndicator(): void {
    if (this.flavorTextWrapper?.nativeElement) {
      const el = this.flavorTextWrapper.nativeElement;
      const hasOverflow = el.scrollHeight > el.clientHeight;
      this.showScrollIndicator = hasOverflow;

      if (hasOverflow) {
        setTimeout(() => {
          if (this.flavorTextWrapper?.nativeElement) {
            const el = this.flavorTextWrapper.nativeElement;
            const isStillScrollable = el.scrollHeight > el.clientHeight;
            const isScrolledToBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
            this.showScrollIndicator = isStillScrollable && !isScrolledToBottom;
          }
        }, 3000);
      }
    }
  }

  // Métodos de animação
  private animateElements(): void {
    this.animateHeader();
    this.animateStats();
    this.animateCards();
  }

  private animateHeader(): void {
    // ✅ LIMPEZA: Log de animação removido - funcionalidade estável
    // console.log('Animação do header iniciada');
  }

  private animateStats(): void {
    // ✅ LIMPEZA: Log de animação removido - funcionalidade estável
    // console.log('Animação das stats iniciada');
  }

  private animateCards(): void {
    // ✅ LIMPEZA: Log de animação removido - funcionalidade estável
    // console.log('Animação dos cards iniciada');
  }





  // Método para fechar o modal
  closeModal() {
    this.modalClose.emit();
  }

  onClose(event?: any): void {
    // Se for chamado pelo overlay, verificar se clicou no overlay
    if (event && event.target && !event.target.classList.contains('details-modal-overlay')) {
      return;
    }
    this.closeModal();
  }

  // ✅ CORREÇÃO: Adicionar suporte para tecla ESC
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.isOpen) {
      this.closeModal();
      event.preventDefault();
    }
  }

  getStatPercentage(baseStat: number): number {
    // Normalizar stat para porcentagem (máximo teórico de 255)
    return Math.min((baseStat / 255) * 100, 100);
  }

  // Método auxiliar para garantir que há sempre uma imagem válida
  ensureValidImage(): string {
    const fallbacks = [
      // ✅ CORREÇÃO: Usar pokeball.png que sabemos que funciona
      'assets/img/pokeball.png',
      'assets/img/placeholder.png',
      // Data URL como fallback absoluto - Pokeball SVG
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMTAwIiBjeT0iMTAwIiByPSI4MCIgZmlsbD0iI0Y1RjVGNSIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjQiLz48cGF0aCBkPSJNMjAgMTAwaDE2MCIgc3Ryb2tlPSIjMzMzIiBzdHJva2Utd2lkdGg9IjQiLz48Y2lyY2xlIGN4PSIxMDAiIGN5PSIxMDAiIHI9IjE1IiBmaWxsPSIjRkZGIiBzdHJva2U9IiMzMzMiIHN0cm9rZS13aWR0aD0iMyIvPjwvc3ZnPg=='
    ];

    // Retorna o primeiro fallback (assumindo que existe)
    return fallbacks[0];
  }

  /**
   * ✅ FASE 4: Método para validar URLs de imagem antes de usar
   * Aplica o mesmo padrão da FASE 3 para imagens de evolução
   */
  getValidImageUrl(imageUrl: string | null | undefined): string {
    // Se não há URL ou é inválida, usar fallback imediatamente
    if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
      return this.ensureValidImage();
    }
    return imageUrl;
  }

  // ✅ CORREÇÃO: Método otimizado para mudança de idioma sem loops infinitos
  onLanguageChange(): void {
    console.log('🌐 Mudança de idioma detectada, recarregando dados dependentes de idioma');

    if (this.pokemon) {
      // Resetar dados dependentes de idioma
      this.flavorTexts = [];
      this.flavorText = '';
      this.abilityDescriptions = {};

      // Marcar abas como não carregadas para forçar reload com novo idioma
      this.tabDataLoaded['combat'] = false;
      this.tabDataLoaded['curiosities'] = false;

      // Recarregar dados da aba ativa
      this.loadTabData(this.activeTab);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('DetailsModalComponent - ngOnChanges', changes);

    // ✅ CORREÇÃO: Lógica simplificada baseada no padrão mobile
    if (changes['pokemonId'] && changes['pokemonId'].currentValue !== changes['pokemonId'].previousValue) {
      if (changes['pokemonId'].currentValue && changes['pokemonId'].currentValue > 0) {
        this.loadPokemonById(changes['pokemonId'].currentValue);
      }
    }

    // ✅ CORREÇÃO: Tratamento simples de reabertura sem recriação de Subject
    if (changes['isOpen'] && changes['isOpen'].currentValue === true &&
        changes['isOpen'].previousValue === false) {
      console.log('🔄 Modal reaberto');

      // Se não temos dados ou pokemonId mudou, recarregar
      if (!this.pokemon || (this.pokemonId && this.pokemon.id !== this.pokemonId)) {
        if (this.pokemonId && this.pokemonId > 0) {
          this.loadPokemonById(this.pokemonId);
        }
      } else {
        // Dados válidos, apenas reinicializar interface
        this.initializePokemonData();
      }
    }
  }

  ngOnDestroy() {
    console.log('DetailsModalComponent - ngOnDestroy');

    // ✅ OTIMIZAÇÃO: Limpar timers para evitar memory leaks
    // ✅ CORREÇÃO: loadingDebounceTimer removido - não é mais necessário
    if (this.tabChangeDebounceTimer) {
      clearTimeout(this.tabChangeDebounceTimer);
    }

    this.destroy$.next();
    this.destroy$.complete();
  }

  // Getter para controlar estado da animação de aba
  get tabAnimationState(): string {
    return this.disableTabAnimation ? 'disabled' : this.activeTab;
  }

  private generatePokemonTheme(): void {
    if (!this.pokemon?.types || this.pokemon.types.length === 0) {
      console.log('⚠️ Tipos não encontrados, usando gradiente padrão');
      this.pokemonTheme = this.pokemonThemeService.getDefaultTheme();
      return;
    }

    // ✅ CORREÇÃO: O generateTheme espera o objeto pokemon completo, não apenas os tipos
    console.log(`🎨 Gerando tema para ${this.pokemon.name}:`, { types: this.pokemon.types });

    this.pokemonTheme = this.pokemonThemeService.generateTheme(this.pokemon);

    // ✅ APLICAR CORES NO HEADER: Definir variáveis CSS para o header
    this.applyThemeToHeader();
  }

  private applyThemeToHeader(): void {
    if (!this.pokemonTheme) return;

    // Aplicar variáveis CSS para o header refletir as cores dos badges
    const headerElement = document.querySelector('.pokemon-header-optimized') as HTMLElement;
    if (headerElement) {
      headerElement.style.setProperty('--pokemon-primary-color', this.pokemonTheme.primaryColor);
      headerElement.style.setProperty('--pokemon-secondary-color', this.pokemonTheme.secondaryColor);
      headerElement.style.setProperty('--pokemon-text-color', this.pokemonTheme.textColor);
      headerElement.style.setProperty('--pokemon-shadow-color', this.pokemonTheme.shadowColor);

      console.log('🎨 Tema aplicado ao header:', {
        primary: this.pokemonTheme.primaryColor,
        secondary: this.pokemonTheme.secondaryColor,
        gradient: this.pokemonTheme.gradient
      });
    }
  }



  // Método para resetar dados da evolução quando necessário
  private resetEvolutionData(): void {
    console.log('🔄 Resetando dados da evolução');
    this.evolutionChain = [];
    this.tabDataLoaded['evolution'] = false;
  }

  // Método para resetar dados dos flavor texts quando necessário
  private resetFlavorData(): void {
    console.log('🔄 Resetando dados dos flavor texts');
    this.flavorTexts = [];
    this.flavorText = '';
    this.isLoadingFlavor = false;
    this.tabDataLoaded['curiosities'] = false;
  }

  /**
   * ✅ OTIMIZAÇÃO CRÍTICA: Método otimizado com lazy loading e debounce agressivo
   * Carrega dados apenas quando necessário para melhor performance
   */
  setActiveTab(tab: string): void {
    if (this.activeTab === tab) {
      console.log(`🔄 Já estamos na aba: ${tab}`);
      return;
    }

    console.log(`🔄 Mudança de aba: ${this.activeTab} -> ${tab}`);

    // ✅ OTIMIZAÇÃO CRÍTICA: Debounce mais agressivo para mudanças rápidas
    if (this.tabChangeDebounceTimer) {
      clearTimeout(this.tabChangeDebounceTimer);
    }

    // ✅ OTIMIZAÇÃO: Mudança imediata da aba para responsividade visual
    this.activeTab = tab;

    // ✅ OTIMIZAÇÃO: Debounce apenas para carregamento de dados
    this.tabChangeDebounceTimer = setTimeout(() => {
      // ✅ OTIMIZAÇÃO: Lazy loading - carregar dados apenas quando necessário
      this.loadTabDataIfNeeded(tab);

      // ✅ OTIMIZAÇÃO: Pré-carregar próxima aba provável (com delay maior)
      setTimeout(() => {
        this.preloadNextTabData(tab);
      }, 500); // Delay maior para não interferir com carregamento atual
    }, 100); // 100ms de debounce para carregamento de dados
  }

  private tabChangeDebounceTimer: any;

  /**
   * ✅ OTIMIZAÇÃO: Pré-carregamento inteligente da próxima aba
   */
  private preloadNextTabData(currentTab: string): void {
    const tabSequence = ['overview', 'combat', 'evolution', 'curiosities'];
    const currentIndex = tabSequence.indexOf(currentTab);

    if (currentIndex >= 0 && currentIndex < tabSequence.length - 1) {
      const nextTab = tabSequence[currentIndex + 1];

      // Pré-carregar próxima aba em background após um delay
      setTimeout(() => {
        if (!this.tabDataLoaded[nextTab]) {
          console.log(`🔮 Pré-carregando dados da próxima aba: ${nextTab}`);
          this.loadTabDataIfNeeded(nextTab);
        }
      }, 1000); // 1 segundo de delay para não interferir com a aba atual
    }
  }

  /**
   * ✅ OTIMIZAÇÃO CRÍTICA: Carregamento sob demanda com cache inteligente
   */
  private loadTabDataIfNeeded(tab: string): void {
    if (!this.pokemon) {
      console.warn('❌ loadTabDataIfNeeded: Pokemon não disponível');
      return;
    }

    // ✅ OTIMIZAÇÃO: Verificar cache antes de carregar
    if (this.tabDataLoaded[tab]) {
      console.log(`✅ Dados da aba ${tab} já em cache`);
      return;
    }

    // ✅ OTIMIZAÇÃO: Verificar se já está carregando para evitar duplicação
    if (this.isLoadingTabData) {
      console.log(`⚠️ Já carregando dados de aba, ignorando: ${tab}`);
      return;
    }

    console.log(`🔄 Carregando dados necessários para aba: ${tab}`);

    // ✅ CORREÇÃO: Sistema unificado simples - usar apenas loadTabData
    this.loadTabData(tab);
  }

  // ✅ CORREÇÃO: Método loadTabDataUnified removido - usando apenas loadTabData para simplicidade

  // ✅ CORREÇÃO: Métodos auxiliares do sistema unificado removidos - usando apenas loadTabData simples

  /**
   * ✅ OTIMIZAÇÃO: Carregamento lazy de flavor texts
   */
  private async loadFlavorTextsLazy(): Promise<void> {
    if (!this.pokemon?.id) return;

    try {
      console.log('🔮 Carregando flavor texts em lazy loading...');
      this.flavorTexts = await this.loadFlavorTextsDirectly(this.pokemon.id);
      this.currentFlavorIndex = 0;

      if (this.flavorTexts.length > 0) {
        this.flavorText = this.flavorTexts[0];
      }
    } catch (error) {
      console.error('❌ Erro ao carregar flavor texts:', error);
      this.flavorTexts = [];
    }
  }

  /**
   * ✅ CORREÇÃO: Sistema unificado implementado - usando apenas loadTabData()
   * Métodos específicos por aba removidos para eliminar duplicação
   */

  /**
   * ✅ FASE 1: Método direto para carregar flavor texts PT-BR
   * Prioriza arquivo local antes da API, conforme especificado no plano
   */
  private async loadFlavorTextsDirectly(pokemonId: number): Promise<string[]> {
    // 1. Para português, tentar arquivo local PRIMEIRO
    if (this.translate.currentLang === 'pt-BR' || this.translate.currentLang === 'pt') {
      try {
        const localData = await this.http.get<any>('./assets/data/flavors_ptbr.json').toPromise();
        const localTexts = localData[pokemonId] || localData[pokemonId.toString()];

        if (localTexts && Array.isArray(localTexts) && localTexts.length > 0) {
          console.log(`✅ Flavor texts pt-BR carregados: ${localTexts.length} textos`);
          return localTexts; // PARAR AQUI - não continuar para API
        }
      } catch (error) {
        console.log('📁 Arquivo local não disponível, usando API como fallback');
      }
    }

    // 2. Fallback para API apenas se necessário
    try {
      const species = await this.pokeApiService.getPokemonSpecies(pokemonId).toPromise();
      return this.extractFlavorTextsFromAPI(species);
    } catch (error) {
      console.error('❌ Erro ao carregar flavor texts:', error);
      return ['Descrição não disponível'];
    }
  }

  /**
   * ✅ FASE 1: Extrai flavor texts da API com prioridade de idiomas
   */
  private extractFlavorTextsFromAPI(species: any): string[] {
    if (!species?.flavor_text_entries) return [];

    const currentLang = this.translate.currentLang || 'pt-BR';
    const langMap: { [key: string]: string[] } = {
      'pt-BR': ['pt-br', 'pt', 'en'], // Prioridade clara
      'pt': ['pt-br', 'pt', 'en'],
      'en-US': ['en'],
      'en': ['en']
    };

    const targetLangs = langMap[currentLang] || ['en'];

    for (const lang of targetLangs) {
      const texts = species.flavor_text_entries
        .filter((entry: any) => entry.language.name === lang)
        .map((entry: any) => entry.flavor_text.replace(/\f/g, ' ').replace(/\n/g, ' ').trim())
        .filter((text: string) => text.length > 0);

      if (texts.length > 0) {
        return [...new Set(texts)] as string[]; // Remove duplicatas
      }
    }

    return ['Descrição não disponível'];
  }

  // Métodos para navegação das miniaturas
  canScrollThumbnailsLeft(): boolean {
    // Pode rolar para esquerda se há mais de 5 imagens e não estamos no início
    return this.carouselImages.length > 5 && this.currentCarouselIndex > 0;
  }

  canScrollThumbnailsRight(): boolean {
    // Pode rolar para direita se há mais de 5 imagens e não estamos no final
    return this.carouselImages.length > 5 && this.currentCarouselIndex < this.carouselImages.length - 1;
  }

  scrollThumbnailsLeft(): void {
    if (this.canScrollThumbnailsLeft()) {
      const newIndex = Math.max(0, this.currentCarouselIndex - 1);
      this.selectCarouselImage(newIndex);
    }
  }

  scrollThumbnailsRight(): void {
    if (this.canScrollThumbnailsRight()) {
      const newIndex = Math.min(this.carouselImages.length - 1, this.currentCarouselIndex + 1);
      this.selectCarouselImage(newIndex);
    }
  }




}