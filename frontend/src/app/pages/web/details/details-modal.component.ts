import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy, SimpleChanges, OnChanges, HostBinding, HostListener, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { firstValueFrom, forkJoin } from 'rxjs';
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
  changeDetection: ChangeDetectionStrategy.OnPush, // ✅ PERFORMANCE: OnPush strategy
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

  // ✅ REMOÇÃO COMPLETA: Cache removido - consumo direto da API

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

  // ✅ REMOÇÃO COMPLETA: Sistema de cache de abas removido - carregamento direto

  // ✅ REMOÇÃO COMPLETA: Estados de loading simplificados

  // Propriedades dos flavor texts
  flavorText: string = '';
  flavorTexts: string[] = [];


  currentFlavorIndex: number = 0;
  showScrollIndicator: boolean = false;

  // Propriedades de tema e animação
  pokemonTheme: any = null;
  headerState: string = 'idle';

  // Dados adicionais
  speciesData: any = null;
  evolutionChain: any[] = [];
  abilityDescriptions: { [key: string]: string } = {};
  isSpeciesDataReady = false;

  // ✅ ESTADO DE LOADING ÚNICO E SIMPLES
  private isLoadingPokemonData: boolean = false;
  private isLoadingCombatData: boolean = false;

  // Getter público para verificar estado de loading
  get isLoading(): boolean {
    return this.isLoadingPokemonData;
  }

  // ✅ OTIMIZAÇÃO HEADER: Getter para tema do header
  get headerTheme(): string {
    return this.pokemonTheme?.gradient || 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%)';
  }

  // ✅ CARREGAMENTO INSTANTÂNEO: Getter para verificar se dados básicos estão prontos
  get isBasicDataReady(): boolean {
    return !!this.pokemon && !!this.pokemon.name && !!this.pokemon.id;
  }

  // ✅ PERFORMANCE: Getters memoizados para evitar recálculos no template
  private _memoizedPokemonName: string = '';
  private _memoizedPokemonId: string = '';
  private _memoizedHeight: string = '';
  private _memoizedWeight: string = '';
  private _memoizedBaseExperience: string = '';
  private _memoizedTypes: Array<{name: string, translated: string}> = [];

  get pokemonDisplayName(): string {
    if (!this.pokemon?.name) return '';
    if (this._memoizedPokemonName !== this.pokemon.name) {
      this._memoizedPokemonName = this.pokemon.name.charAt(0).toUpperCase() + this.pokemon.name.slice(1);
    }
    return this._memoizedPokemonName;
  }

  get pokemonDisplayId(): string {
    if (!this.pokemon?.id) return '#000';
    const id = this.pokemon.id.toString();
    if (this._memoizedPokemonId !== id) {
      this._memoizedPokemonId = '#' + id.padStart(3, '0');
    }
    return this._memoizedPokemonId;
  }

  get pokemonDisplayHeight(): string {
    if (!this.pokemon?.height) return '0m';
    const height = ((this.pokemon.height || 0) / 10).toString() + 'm';
    if (this._memoizedHeight !== height) {
      this._memoizedHeight = height;
    }
    return this._memoizedHeight;
  }

  get pokemonDisplayWeight(): string {
    if (!this.pokemon?.weight) return '0kg';
    const weight = ((this.pokemon.weight || 0) / 10).toString() + 'kg';
    if (this._memoizedWeight !== weight) {
      this._memoizedWeight = weight;
    }
    return this._memoizedWeight;
  }

  get pokemonDisplayBaseExperience(): string {
    if (!this.pokemon?.base_experience) {
      const notAvailable = this.translate.instant('app.not_available');
      if (this._memoizedBaseExperience !== notAvailable) {
        this._memoizedBaseExperience = notAvailable;
      }
      return this._memoizedBaseExperience;
    }
    const exp = this.pokemon.base_experience.toString();
    if (this._memoizedBaseExperience !== exp) {
      this._memoizedBaseExperience = exp;
    }
    return this._memoizedBaseExperience;
  }

  get pokemonDisplayTypes(): Array<{name: string, translated: string, cssClass: string}> {
    if (!this.pokemon?.types) return [];

    const currentTypes = this.pokemon.types.map((t: any) => t.type.name).join(',');
    const memoizedTypes = this._memoizedTypes.map((t: any) => t.name).join(',');

    if (currentTypes !== memoizedTypes) {
      this._memoizedTypes = this.pokemon.types.map((type: any) => ({
        name: type.type.name,
        translated: this.translate.instant(`types.${type.type.name}`) || type.type.name,
        cssClass: `type-${type.type.name}`
      }));
    }

    return this._memoizedTypes as Array<{name: string, translated: string, cssClass: string}>;
  }

  // ✅ PERFORMANCE: Limpar cache dos getters quando pokémon muda
  private clearMemoizedCache(): void {
    this._memoizedPokemonName = '';
    this._memoizedPokemonId = '';
    this._memoizedHeight = '';
    this._memoizedWeight = '';
    this._memoizedBaseExperience = '';
    this._memoizedTypes = [];
  }

  // ✅ FASE 4: Métodos de verificação simplificados
  isOverviewDataReady(): boolean {
    return !!this.pokemon;
  }

  isCombatDataReady(): boolean {
    // ✅ CORREÇÃO: Verificar se pokemon existe E se as habilidades foram carregadas
    if (!this.pokemon) {
      return false;
    }

    // Se está carregando dados de combate, não está pronto
    if (this.isLoadingCombatData) {
      return false;
    }

    // Se não há habilidades, considerar pronto
    if (!this.pokemon.abilities || this.pokemon.abilities.length === 0) {
      return true;
    }

    // Verificar se todas as habilidades têm descrições carregadas
    const allAbilitiesLoaded = this.pokemon.abilities.every((ability: any) => {
      const description = this.abilityDescriptions[ability.ability.name];
      return description && description !== this.translate.instant('app.loading');
    });

    return allAbilitiesLoaded;
  }

  isEvolutionDataReady(): boolean {
    return !!this.pokemon;
  }

  isCuriositiesDataReady(): boolean {
    return !!this.pokemon && this.flavorTexts.length > 0;
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
    private pokeApiService: PokeApiService,
    private cdr: ChangeDetectorRef // ✅ PERFORMANCE: ChangeDetectorRef para OnPush
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
   * ✅ CARREGAMENTO INSTANTÂNEO: Dados básicos imediatos + flavor texts em background
   * Informações básicas aparecem em < 100ms, flavor texts carregam assincronamente
   */
  private async loadPokemonDetailsDirectly(id: number): Promise<void> {
    this.isLoadingPokemonData = true;

    try {
      // ✅ FASE 1: CARREGAMENTO IMEDIATO DOS DADOS BÁSICOS
      const [pokemon, species] = await Promise.all([
        firstValueFrom(this.pokeApiService.getPokemon(id)),
        firstValueFrom(this.pokeApiService.getPokemonSpecies(id))
      ]);

      // ✅ DISPONIBILIZAR DADOS BÁSICOS IMEDIATAMENTE
      this.pokemon = pokemon;
      this.speciesData = species;
      this.isSpeciesDataReady = !!this.speciesData;

      // ✅ PERFORMANCE: Limpar cache dos getters para novo pokémon
      this.clearMemoizedCache();

      // ✅ CONFIGURAR CARROSSEL IMEDIATAMENTE
      this.carouselImages = this.pokemonDetailsManager.generateCarouselImages(pokemon);

      // ✅ INICIALIZAR DADOS BÁSICOS IMEDIATAMENTE (sem aguardar flavor texts)
      this.initializePokemonData();

      // ✅ PARAR LOADING DAS INFORMAÇÕES BÁSICAS
      this.isLoadingPokemonData = false;

      // ✅ PERFORMANCE: Trigger change detection manual para OnPush
      this.cdr.detectChanges();

      // ✅ FASE 2: CARREGAR FLAVOR TEXTS EM BACKGROUND (não bloqueia UI)
      this.loadFlavorTextsInBackground(id);

    } catch (error) {
      console.error('❌ Erro ao carregar detalhes do Pokémon:', error);
      this.handleLoadingError(id, error);
    }
  }

  /**
   * ✅ CARREGAMENTO ASSÍNCRONO: Flavor texts em background sem bloquear UI
   * Permite que informações básicas apareçam imediatamente
   */
  private async loadFlavorTextsInBackground(id: number): Promise<void> {
    try {
      // Carregar flavor texts sem bloquear a UI
      this.flavorTexts = await this.loadFlavorTextsDirectly(id);
      this.currentFlavorIndex = 0;

      // Atualizar flavor text atual se há textos disponíveis
      if (this.flavorTexts && this.flavorTexts.length > 0) {
        this.flavorText = this.flavorTexts[0];
      }

      console.log('✅ Flavor texts carregados em background:', this.flavorTexts.length);
    } catch (error) {
      console.error('❌ Erro ao carregar flavor texts em background:', error);
      // Definir fallback sem interromper a experiência do usuário
      this.flavorTexts = ['Descrição não disponível'];
      this.currentFlavorIndex = 0;
      this.flavorText = this.flavorTexts[0];
    }
  }

  /**
   * ✅ GESTÃO DE ERRO ROBUSTA: Tratamento de erros sem dependência de cache
   * Cria dados de fallback e notifica o usuário adequadamente
   */
  private handleLoadingError(id?: number, error?: any): void {
    console.error('❌ Erro ao carregar dados do Pokémon:', error);

    // Determinar tipo de erro para melhor tratamento
    const errorType = this.determineErrorType(error);
    console.log(`🔍 Tipo de erro identificado: ${errorType}`);

    // Criar pokemon placeholder com dados básicos
    if (id) {
      this.pokemon = this.createPlaceholderPokemon(id);
      this.speciesData = this.createPlaceholderSpecies(id);
      this.flavorTexts = this.getErrorFlavorTexts(errorType);
      this.currentFlavorIndex = 0;
    }

    // Configurar carrossel com imagem de erro
    this.carouselImages = this.createErrorCarouselImages();

    // Inicializar dados mesmo com erro
    this.initializePokemonData();
    this.isLoadingPokemonData = false;

    // Log para debugging
    console.log('🔧 Dados de fallback criados para recuperação de erro');
  }

  /**
   * ✅ GESTÃO DE ERRO: Determina o tipo de erro para tratamento adequado
   */
  private determineErrorType(error: any): string {
    if (!error) return 'unknown';

    if (error.status === 404) return 'not_found';
    if (error.status === 0 || error.name === 'NetworkError') return 'network';
    if (error.status >= 500) return 'server';
    if (error.name === 'TimeoutError') return 'timeout';

    return 'unknown';
  }

  /**
   * ✅ GESTÃO DE ERRO: Cria flavor texts apropriados para cada tipo de erro
   */
  private getErrorFlavorTexts(errorType: string): string[] {
    const errorMessages: { [key: string]: string[] } = {
      'not_found': ['Pokémon não encontrado na base de dados.'],
      'network': ['Erro de conexão. Verifique sua internet e tente novamente.'],
      'server': ['Servidor temporariamente indisponível. Tente novamente em alguns minutos.'],
      'timeout': ['Tempo limite excedido. Tente novamente.'],
      'unknown': ['Erro desconhecido ao carregar dados do Pokémon.']
    };

    return errorMessages[errorType] || errorMessages['unknown'];
  }

  /**
   * ✅ GESTÃO DE ERRO: Cria species placeholder para dados de fallback
   */
  private createPlaceholderSpecies(id: number) {
    return {
      id: id,
      name: 'pokemon-desconhecido',
      flavor_text_entries: [],
      egg_groups: [],
      habitat: null,
      generation: { name: 'unknown' }
    };
  }

  /**
   * ✅ GESTÃO DE ERRO: Cria imagens de carrossel para erro
   */
  private createErrorCarouselImages() {
    const errorImage = this.ensureValidImage();
    return [
      {
        url: errorImage,
        label: 'Imagem não disponível',
        type: 'error'
      }
    ];
  }

  private createPlaceholderPokemon(id: number) {
    const placeholderImage = this.ensureValidImage();
    return {
      id: id,
      name: 'Pokémon Desconhecido',
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

    // ✅ REMOÇÃO COMPLETA: Sistema de cache de abas removido

    // Resetar estado das abas
    this.activeTab = 'overview';
    this.isTabTransitioning = false;
    this.isOverviewCombatTransition = false;
    this.disableTabAnimation = false;
    this.isLoadingCombatData = false; // ✅ CORREÇÃO: Reset loading state
    this.abilityDescriptions = {}; // ✅ CORREÇÃO: Clear ability descriptions for fresh data

    // ✅ OTIMIZAÇÃO HEADER: Configuração paralela de tema e carrossel
    this.generatePokemonTheme();

    // Configurar carrossel (já foi feito no loadPokemonDetailsDirectly)
    if (!this.carouselImages || this.carouselImages.length === 0) {
      this.setupCarousel();
    } else {
      this.updateCurrentCarouselImage();
    }

    console.log('✅ Inicialização completa:', {
      pokemon: !!this.pokemon,
      activeTab: this.activeTab,
      isOverviewDataReady: this.isOverviewDataReady(),
      note: 'Dados carregados diretamente da API'
    });
  }

  /**
   * ✅ PERFORMANCE: Remoção do setTimeout desnecessário
   * Animações executam imediatamente após view init
   */
  ngAfterViewInit() {
    // ✅ REMOÇÃO COMPLETA: setTimeout removido - animações imediatas
    this.animateElements();
  }

  /**
   * ✅ OTIMIZAÇÃO HEADER: Configuração direta do carrossel sem logs
   */
  setupCarousel() {
    // ✅ CARREGAMENTO DIRETO: Gerar imagens do carrossel
    this.carouselImages = this.pokemonDetailsManager.generateCarouselImages(this.pokemon);

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

  /**
   * ✅ PERFORMANCE: Transição otimizada usando ViewChild em vez de querySelector
   */
  private animateFlavorTransition(callback: () => void): void {
    // ✅ OTIMIZAÇÃO: Usar ViewChild se disponível, senão callback direto
    if (this.flavorTextWrapper?.nativeElement) {
      const element = this.flavorTextWrapper.nativeElement;
      element.classList.add('flavor-transition');

      // ✅ PERFORMANCE: Usar requestAnimationFrame em vez de setTimeout
      requestAnimationFrame(() => {
        callback();
        requestAnimationFrame(() => {
          element.classList.remove('flavor-transition');
        });
      });
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

  /**
   * ✅ OTIMIZAÇÃO HEADER: Navegação otimizada do carrossel
   */
  previousCarouselImage(): void {
    this.currentImageIndex = this.currentImageIndex > 0
      ? this.currentImageIndex - 1
      : this.carouselImages.length - 1;
    this.updateCurrentCarouselImage();
  }

  nextCarouselImage(): void {
    this.currentImageIndex = this.currentImageIndex < this.carouselImages.length - 1
      ? this.currentImageIndex + 1
      : 0;
    this.updateCurrentCarouselImage();
  }

  /**
   * ✅ OTIMIZAÇÃO HEADER: Seleção direta de imagem sem forçar atualização
   */
  selectCarouselImage(index: number): void {
    this.currentImageIndex = index;
    this.currentCarouselIndex = index;
    this.updateCurrentCarouselImage();
    // ✅ REMOÇÃO COMPLETA: updateCarouselView() removido - desnecessário
  }

  /**
   * ✅ OTIMIZAÇÃO HEADER: Atualização direta do carrossel sem setTimeout
   */
  private updateCarouselView(): void {
    // ✅ REMOÇÃO COMPLETA: setTimeout removido - atualização direta
    const offset = this.getThumbnailSlideOffset();
    // Log removido para produção
  }

  /**
   * ✅ OTIMIZAÇÃO HEADER: Cálculo otimizado do offset das miniaturas
   */
  getThumbnailSlideOffset(): number {
    const thumbnailWidth = 52; // largura da miniatura (44px) + gap (8px)
    const maxVisible = 5; // Máximo de 5 miniaturas visíveis

    if (this.carouselImages.length <= maxVisible) {
      return 0;
    }

    const centerIndex = Math.floor(maxVisible / 2); // índice 2 (terceira posição)
    let targetOffset = 0;

    if (this.currentCarouselIndex < centerIndex) {
      // Início da lista - não mover, mostrar primeiras 5
      targetOffset = 0;
    } else if (this.currentCarouselIndex >= this.carouselImages.length - centerIndex) {
      // Final da lista - mostrar as últimas 5
      targetOffset = (this.carouselImages.length - maxVisible) * thumbnailWidth;
    } else {
      // Meio da lista - centralizar a miniatura ativa na posição central
      targetOffset = (this.currentCarouselIndex - centerIndex) * thumbnailWidth;
    }

    return -targetOffset;
  }

  /**
   * ✅ OTIMIZAÇÃO HEADER: Atualização direta da imagem do carrossel
   */
  private updateCurrentCarouselImage(): void {
    const imageUrl = this.carouselImages[this.currentImageIndex]?.url || '';
    this.currentCarouselImage = this.isValidImageUrl(imageUrl)
      ? imageUrl
      : this.ensureValidImage();
    this.currentCarouselIndex = this.currentImageIndex;
    // ✅ REMOÇÃO COMPLETA: Log removido para produção
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

  /**
   * ✅ PERFORMANCE: Handler otimizado de carregamento de imagem
   */
  onImageLoad(event: any): void {
    // ✅ OTIMIZAÇÃO: Remoção mínima de classe de erro se necessário
    const container = event.target.closest('.main-image-container');
    if (container?.classList.contains('image-failed')) {
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
    // ✅ REMOÇÃO COMPLETA: Estados de loading intermediários removidos
  }

  private cleanupDataForTabSwitch(fromTab: string, toTab: string): void {
    console.log(`🧹 Limpeza seletiva: ${fromTab} -> ${toTab}`);

    // Limpar apenas dados que NÃO pertencem à nova aba
    switch (toTab) {
      case 'overview':
        // Dados básicos já disponíveis
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

  /**
   * ✅ REMOÇÃO COMPLETA: Carregamento direto e simples para todas as abas
   * Sem cache, sem lazy loading - dados carregados sob demanda
   */
  loadTabData(tab: string): void {
    console.log(`🎯 Carregando dados da aba: ${tab}`);

    if (!this.pokemon) {
      console.error('❌ loadTabData: Pokemon não disponível');
      return;
    }

    // ✅ CARREGAMENTO DIRETO: Sempre carregar dados frescos da API
    switch (tab) {
      case 'overview':
        // Overview já tem dados básicos carregados
        console.log('✅ Overview: dados básicos já disponíveis');
        break;

      case 'curiosities':
        // Flavor texts já carregados no loadPokemonDetailsDirectly
        console.log('✅ Curiosities: flavor texts já disponíveis');
        break;

      case 'combat':
      case 'evolution':
        // ✅ CORREÇÃO: Definir estado de loading específico para combat
        if (tab === 'combat') {
          this.isLoadingCombatData = true;
        }

        // Carregar dados específicos via PokemonDetailsManager
        this.pokemonDetailsManager.loadTabData(tab, this.pokemon, this.speciesData)
          .pipe(takeUntil(this.destroy$))
          .subscribe({
            next: (tabData) => {
              console.log(`✅ Dados da aba ${tab} carregados:`, tabData);
              this.processTabData(tab, tabData);

              // ✅ CORREÇÃO: Limpar estado de loading específico
              if (tab === 'combat') {
                this.isLoadingCombatData = false;
              }
            },
            error: (error) => {
              console.error(`❌ Erro ao carregar dados da aba ${tab}:`, error);
              this.handleTabLoadingError(tab, error);

              // ✅ CORREÇÃO: Limpar estado de loading em caso de erro
              if (tab === 'combat') {
                this.isLoadingCombatData = false;
              }
            }
          });
        break;

      default:
        console.warn(`⚠️ Aba desconhecida: ${tab}`);
        break;
    }
  }

  /**
   * ✅ CORREÇÃO URGENTE: Processar dados de abas específicas
   */
  private processTabData(tab: string, tabData: any): void {
    switch (tab) {
      case 'combat':
        // Combat retorna diretamente as descrições das habilidades
        if (tabData && typeof tabData === 'object') {
          this.abilityDescriptions = { ...this.abilityDescriptions, ...tabData };
          console.log('⚔️ Habilidades carregadas:', Object.keys(tabData));
        }
        break;

      case 'evolution':
        // Evolution retorna diretamente o array da cadeia
        if (tabData && Array.isArray(tabData)) {
          this.evolutionChain = tabData;
          console.log('🔄 Cadeia de evolução carregada:', tabData.length, 'estágios');
        }
        break;

      default:
        console.log(`📊 Dados processados para aba ${tab}:`, tabData);
        break;
    }
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
        // ✅ REMOÇÃO COMPLETA: Estado de loading removido
        // Não limpar abilityDescriptions pois são dados pequenos e podem ser reutilizados
        break;

      case 'combat':
        // Limpar dados não relacionados ao combate
        this.evolutionChain = [];
        this.flavorTexts = [];
        this.flavorText = '';
        // ✅ REMOÇÃO COMPLETA: Estado de loading removido
        break;

      case 'evolution':
        // Limpar dados não relacionados à evolução
        this.flavorTexts = [];
        this.flavorText = '';
        // ✅ REMOÇÃO COMPLETA: Estado de loading removido
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

      // ✅ PERFORMANCE: Timeout removido - scroll indicator atualizado via scroll events
      // O indicador será atualizado automaticamente quando o usuário rolar
    }
  }

  // ✅ PERFORMANCE: Métodos de animação removidos - estavam vazios e consumindo CPU
  private animateElements(): void {
    // ✅ REMOÇÃO COMPLETA: Métodos de animação vazios removidos
    // Animações CSS são aplicadas automaticamente via classes
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

      // ✅ REMOÇÃO COMPLETA: Cache removido - dados sempre recarregados

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

    // ✅ CORREÇÃO P5: Timers de debounce removidos - não são mais necessários

    // ✅ REMOÇÃO COMPLETA: Cache removido - sem necessidade de limpeza



    this.destroy$.next();
    this.destroy$.complete();
  }

  // Getter para controlar estado da animação de aba
  get tabAnimationState(): string {
    return this.disableTabAnimation ? 'disabled' : this.activeTab;
  }

  /**
   * ✅ OTIMIZAÇÃO HEADER: Geração direta do tema sem logs excessivos
   */
  private generatePokemonTheme(): void {
    if (!this.pokemon?.types || this.pokemon.types.length === 0) {
      this.pokemonTheme = this.pokemonThemeService.getDefaultTheme();
      return;
    }

    // ✅ GERAÇÃO DIRETA: Criar tema baseado nos tipos do pokémon
    this.pokemonTheme = this.pokemonThemeService.generateTheme(this.pokemon);

    // ✅ APLICAÇÃO SIMPLIFICADA: Tema aplicado via template binding
    this.applyThemeToHeader();
  }

  /**
   * ✅ OTIMIZAÇÃO HEADER: Aplicação de tema via ViewChild ou binding direto
   * Remove querySelector custoso e aplica tema diretamente
   */
  private applyThemeToHeader(): void {
    if (!this.pokemonTheme) return;

    // ✅ OTIMIZAÇÃO: Usar binding direto no template em vez de DOM manipulation
    // As variáveis CSS são aplicadas via [style.background] no template HTML
    // Removida manipulação DOM custosa com querySelector

    // ✅ REMOÇÃO COMPLETA: Log removido para produção
  }



  // Método para resetar dados da evolução quando necessário
  private resetEvolutionData(): void {
    console.log('🔄 Resetando dados da evolução');
    this.evolutionChain = [];
  }

  // Método para resetar dados dos flavor texts quando necessário
  private resetFlavorData(): void {
    console.log('🔄 Resetando dados dos flavor texts');
    this.flavorTexts = [];
    this.flavorText = '';
    // ✅ REMOÇÃO COMPLETA: Estado de loading removido
    // ✅ REMOÇÃO COMPLETA: Cache removido
  }

  /**
   * ✅ GESTÃO DE ERRO: Tratamento específico para erros de carregamento de abas
   */
  private handleTabLoadingError(tab: string, error: any): void {
    const errorType = this.determineErrorType(error);
    console.log(`🔍 Erro na aba ${tab} - Tipo: ${errorType}`);

    // Definir dados de fallback específicos por aba
    switch (tab) {
      case 'combat':
        // Para aba de combate, mostrar dados básicos se disponíveis
        if (this.pokemon?.stats) {
          console.log('✅ Usando dados básicos de stats para aba combat');
        }
        break;

      case 'evolution':
        // Para evolução, limpar dados e mostrar mensagem
        this.evolutionChain = [];
        console.log('🔄 Dados de evolução limpos devido ao erro');
        break;

      default:
        console.log(`⚠️ Erro genérico na aba ${tab}`);
        break;
    }
  }

  /**
   * ✅ CORREÇÃO P5: Método simplificado - removido debounce e pré-carregamento desnecessários
   * Carregamento direto para melhor responsividade
   */
  setActiveTab(tab: string): void {
    if (this.activeTab === tab) {
      console.log(`🔄 Já estamos na aba: ${tab}`);
      return;
    }

    console.log(`🎯 Mudando para aba: ${tab}`);

    // ✅ REMOÇÃO COMPLETA: Mudança imediata da aba e carregamento direto
    this.activeTab = tab;
    this.loadTabData(tab);
  }

  // ✅ CORREÇÃO P5: tabChangeDebounceTimer removido - debounce desnecessário

  // ✅ CORREÇÃO P5: Método preloadNextTabData removido - pré-carregamento desnecessário para dados pequenos

  // ✅ REMOÇÃO COMPLETA: Método loadTabDataIfNeeded removido - carregamento direto implementado

  // ✅ CORREÇÃO: Método loadTabDataUnified removido - usando apenas loadTabData para simplicidade

  // ✅ REMOÇÃO COMPLETA: Método loadFlavorTextsForTab removido - dados carregados diretamente

  // ✅ CORREÇÃO P5: Método loadFlavorTextsLazy removido - redundante com loadFlavorTextsForTab

  /**
   * ✅ CORREÇÃO: Sistema unificado implementado - usando apenas loadTabData()
   * Métodos específicos por aba removidos para eliminar duplicação
   */

  /**
   * ✅ REMOÇÃO COMPLETA: Método simplificado para carregar flavor texts PT-BR
   * Sem cache - consumo direto da API e arquivo local
   */
  private async loadFlavorTextsDirectly(pokemonId: number): Promise<string[]> {
    // 1. Para português, tentar arquivo local PRIMEIRO
    if (this.translate.currentLang === 'pt-BR' || this.translate.currentLang === 'pt') {
      try {
        const localData = await firstValueFrom(
          this.http.get<any>('./assets/data/flavors_ptbr.json')
        );
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
      const species = await firstValueFrom(
        this.pokeApiService.getPokemonSpecies(pokemonId)
      );
      const apiTexts = this.extractFlavorTextsFromAPI(species);
      return apiTexts;
    } catch (error) {
      console.error('❌ Erro ao carregar flavor texts:', error);
      const errorType = this.determineErrorType(error);
      return this.getErrorFlavorTexts(errorType);
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

  /**
   * ✅ OTIMIZAÇÃO HEADER: Navegação otimizada das miniaturas
   */
  canScrollThumbnailsLeft(): boolean {
    return this.carouselImages.length > 5 && this.currentCarouselIndex > 0;
  }

  canScrollThumbnailsRight(): boolean {
    return this.carouselImages.length > 5 && this.currentCarouselIndex < this.carouselImages.length - 1;
  }

  scrollThumbnailsLeft(): void {
    if (this.canScrollThumbnailsLeft()) {
      this.selectCarouselImage(Math.max(0, this.currentCarouselIndex - 1));
    }
  }

  scrollThumbnailsRight(): void {
    if (this.canScrollThumbnailsRight()) {
      this.selectCarouselImage(Math.min(this.carouselImages.length - 1, this.currentCarouselIndex + 1));
    }
  }

}