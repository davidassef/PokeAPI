import { Component, OnInit, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ViewedPokemonService } from '../../../core/services/viewed-pokemon.service';
import { PokemonCacheHelper } from '../../../core/services/pokemon-cache-helper.service';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { CapturedService } from '../../../core/services/captured.service';
import { AuthService } from '../../../core/services/auth.service';
import { AudioService } from '../../../core/services/audio.service';
import { ToastNotificationService } from '../../../core/services/toast-notification.service';

@Component({
  selector: 'app-pokemon-details-mobile',
  templateUrl: './pokemon-details-mobile.component.html',
  styleUrls: ['./pokemon-details-mobile.component.scss']
})
export class PokemonDetailsMobileComponent implements OnInit, OnChanges, OnDestroy {
  @Input() pokemonId: number = 0;
  @Input() isOpen: boolean = false;
  @Output() modalClosed = new EventEmitter<void>();

  pokemon: any = null;
  loading: boolean = true;
  activeTab: string = 'overview';

  // Carrossel de imagens aprimorado
  carouselImages: any[] = [];
  public currentCarouselIndex: number = 0;
  currentCarouselImage: string = '';
  carouselTransitioning: boolean = false;
  imageLoading: boolean = false;
  public isImageZoomed: boolean = false;

  /**
   * Obtém a taxa de captura do Pokémon
   * @returns A taxa de captura formatada ou 'N/A' se não disponível
   */
  getCaptureRate(): string {
    if (!this.pokemonSpecies || this.pokemonSpecies.capture_rate === undefined) {
      return 'N/A';
    }
    // A taxa de captura é um valor entre 0-255, onde 255 é o mais fácil de capturar
    const captureRate = this.pokemonSpecies.capture_rate;
    const capturePercentage = ((captureRate / 255) * 100).toFixed(1);
    return `${captureRate} (${capturePercentage}%)`;
  }

  /**
   * Obtém a cor predominante do Pokémon
   * @returns O nome da cor em português ou 'N/A' se não disponível
   */
  getPokemonColor(): string {
    if (!this.pokemonSpecies || !this.pokemonSpecies.color) {
      return 'N/A';
    }

    // Mapeamento de cores para português
    const colorMap: {[key: string]: string} = {
      'black': 'Preto',
      'blue': 'Azul',
      'brown': 'Marrom',
      'gray': 'Cinza',
      'green': 'Verde',
      'pink': 'Rosa',
      'purple': 'Roxo',
      'red': 'Vermelho',
      'white': 'Branco',
      'yellow': 'Amarelo'
    };

    const colorName = this.pokemonSpecies.color.name;
    return colorMap[colorName] || this.capitalizeFirstLetter(colorName) || 'N/A';
  }

  /**
   * Capitaliza a primeira letra de uma string
   * @param str String para capitalizar
   * @returns String com a primeira letra maiúscula
   */
  private capitalizeFirstLetter(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  // Controle de gestos
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private readonly SWIPE_THRESHOLD = 50;
  private readonly SWIPE_TIME_THRESHOLD = 300;



  // Dados das abas
  pokemonSpecies: any = null;
  evolutionChain: any[] = [];
  flavorTexts: string[] = []; // Mudança: array de strings como no modal web
  currentFlavorIndex: number = 0; // Índice do flavor atual
  isLoadingFlavor: boolean = false; // Estado de carregamento dos flavors
  private currentLang: string = ''; // Rastrear o idioma atual

  // Estados de carregamento
  speciesLoading: boolean = false;
  evolutionLoading: boolean = false;

  private destroy$ = new Subject<void>();
  private langChangeSubscription: any; // Adicionar esta linha
  private modalRef: HTMLIonModalElement | null = null;

  // ✅ NOVO: Propriedades do sistema de captura
  showCaptureButton = true;
  isCaptured = false;
  isCaptureLoading = false; // ✅ CORREÇÃO: Renomeado para evitar conflito
  isProcessing = false;
  private capturedSubscription?: any;

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private http: HttpClient,
    private viewedPokemonService: ViewedPokemonService,
    private pokemonCacheHelper: PokemonCacheHelper,
    private pokeApiService: PokeApiService,
    private changeDetectorRef: ChangeDetectorRef,
    private capturedService: CapturedService, // ✅ NOVO: Serviço de captura
    private authService: AuthService, // ✅ NOVO: Serviço de autenticação
    private audioService: AudioService, // ✅ NOVO: Serviço de áudio
    private toastNotification: ToastNotificationService // ✅ NOVO: Serviço de notificações
  ) {}

