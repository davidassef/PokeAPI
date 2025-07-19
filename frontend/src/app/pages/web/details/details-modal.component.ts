import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy, SimpleChanges, OnChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { modalAnimations } from './modal.animations';
import { ViewedPokemonService } from '../../../core/services/viewed-pokemon.service';
import { PokemonDetailsManager } from '../../../core/services/pokemon-details-manager.service';
import { PokemonThemeService } from '../../../core/services/pokemon-theme.service';
import { PokemonNavigationService } from '../../../core/services/pokemon-navigation.service';

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

  // Métodos de verificação de dados para as abas
  isOverviewDataReady(): boolean {
    return !!this.pokemon && this.tabDataLoaded['overview'];
  }

  isCombatDataReady(): boolean {
    return !!this.pokemon && this.tabDataLoaded['combat'];
  }

  isEvolutionDataReady(): boolean {
    return !!this.pokemon && this.tabDataLoaded['evolution'];
  }

  isCuriositiesDataReady(): boolean {
    return !!this.pokemon && this.tabDataLoaded['curiosities'];
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
    private viewedPokemonService: ViewedPokemonService,
    private pokemonDetailsManager: PokemonDetailsManager,
    private pokemonThemeService: PokemonThemeService,
    private pokemonNavigationService: PokemonNavigationService
  ) {}

  ngOnInit() {
    console.log('🚀 DetailsModalComponent - ngOnInit:', {
      pokemon: !!this.pokemon,
      pokemonId: this.pokemonId,
      isOpen: this.isOpen,
      timestamp: new Date().toISOString()
    });

    if (this.pokemon) {
      console.log('✅ Pokemon já disponível, inicializando dados');
      this.initializePokemonData();
    } else if (this.pokemonId && this.pokemonId > 0) {
      console.log('🔍 Carregando Pokemon com PokemonDetailsManager');
      this.loadPokemonById(this.pokemonId);
    } else {
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

    console.log(`🔍 Carregando dados do Pokémon ID: ${id}`);
    this.isLoadingPokemonData = true;

    this.pokemonDetailsManager.loadPokemonDetails(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (enrichedData) => {
          console.log('🎉 Dados enriquecidos carregados:', enrichedData.pokemon?.name);
          this.pokemon = enrichedData.pokemon;
          this.speciesData = enrichedData.species;
          this.flavorTexts = enrichedData.flavorTexts;
          this.abilityDescriptions = enrichedData.abilityDescriptions;
          this.carouselImages = enrichedData.carouselImages;

          if (this.flavorTexts.length > 0) {
            this.flavorText = this.flavorTexts[0];
            this.currentFlavorIndex = 0;
          }

          this.isSpeciesDataReady = !!this.speciesData;
          this.initializePokemonData();
          this.isLoadingPokemonData = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar dados do Pokémon:', error);
          this.pokemon = this.createPlaceholderPokemon(id);
          this.initializePokemonData();
          this.isLoadingPokemonData = false;
        }
      });
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

    // Resetar todos os dados de abas
    this.tabDataLoaded = {
      overview: false,
      combat: false,
      evolution: false,
      curiosities: false
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

    // Carregar dados da aba ativa (overview por padrão)
    console.log('🎯 Carregando dados da aba ativa:', this.activeTab);
    this.loadTabData(this.activeTab);

    console.log('✅ Inicialização completa. Estado final:', {
      pokemon: !!this.pokemon,
      activeTab: this.activeTab,
      tabDataLoaded: this.tabDataLoaded,
      isOverviewDataReady: this.isOverviewDataReady()
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
    const methodKey = method.toLowerCase().replace(/\s+/g, '_');
    const translated = this.translate.instant(`evolution.methods.${methodKey}`);
    return translated !== `evolution.methods.${methodKey}` ? translated : method;
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
          habitat: this.translate.instant(`habitats.${this.speciesData.habitat.name}`)
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
    console.log('✅ Imagem carregada com sucesso:', event.target.src);
    // Remover classe de erro se existir
    const container = event.target.closest('.main-image-container');
    if (container) {
      container.classList.remove('image-failed');
    }
  }

  onImageError(event: any): void {
    const failedUrl = event.target.src;
    const elementInfo = {
      className: event.target.className,
      alt: event.target.alt,
      parent: event.target.parentElement?.className
    };

    console.warn('❌ Erro ao carregar imagem:', failedUrl);
    console.warn('📍 Elemento:', elementInfo);

    // Evitar loop infinito - verificar se já não é um placeholder
    if (!failedUrl.includes('pokemon-placeholder.png') &&
        !failedUrl.includes('placeholder.png') &&
        !failedUrl.includes('pokeball.png') &&
        !failedUrl.includes('data:image/svg+xml')) {
      const placeholderPath = this.ensureValidImage();
      console.log('🔄 Tentando carregar placeholder:', placeholderPath);
      event.target.src = placeholderPath;
    } else {
      // Se até o placeholder falhar, ocultar a imagem e mostrar mensagem
      console.error('💥 Falha crítica: não foi possível carregar nem o placeholder');
      event.target.style.display = 'none';

      // Adicionar classe para mostrar placeholder alternativo
      const container = event.target.closest('.main-image-container, .evolution-image, .thumbnail-btn-inline');
      if (container) {
        container.classList.add('image-failed');
      }
    }
  }  // Métodos das abas
  setActiveTab(tab: string): void {
    if (this.activeTab === tab) {
      console.log(`🔄 Já estamos na aba: ${tab}, ignorando mudança`);
      return; // Se já estamos na aba, não fazer nada
    }

    console.log(`🔄 Mudança de aba: ${this.activeTab} -> ${tab}`);

    const previousTab = this.activeTab;

    // CONTROLE ESPECÍFICO para Overview ↔ Combat
    const isOverviewCombatSwitch = (
      (previousTab === 'overview' && tab === 'combat') ||
      (previousTab === 'combat' && tab === 'overview')
    );

    // CONTROLE ESPECÍFICO para Evolution - forçar recarregamento se necessário
    if (tab === 'evolution' && this.evolutionChain.length === 0) {
      console.log(`🧬 Voltando para aba de evolução com dados limpos - forçando reset`);
      this.resetEvolutionData();
    }

    // CONTROLE ESPECÍFICO para Curiosities - forçar recarregamento se necessário
    if (tab === 'curiosities' && this.flavorTexts.length === 0) {
      console.log(`🍃 Voltando para aba de curiosidades com dados limpos - forçando reset`);
      this.resetFlavorData();
    }

    if (isOverviewCombatSwitch) {
      console.log(`🎯 TRANSIÇÃO OVERVIEW ↔ COMBAT DETECTADA: ${previousTab} -> ${tab}`);
      this.isOverviewCombatTransition = true;

      // MANTER ANIMAÇÃO ATIVA para transições Overview ↔ Combat
      // this.disableTabAnimation = true; // REMOVIDO - permitir animação

      // LIMPEZA IMEDIATA E SÍNCRONA - sem delays
      this.instantCleanupOverviewCombat(previousTab, tab);
    }

    this.activeTab = tab;

    // Para outras transições, usar método normal
    if (!isOverviewCombatSwitch) {
      this.cleanupDataForTabSwitch(previousTab, tab);
    }

    // Carregar dados específicos da aba sob demanda
    this.loadTabData(tab);

    // Liberar controle específico após um tempo mínimo
    if (isOverviewCombatSwitch) {
      setTimeout(() => {
        this.isOverviewCombatTransition = false;
        // Animação permanece ativa (não desabilitar)
        // this.disableTabAnimation = false; // REMOVIDO
        console.log(`✅ Transição Overview ↔ Combat finalizada`);
      }, 250); // Aumentado para 250ms para coincidir com a duração da animação
    }
  }

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

    // Limpeza geral para ambas as direções
    this.evolutionChain = [];
    this.flavorTexts = [];
    this.flavorText = '';
    this.isLoadingFlavor = false;
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
        // Dados de combate serão carregados pelo loadTabData
        if (!this.tabDataLoaded['combat']) {
          this.loadTabData('combat');
        }
        break;

      case 'evolution':
        // Dados de evolução serão carregados pelo loadTabData
        if (!this.tabDataLoaded['evolution']) {
          this.loadTabData('evolution');
        }
        break;

      case 'curiosities':
        // Dados de curiosidades serão carregados pelo loadTabData
        if (!this.tabDataLoaded['curiosities']) {
          this.loadTabData('curiosities');
        }
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

    // Usar o PokemonDetailsManager para carregar dados específicos da aba
    this.pokemonDetailsManager.loadTabData(this.pokemon.id, tab)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tabData) => {
          console.log(`✅ Dados da aba ${tab} carregados:`, tabData);

          switch (tab) {
            case 'overview':
              this.tabDataLoaded['overview'] = true;
              break;

            case 'combat':
              if (tabData.abilityDescriptions) {
                this.abilityDescriptions = { ...this.abilityDescriptions, ...tabData.abilityDescriptions };
              }
              this.tabDataLoaded['combat'] = true;
              break;

            case 'evolution':
              if (tabData.evolutionChain) {
                this.evolutionChain = tabData.evolutionChain;
              }
              if (tabData.speciesData) {
                this.speciesData = tabData.speciesData;
                this.isSpeciesDataReady = true;
              }
              this.tabDataLoaded['evolution'] = true;
              break;

            case 'curiosities':
              if (tabData.speciesData) {
                this.speciesData = tabData.speciesData;
                this.isSpeciesDataReady = true;
              }
              if (tabData.flavorTexts && tabData.flavorTexts.length > 0) {
                this.flavorTexts = tabData.flavorTexts;
                this.flavorText = this.flavorTexts[0];
                this.currentFlavorIndex = 0;
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
    console.log('Animação do header iniciada');
  }

  private animateStats(): void {
    console.log('Animação das stats iniciada');
  }

  private animateCards(): void {
    console.log('Animação dos cards iniciada');
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

  getStatPercentage(baseStat: number): number {
    // Normalizar stat para porcentagem (máximo teórico de 255)
    return Math.min((baseStat / 255) * 100, 100);
  }

  // Método auxiliar para garantir que há sempre uma imagem válida
  ensureValidImage(): string {
    const fallbacks = [
      'assets/img/pokemon-placeholder.png',
      'assets/img/placeholder.png',
      'assets/img/pokeball.png',
      // Data URL como fallback absoluto
      'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgdmlld0JveD0iMCAwIDIwMCAyMDAiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik0xMDAgMTAwTTEwMCA2MEM3Ny45MDg2IDYwIDYwIDc3LjkwODYgNjAgMTAwQzYwIDEyMi4wOTEgNzcuOTA4NiAxNDAgMTAwIDE0MEM1MS44NjI5IDE0MCAxNDAgMTIyLjA5MSAxNDAgMTAwQzE0MCA3Ny45MDg2IDEyMi4wOTEgNjAgMTAwIDYwWiIgZmlsbD0iIzk5OTk5OSIvPgo8L3N2Zz4K'
    ];

    // Retorna o primeiro fallback (assumindo que existe)
    return fallbacks[0];
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

    if (changes['pokemonId'] && changes['pokemonId'].currentValue !== changes['pokemonId'].previousValue) {
      if (changes['pokemonId'].currentValue && changes['pokemonId'].currentValue > 0) {
        this.loadPokemonById(changes['pokemonId'].currentValue);
      }
    }

    // ✅ CORREÇÃO: Tratamento otimizado de reabertura do modal
    if (changes['isOpen'] && changes['isOpen'].currentValue === true &&
        changes['isOpen'].previousValue === false) {
      console.log('🔄 Modal reaberto - reinicializando dados');

      // ✅ CORREÇÃO: Limpar subscriptions existentes e recriar destroy$ para evitar problemas de estado
      this.destroy$.next();
      this.destroy$.complete();
      this.destroy$ = new Subject<void>();

      // Recarregar dados se temos pokemonId
      if (this.pokemonId && this.pokemonId > 0) {
        this.loadPokemonById(this.pokemonId);
      } else if (this.pokemon) {
        // Se já temos dados do pokemon, apenas reinicializar
        this.initializePokemonData();
      }

      // ✅ CORREÇÃO: Reconfigurar listener de mudança de idioma após recriar destroy$
      this.translate.onLangChange
        .pipe(takeUntil(this.destroy$))
        .subscribe(() => {
          this.onLanguageChange();
        });
    }
  }

  ngOnDestroy() {
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

    const pokemonTypes = this.pokemon.types.map((type: any) => type.type.name);
    console.log(`🎨 Gerando tema para ${this.pokemon.name}:`, { types: pokemonTypes });

    this.pokemonTheme = this.pokemonThemeService.generateTheme(pokemonTypes);
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