  ngOnInit() {
    // ✅ LIMPEZA: Log de inicialização removido - componente estável
    // console.log('🚀 PokemonDetailsMobileComponent - ngOnInit:', {
    //   pokemonId: this.pokemonId,
    //   isOpen: this.isOpen,
    //   timestamp: new Date().toISOString()
    // });

    // Adicionar classe modal-open ao body para controlar z-index dos FABs
    if (this.isOpen) {
      document.body.classList.add('modal-open');
    }



    if (this.pokemonId && this.pokemonId > 0) {
      this.loadPokemonData();
    } else {
      console.warn('⚠️ PokemonDetailsMobileComponent - pokemonId inválido:', this.pokemonId);
    }

    // ✅ NOVO: Inicializar estado de captura
    this.initializeCaptureState();

    // Subscrever a mudanças de idioma
    this.langChangeSubscription = this.translate.onLangChange.subscribe((event: any) => {
      if (this.pokemonSpecies) {
        this.loadFlavorTexts(); // Recarregar os flavor texts quando o idioma mudar
        this.updateStaticTranslations(); // Atualizar também as traduções estáticas
      }
    });
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('PokemonDetailsMobileComponent - ngOnChanges', changes);

    if (changes['pokemonId'] && changes['pokemonId'].currentValue !== changes['pokemonId'].previousValue) {
      if (changes['pokemonId'].currentValue && changes['pokemonId'].currentValue > 0) {
        this.loadPokemonData();
      }
    }

    // Add this block to handle modal reopen events
    if (changes['isOpen'] && changes['isOpen'].currentValue === true &&
        changes['isOpen'].previousValue === false) {
      console.log('Modal reopened - reloading data');
      if (this.pokemonId && this.pokemonId > 0) {
        this.loadPokemonData();
      }
    }
  }

  ngOnDestroy() {
    // Remover classe modal-open do body
    document.body.classList.remove('modal-open');

    this.destroy$.next();
    this.destroy$.complete();

    if (this.langChangeSubscription) {
      this.langChangeSubscription.unsubscribe(); // Cancelar a subscription
    }

    // ✅ NOVO: Limpar subscription de captura
    if (this.capturedSubscription) {
      this.capturedSubscription.unsubscribe();
    }
  }

  private loadPokemonData() {
    this.loading = true;
    console.log('🔍 Carregando dados do Pokémon ID:', this.pokemonId);



    // Usar PokeApiService refatorado para consistência
    console.log('📦 Buscando dados do Pokémon no PokeApiService...');
    this.pokeApiService.getPokemon(this.pokemonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pokemon: any) => {
          console.log('✅ Dados do Pokémon carregados:', pokemon.name);

          this.pokemon = pokemon;
          this.initializePokemonData();
          this.loading = false;

          // Pré-carregar Pokémon adjacentes para melhor UX
          this.pokemonCacheHelper.preloadAdjacentPokemon(this.pokemonId);
        },
        error: (error) => {
          console.error('❌ Erro ao carregar Pokémon:', error);
          this.pokemon = this.createPlaceholderPokemon();
          this.loading = false;
          console.log('🔄 Placeholder Pokémon criado devido ao erro');
        }
      });
  }

  private createPlaceholderPokemon() {
    return {
      id: this.pokemonId,
      name: 'unknown',
      types: [{ type: { name: 'unknown' } }],
      stats: [],
      abilities: [],
      height: 0,
      weight: 0,
      sprites: {
        other: {
          'official-artwork': { front_default: null }
        }
      }
    };
  }

  private initializePokemonData() {
    if (!this.pokemon) return;

    // Marcar como visualizado
    this.viewedPokemonService.markPokemonAsViewed(this.pokemon.id);

    // Configurar carrossel de imagens
    this.setupImageCarousel();

    // Carregar dados da espécie
    this.loadSpeciesData();
  }

  private setupImageCarousel() {
    this.carouselImages = [];
    const sprites = this.pokemon?.sprites;
    const fallbackImage = 'assets/img/pokemon-placeholder.png';

    console.log('🖼️ Configurando carrossel mobile para:', this.pokemon?.name);
    console.log('Sprites disponíveis:', sprites);

    if (!sprites) {
      this.carouselImages = [{
        url: fallbackImage,
        label: 'modal.official_artwork'
      }];
      this.currentCarouselIndex = 0;
      this.updateCurrentCarouselImage();
      return;
    }

    // Criar array completo de imagens com todas as variações (igual ao modal web)
    const potentialImages = [
      {
        url: sprites?.other?.['official-artwork']?.front_default,
        label: 'modal.official_artwork'
      },
      {
        url: sprites?.other?.dream_world?.front_default,
        label: 'modal.dream_world'
      },
      {
        url: sprites?.other?.home?.front_default,
        label: 'modal.home'
      },
      {
        url: sprites?.other?.['official-artwork']?.front_shiny,
        label: 'modal.artwork_shiny'
      },
      {
        url: sprites?.front_default,
        label: 'modal.front_default'
      },
      {
        url: sprites?.back_default,
        label: 'modal.back_default'
      },
      {
        url: sprites?.front_shiny,
        label: 'modal.front_shiny'
      },
      {
        url: sprites?.back_shiny,
        label: 'modal.back_shiny'
      },
      {
        url: sprites?.front_female,
        label: 'modal.front_female'
      },
      {
        url: sprites?.back_female,
        label: 'modal.back_female'
      },
      {
        url: sprites?.front_shiny_female,
        label: 'modal.front_shiny_female'
      },
      {
        url: sprites?.back_shiny_female,
        label: 'modal.back_shiny_female'
      }
    ];

    // Filtrar apenas imagens válidas
    this.carouselImages = potentialImages
      .filter(image => this.isValidImageUrl(image.url))
      .map(image => ({
        url: image.url,
        label: image.label
      }));

    // Se não há imagens válidas, usar apenas o placeholder
    if (this.carouselImages.length === 0) {
      console.warn('⚠️ Nenhuma imagem válida encontrada, usando placeholder');
      this.carouselImages = [{
        url: fallbackImage,
        label: 'modal.image_placeholder'
      }];
    }

    console.log('📱 Imagens do carrossel mobile:', this.carouselImages.length, 'imagens');

    // Definir imagem atual usando o método centralizado
    this.currentCarouselIndex = 0;
    this.updateCurrentCarouselImage();
  }

  public isValidImageUrl(url: string): boolean {
    return !!url && url.startsWith('http');
  }

  // Métodos de Estatísticas e Utilidades
  getTotalStats(): number {
    if (!this.pokemon?.stats?.length) return 0;
    return this.pokemon.stats.reduce((sum: number, stat: any) => sum + stat.base_stat, 0);
  }

  getOffensiveStats(): any[] {
    if (!this.pokemon?.stats) return [];
    const offensiveStats = ['attack', 'special-attack', 'speed'];
    return this.pokemon.stats.filter((stat: any) =>
      offensiveStats.includes(stat.stat.name)
    );
  }

  getDefensiveStats(): any[] {
    if (!this.pokemon?.stats) return [];
    const defensiveStats = ['defense', 'special-defense', 'hp'];
    return this.pokemon.stats.filter((stat: any) =>
      defensiveStats.includes(stat.stat.name)
    );
  }

  getUtilityStats(): any[] {
    if (!this.pokemon?.stats) return [];
    const utilityStats = ['speed', 'hp'];
    return this.pokemon.stats.filter((stat: any) =>
      utilityStats.includes(stat.stat.name)
    );
  }

  getStatPercentage(stat: number): number {
    return Math.min(100, (stat / 255) * 100);
  }

  getStatColor(stat: number): string {
    const percentage = stat / 255;

    if (percentage >= 0.7) return '#4caf50'; // Verde
    if (percentage >= 0.4) return '#ffc107'; // Amarelo
    return '#f44336'; // Vermelho
  }

  private loadSpeciesData() {
    // Atualizar o idioma atual antes de carregar os dados
    this.currentLang = this.translate.currentLang || 'pt-BR';
    console.log(`🌐 Idioma atual: ${this.currentLang}`);

    // Usar cache service para dados da espécie
    this.isLoadingFlavor = true;
    this.flavorTexts = []; // Limpar flavor texts antigos
    this.currentFlavorIndex = 0; // Resetar índice do flavor

    this.pokeApiService.getPokemonSpecies(this.pokemonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (species: any) => {
          this.pokemonSpecies = species;
          // Carregar flavor texts com base no idioma atual
          this.loadFlavorTexts();
          if (species.evolution_chain?.url) {
            this.loadEvolutionChain(species.evolution_chain.url);
          }
        },
        error: (error) => {
          console.error('❌ Erro ao carregar dados da espécie:', error);
          this.isLoadingFlavor = false;
        }
      });
  }

  private async loadFlavorTexts() { // Remover o parâmetro species
    if (!this.pokemonSpecies) {
      return;
    }
    // Atualizar o idioma atual
    const newLang = this.translate.currentLang || 'pt-BR';
    const langChanged = this.currentLang !== newLang;
    this.currentLang = newLang;

    // Limpar os textos existentes se o idioma mudou
    if (langChanged) {
      this.flavorTexts = [];
    }

    // Se já temos textos carregados e o idioma não mudou, não precisamos recarregar
    if (this.flavorTexts.length > 0 && !langChanged) {
      this.isLoadingFlavor = false;
      return;
    }

    this.isLoadingFlavor = true;
    console.log(`🔍 Carregando flavor texts para idioma: ${this.currentLang}`);

    try {
      // Apenas tenta carregar traduções locais se for português
      if (this.currentLang === 'pt-BR' || this.currentLang === 'pt') {
        console.log('🌐 Tentando carregar traduções locais para português...');
        const localTranslations = await this.getLocalTranslations(this.pokemonId);

        if (localTranslations && localTranslations.length > 0) {
          console.log('✅ Usando traduções locais do arquivo JSON');
          this.flavorTexts = localTranslations;
          this.currentFlavorIndex = 0;
          this.isLoadingFlavor = false;
          return;
        }
      }

      // Para outros idiomas ou se não encontrar traduções locais, extrair da API
      console.log(`ℹ️ Extraindo flavor texts da API para idioma: ${this.currentLang}`);
      this.extractFlavorTexts(this.pokemonSpecies);

    } catch (error) {
      console.error('❌ Erro ao carregar traduções:', error);
      // Em caso de erro, tentar extrair dos dados da espécie como fallback
      this.extractFlavorTexts(this.pokemonSpecies);
    }
  }

  private extractFlavorTexts(species: any) {
    if (!species?.flavor_text_entries) {
      this.flavorTexts = [this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE')];
      this.currentFlavorIndex = 0;
      this.isLoadingFlavor = false;
      return;
    }

    console.log(`🔍 Extraindo flavor texts para idioma: ${this.currentLang}`);

    // Mapear idioma do translate para formato da PokeAPI
    const apiLangMap: { [key: string]: string[] } = {
      'pt-BR': ['pt-br', 'pt'],
      'pt': ['pt-br', 'pt'],
      'en-US': ['en'],
      'en': ['en'],
      'es': ['es'],
      'es-ES': ['es'],
      'ja-JP': ['ja'],
      'ja': ['ja']
    };

    const targetLanguages = apiLangMap[this.currentLang] || ['en'];

    // Buscar entradas no idioma específico
    let targetEntries = species.flavor_text_entries.filter((entry: any) =>
      targetLanguages.includes(entry.language.name)
    );

    // Se não encontrar no idioma específico, usar inglês como fallback
    if (targetEntries.length === 0 && !targetLanguages.includes('en')) {
      console.log('🔄 Tentando fallback para inglês...');
      targetEntries = species.flavor_text_entries.filter((entry: any) => entry.language.name === 'en');
    }

    if (targetEntries.length === 0) {
      console.log('⚠️ Nenhuma entrada encontrada em idiomas suportados');
      this.flavorTexts = [this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE')];
    } else {
      // Converter para array de strings e remover duplicatas
      const flavorStrings = targetEntries.map((entry: any) =>
        entry.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ').trim()
      );

      // Remover duplicatas baseado no conteúdo
      const uniqueFlavors = flavorStrings.filter((flavor: string, index: number, array: string[]) => {
        return array.findIndex((f: string) => f.trim() === flavor.trim()) === index;
      });

      this.flavorTexts = uniqueFlavors;
      console.log(`✅ Flavor texts processados: ${targetEntries.length} → ${uniqueFlavors.length}`);
    }

    this.currentFlavorIndex = 0;
    this.isLoadingFlavor = false;
  }

  private getLocalTranslations(pokemonId: number): Promise<string[] | null> {
    return new Promise((resolve) => {
      try {
        this.http.get<any>('/assets/data/flavors_ptbr.json').subscribe({
          next: (data) => {
            const translations = data[pokemonId];
            if (translations && Array.isArray(translations)) {
              resolve(translations);
            } else {
              resolve(null);
            }
          },
          error: (error) => {
            console.error('Erro ao carregar traduções locais:', error);
            resolve(null);
          }
        });
      } catch (error) {
        console.error('Erro ao processar traduções locais:', error);
        resolve(null);
      }
    });
  }

  // Métodos de navegação de flavors
  previousFlavor(): void {
    if (this.currentFlavorIndex > 0) {
      this.currentFlavorIndex--;
    }
  }

  nextFlavor(): void {
    if (this.currentFlavorIndex < this.flavorTexts.length - 1) {
      this.currentFlavorIndex++;
    }
  }

  // Método para carregar a cadeia de evolução
  private loadEvolutionChain(url: string): void {
    if (!url) return;

    this.evolutionLoading = true;
    this.pokemonCacheHelper.getEvolutionChain(url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (evolution: any) => {
          this.processEvolutionChain(evolution.chain);
          this.evolutionLoading = false;
        },
        error: (error) => {
          console.error('❌ Erro ao carregar cadeia evolutiva:', error);
          this.evolutionLoading = false;
        }
      });
  }

  private processEvolutionChain(chain: any): void {
    const evolutionArray: any[] = [];

    const processChainNode = (node: any) => {
      const pokemonId = this.extractPokemonIdFromUrl(node.species.url);
      evolutionArray.push({
        id: pokemonId,
        name: node.species.name,
        imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
        level: node.evolution_details[0]?.min_level || null,
        method: node.evolution_details[0]?.trigger?.name || 'level',
        trigger: node.evolution_details[0]?.trigger?.name || null
      });

      if (node.evolves_to && node.evolves_to.length > 0) {
        node.evolves_to.forEach((evolution: any) => processChainNode(evolution));
      }
    };

    processChainNode(chain);
    this.evolutionChain = evolutionArray;
  }

  private extractPokemonIdFromUrl(url: string): number {
    const matches = url.match(/\/(\d+)\//);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  // Métodos do modal
  closeModal(): void {
    // Remover classe modal-open do body
    document.body.classList.remove('modal-open');
    // Limpar dados para garantir que sejam recarregados ao reabrir
    this.flavorTexts = [];
    this.currentFlavorIndex = 0;
    this.pokemonSpecies = null;
    this.evolutionChain = [];
    this.isLoadingFlavor = false;
    this.modalClosed.emit();
  }

  /**
   * ✅ CORREÇÃO: Método renomeado e otimizado para não interferir com scroll
   * Só fecha o modal se clicar diretamente no overlay (fora do container)
   */
  onOverlayClick(event: Event): void {
    // Só fecha se o clique foi diretamente no overlay, não em elementos filhos
    if (event.target === event.currentTarget) {
      console.log('[PokemonDetailsMobile] Clique no overlay detectado, fechando modal');
      this.closeModal();
    }
  }

  getEvolutionTriggerText(trigger: any): string {
    if (!trigger || !trigger.trigger) return '';

    const triggerName = trigger.trigger.name;
    const key = `mobile.evolution_triggers.${triggerName}`;

    const params: any = {};
    if (triggerName === 'level-up' && trigger.min_level) {
      params.level = trigger.min_level;
    } else if (trigger.min_happiness) {
      params.happiness = trigger.min_happiness;
    } else if (trigger.item) {
      params.item = trigger.item.name.replace('-', ' ') || 'Unknown Item';
    } else if (trigger.held_item) {
      params.item = trigger.held_item.name.replace('-', ' ') || 'Unknown Item';
    }

    return this.translate.instant(key, params);
  }

  getEvolutionMethodText(method: string): string {
    if (!method) return '';
    const key = `mobile.evolution_methods.${method.replace('-', '_')}`;
    return this.translate.instant(key);
  }

  getTranslatedStatName(statName: string): string {
    const key = `mobile.stats_names.${statName.replace('-', '_')}`;
    return this.translate.instant(key);
  }

  // Métodos adicionais para compatibilidade com modal web
  getBaseExperience(): string {
    return this.pokemon?.base_experience?.toString() || this.translate.instant('app.not_available');
  }

  getBaseHappiness(): string {
    if (!this.pokemonSpecies?.base_happiness) {
      return this.translate.instant('app.not_available');
    }
    return this.pokemonSpecies.base_happiness.toString();
  }

  getPokemonBMI(): string {
    if (!this.pokemon?.height || !this.pokemon?.weight) {
      return this.translate.instant('app.not_available');
    }

    const heightInMeters = this.pokemon.height / 10; // Converte para metros
    const weightInKg = this.pokemon.weight / 10; // Converte para kg
    const bmi = weightInKg / (heightInMeters * heightInMeters);
    const bmiValue = bmi.toFixed(1);

    if (bmi < 18.5) return `${bmiValue} (${this.translate.instant('bmi_categories.light')})`;
    if (bmi < 25) return `${bmiValue} (${this.translate.instant('bmi_categories.normal')})`;
    if (bmi < 30) return `${bmiValue} (${this.translate.instant('bmi_categories.heavy')})`;
    return `${bmiValue} (${this.translate.instant('bmi_categories.very_heavy')})`;
  }

  // ✅ CORREÇÃO: Métodos de toque removidos pois estavam interferindo com scroll
  // Os eventos de toque vazios podem bloquear o comportamento padrão do scroll

  public previousCarouselImage(): void {
    this.currentCarouselIndex =
      (this.currentCarouselIndex - 1 + this.carouselImages.length) %
      this.carouselImages.length;
    this.updateCurrentCarouselImage();
  }

  public nextCarouselImage(): void {
    this.currentCarouselIndex =
      (this.currentCarouselIndex + 1) % this.carouselImages.length;
    this.updateCurrentCarouselImage();
  }

  public selectCarouselImage(index: number): void {
    this.currentCarouselIndex = index;
    this.updateCurrentCarouselImage();
  }

  public getImageTypeName(index: number): string {
    return this.translate.instant(this.carouselImages[index]?.label || '');
  }

  /**
   * 🔧 CORREÇÃO CRÍTICA: Atualiza a imagem atual do carrossel
   * Corrige o problema onde a imagem não mudava apesar do índice ser atualizado
   */
  private updateCurrentCarouselImage(): void {
    if (this.carouselImages && this.carouselImages.length > 0) {
      const imageUrl = this.carouselImages[this.currentCarouselIndex]?.url || '';
      this.currentCarouselImage = this.isValidImageUrl(imageUrl)
        ? imageUrl
        : 'assets/img/pokemon-placeholder.png';

      console.log(`🖼️ [MOBILE] Imagem atualizada: índice ${this.currentCarouselIndex}, URL: ${this.currentCarouselImage}`);
    }
  }

  public onImageLoad(): void {}
  public onImageError(event: Event): void {
    const img = event.target as HTMLImageElement;
    img.src = 'assets/images/pokemon/default.png';
  }

  public toggleImageZoom(): void {
    this.isImageZoomed = !this.isImageZoomed;
  }

  public setActiveTab(tab: string): void {
    this.activeTab = tab;
  }

  public getTranslatedTypeName(typeName: string): string {
    return this.translate.instant(`types.${typeName}`);
  }

  public getAbilityDescription(abilityName: string): string {
    return this.translate.instant(`abilities.${abilityName}`);
  }

  public getCurrentFlavorText(): string {
    return this.flavorTexts[this.currentFlavorIndex] || '';
  }

  public getPokemonTrivia(): string[] {
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
    if (this.pokemonSpecies) {
      if (this.pokemonSpecies.is_legendary) {
        trivia.push(this.translate.instant('mobile.trivia.legendary'));
      }

      if (this.pokemonSpecies.is_mythical) {
        trivia.push(this.translate.instant('mobile.trivia.mythical'));
      }

      if (this.pokemonSpecies.habitat) {
        trivia.push(this.translate.instant('mobile.trivia.habitat', {
          habitat: this.translate.instant(`pokemon.habitats.${this.pokemonSpecies.habitat.name}`)
        }));
      }
    }

    // 5. Garante que temos pelo menos uma curiosidade
    if (trivia.length === 0) {
      trivia.push(this.translate.instant('mobile.trivia.default'));
    }

    return trivia;
  }

  public isEvolutionChainReady(): boolean {
    return !this.evolutionLoading && this.evolutionChain.length > 0;
  }

  public ensureValidImage(): string {
    return 'assets/images/pokemon/default.png';
  }

  /**
   * ✅ FASE 4: Método para validar URLs de imagem antes de usar (Mobile)
   * Aplica o mesmo padrão da FASE 3 para imagens de evolução
   */
  public getValidImageUrl(imageUrl: string | null | undefined): string {
    // Se não há URL ou é inválida, usar fallback imediatamente
    if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
      return this.ensureValidImage();
    }
    return imageUrl;
  }

  private updateStaticTranslations() {
    // Forçar atualização das traduções estáticas
    this.changeDetectorRef.detectChanges();
  }

  public refreshData() {
    this.closeModal();
    this.loadPokemonData();
  }

  // ✅ NOVO: Métodos do sistema de captura

  /**
   * Inicializa o estado de captura do Pokémon
   */
  private initializeCaptureState(): void {
    if (!this.pokemon?.id) return;

    // Verificar se o Pokémon está capturado
    this.capturedSubscription = this.capturedService.captured$.subscribe(captured => {
      this.isCaptured = captured.some(c => c.pokemon_id === this.pokemon.id);
      this.changeDetectorRef.detectChanges();
    });
  }

  /**
   * Manipula o clique no botão de captura/liberação
   * @param event Evento de clique
   */
  async onCaptureClick(event: Event) {
    event.stopPropagation();

    // Evita múltiplos cliques rápidos
    if (this.isProcessing) {
      console.log('[PokemonDetailsMobile] Operação de captura já em andamento, ignorando clique');
      return;
    }

    // Verifica autenticação
    const isAuthenticated = this.authService.isAuthenticated();
    const currentUser = this.authService.getCurrentUser();

    console.log('[PokemonDetailsMobile] Verificação de autenticação:', {
      isAuthenticated,
      hasUser: !!currentUser,
      userId: currentUser?.id
    });

    if (!isAuthenticated || !currentUser) {
      console.log('[PokemonDetailsMobile] Usuário não autenticado, abrindo modal de login');
      await this.openAuthModal();
      return;
    }

    // Inicia o processo de captura/liberação
    this.isProcessing = true;
    this.isCaptureLoading = true; // ✅ CORREÇÃO: Usar propriedade renomeada
    console.log(`[PokemonDetailsMobile] Iniciando ${this.isCaptured ? 'libertação' : 'captura'} do Pokémon ${this.pokemon.id}`);

    // Passa o estado atual para evitar verificação HTTP desnecessária
    this.capturedService.toggleCaptured(this.pokemon, this.isCaptured).subscribe({
      next: (isCaptured) => {
        console.log(`[PokemonDetailsMobile] Pokémon ${this.pokemon.id} ${isCaptured ? 'capturado' : 'liberado'} com sucesso`);
        this.isCaptured = isCaptured;

        // Toca o som de captura/libertação
        this.audioService.playCaptureSound(isCaptured ? 'capture' : 'release')
          .catch(error => console.error('[PokemonDetailsMobile] Erro ao reproduzir som:', error));

        // Exibe mensagem de sucesso usando toast inteligente
        if (isCaptured) {
          this.toastNotification.showPokemonCaptured(this.pokemon.name);
        } else {
          this.toastNotification.showPokemonReleased(this.pokemon.name);
        }

        this.changeDetectorRef.detectChanges();
      },
      error: async (error: any) => {
        console.error('[PokemonDetailsMobile] Erro ao alternar estado de captura:', {
          pokemonId: this.pokemon.id,
          error: error.error || error.message,
          status: error.status
        });

        // Resetar estado de loading imediatamente em caso de erro
        this.isCaptureLoading = false; // ✅ CORREÇÃO: Usar propriedade renomeada
        this.isProcessing = false;

        // Se for erro de autenticação, abrir modal de login novamente
        if (error.status === 401 || error.status === 403) {
          console.log('[PokemonDetailsMobile] Erro de autenticação, abrindo modal de login');
          await this.openAuthModal();
          return;
        }

        // Mensagem de erro adequada com base no status HTTP
        let messageKey = 'capture.error';
        if (error.status === 0) {
          messageKey = 'capture.network_error';
        } else if (error.status === 408 || error.message?.includes('timeout')) {
          messageKey = 'capture.timeout';
        }

        await this.toastNotification.showError(messageKey);
        this.changeDetectorRef.detectChanges();
      },
      complete: () => {
        console.log(`[PokemonDetailsMobile] Operação de ${this.isCaptured ? 'captura' : 'libertação'} concluída`);
        this.isCaptureLoading = false; // ✅ CORREÇÃO: Usar propriedade renomeada
        this.isProcessing = false;

        // Force reset do alinhamento do ícone após operação
        this.forceIconReset();
        this.changeDetectorRef.detectChanges();
      }
    });
  }

  /**
   * Abre modal de autenticação
   */
  private async openAuthModal(): Promise<void> {
    const { AuthModalNewComponent } = await import('../auth-modal-new/auth-modal-new.component');

    const modal = await this.modalController.create({
      component: AuthModalNewComponent,
      cssClass: 'auth-modal-fixed', // ✅ CORREÇÃO: Usar auth-modal-fixed para hierarquia correta
      backdropDismiss: true
    });

    modal.onDidDismiss().then(async (result) => {
      if (result.data?.success) {
        console.log('[PokemonDetailsMobile] Login bem-sucedido');

        // Aguardar um pouco para garantir que o estado foi atualizado
        setTimeout(() => {
          const isAuthenticated = this.authService.isAuthenticated();
          const currentUser = this.authService.getCurrentUser();

          console.log('[PokemonDetailsMobile] Estado após login:', {
            isAuthenticated,
            hasUser: !!currentUser,
            userId: currentUser?.id
          });

          if (isAuthenticated && currentUser) {
            console.log('[PokemonDetailsMobile] Usuário autenticado, tentando capturar novamente');
            this.onCaptureClick(new Event('click'));
          } else {
            console.log('[PokemonDetailsMobile] Usuário ainda não autenticado após login');
          }
        }, 1000);
      } else {
        console.log('[PokemonDetailsMobile] Login cancelado ou falhou');
      }
    });

    return await modal.present();
  }

  /**
   * Force reset do alinhamento do ícone da pokébola
   */
  private forceIconReset(): void {
    // Usar setTimeout para garantir que o DOM foi atualizado
    setTimeout(() => {
      const captureBtn = document.querySelector(`[data-pokemon-id="${this.pokemon.id}"] .mobile-capture-btn`);
      if (captureBtn) {
        // Adicionar classe de reset temporariamente
        captureBtn.classList.add('force-reset');

        // Remover a classe após um breve delay para permitir a transição
        setTimeout(() => {
          captureBtn.classList.remove('force-reset');
        }, 100);
      }
    }, 50);
  }
}
