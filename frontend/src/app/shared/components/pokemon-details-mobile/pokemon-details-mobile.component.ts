import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ViewedPokemonService } from '../../../core/services/viewed-pokemon.service';
import { PokemonCacheService } from '../../../core/services/pokemon-cache.service';

@Component({
  selector: 'app-pokemon-details-mobile',
  templateUrl: './pokemon-details-mobile.component.html',
  styleUrls: ['./pokemon-details-mobile.component.scss']
})
export class PokemonDetailsMobileComponent implements OnInit, OnDestroy {
  @Input() pokemonId: number = 0;
  @Input() isOpen: boolean = false;
  @Output() modalClosed = new EventEmitter<void>();

  pokemon: any = null;
  loading: boolean = true;
  activeTab: string = 'overview';

  // Carrossel de imagens aprimorado
  carouselImages: any[] = [];
  currentCarouselIndex: number = 0;
  currentCarouselImage: string = '';
  carouselTransitioning: boolean = false;
  imageLoading: boolean = false;
  imageZoomed: boolean = false;

  // Controle de gestos
  private touchStartX: number = 0;
  private touchStartY: number = 0;
  private touchStartTime: number = 0;
  private readonly SWIPE_THRESHOLD = 50;
  private readonly SWIPE_TIME_THRESHOLD = 300;

  // Controle de cache
  showCacheStats: boolean = false; // Ativar apenas em desenvolvimento
  isDataCached: boolean = false;

  // Dados das abas
  pokemonSpecies: any = null;
  evolutionChain: any[] = [];
  flavorTexts: string[] = []; // Mudança: array de strings como no modal web
  currentFlavorIndex: number = 0; // Índice do flavor atual
  isLoadingFlavor: boolean = false; // Estado de carregamento dos flavors

  // Estados de carregamento
  speciesLoading: boolean = false;
  evolutionLoading: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private http: HttpClient,
    private viewedPokemonService: ViewedPokemonService,
    private cacheService: PokemonCacheService
  ) {}

  ngOnInit() {
    console.log('🚀 PokemonDetailsMobileComponent - ngOnInit:', {
      pokemonId: this.pokemonId,
      isOpen: this.isOpen,
      timestamp: new Date().toISOString()
    });

    // Adicionar classe modal-open ao body para controlar z-index dos FABs
    if (this.isOpen) {
      document.body.classList.add('modal-open');
    }

    // Ativar indicador de cache apenas em desenvolvimento
    this.showCacheStats = true; // Sempre ativo para demonstração

    if (this.pokemonId && this.pokemonId > 0) {
      this.loadPokemonData();
    } else {
      console.warn('⚠️ PokemonDetailsMobileComponent - pokemonId inválido:', this.pokemonId);
    }
  }

  ngOnDestroy() {
    // Remover classe modal-open do body
    document.body.classList.remove('modal-open');

    this.destroy$.next();
    this.destroy$.complete();
  }

  private loadPokemonData() {
    this.loading = true;
    console.log('🔍 Carregando dados do Pokémon ID:', this.pokemonId);

    // Verificar se dados estão em cache antes da requisição
    const cacheKey = `https://pokeapi.co/api/v2/pokemon/${this.pokemonId}`;
    const startTime = Date.now();

    // Usar cache service em vez de HTTP direto
    this.cacheService.getPokemon(this.pokemonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pokemon: any) => {
          const loadTime = Date.now() - startTime;
          this.isDataCached = loadTime < 50; // Se carregou muito rápido, provavelmente veio do cache

          console.log('✅ Dados do Pokémon carregados:', pokemon.name,
                     `(${loadTime}ms, ${this.isDataCached ? 'CACHE' : 'API'})`);

          this.pokemon = pokemon;
          this.initializePokemonData();
          this.loading = false;

          // Pré-carregar Pokémon adjacentes para melhor UX
          this.cacheService.preloadAdjacentPokemon(this.pokemonId);
        },
        error: (error) => {
          console.error('❌ Erro ao carregar Pokémon:', error);
          this.pokemon = this.createPlaceholderPokemon();
          this.loading = false;
          this.isDataCached = false;
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
        label: 'modal.image_placeholder'
      }];
      this.currentCarouselIndex = 0;
      this.currentCarouselImage = this.carouselImages[0].url;
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

    // Definir imagem atual
    this.currentCarouselIndex = 0;
    this.currentCarouselImage = this.carouselImages[0]?.url || '';
  }



  private loadSpeciesData() {
    // Usar cache service para dados da espécie
    this.isLoadingFlavor = true;
    this.cacheService.getPokemonSpecies(this.pokemonId)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (species: any) => {
          this.pokemonSpecies = species;
          this.loadFlavorTexts(species);
          this.loadEvolutionChain(species.evolution_chain?.url);
        },
        error: (error) => {
          console.error('❌ Erro ao carregar dados da espécie:', error);
          this.isLoadingFlavor = false;
        }
      });
  }

  private async loadFlavorTexts(species: any) {
    const currentLang = this.translate.currentLang || 'pt-BR';
    console.log(`🔍 Carregando flavor texts para idioma: ${currentLang}`);

    // Tentar usar cache inteligente primeiro
    this.cacheService.getFlavorTexts(this.pokemonId, currentLang)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cachedFlavors: string[]) => {
          if (cachedFlavors && cachedFlavors.length > 0) {
            console.log(`✅ Flavor texts obtidos do cache: ${cachedFlavors.length} textos`);
            this.flavorTexts = cachedFlavors;
            this.currentFlavorIndex = 0;
            this.isLoadingFlavor = false;

            // Pré-carregar flavor texts dos Pokémon adjacentes
            this.cacheService.preloadAdjacentPokemon(this.pokemonId, currentLang);
            return;
          }

          // Fallback para método anterior se cache não retornar dados
          this.loadFlavorTextsFallback(species, currentLang);
        },
        error: (error) => {
          console.error('❌ Erro ao buscar flavor texts do cache:', error);
          this.loadFlavorTextsFallback(species, currentLang);
        }
      });
  }

  private async loadFlavorTextsFallback(species: any, currentLang: string) {
    // Para pt-BR, sempre usar tradução local primeiro
    if (currentLang === 'pt-BR' || currentLang === 'pt') {
      console.log('🇧🇷 Idioma português detectado, priorizando traduções locais');
      await this.loadFlavorTextFromLocalThenAPI(species);
      return;
    }

    // Para outros idiomas, usar dados da espécie diretamente
    this.extractFlavorTexts(species);
    this.isLoadingFlavor = false;
  }

  private async loadFlavorTextFromLocalThenAPI(species: any): Promise<void> {
    console.log('🔍 Iniciando busca com prioridade para traduções locais...');

    // Primeiro tentar buscar localmente (somente para português)
    const localTranslations = await this.getLocalTranslations(this.pokemonId);

    if (localTranslations && localTranslations.length > 0) {
      console.log('✅ Usando traduções locais encontradas');
      this.flavorTexts = localTranslations;
      this.currentFlavorIndex = 0;
      this.isLoadingFlavor = false;
      return;
    }

    // Se não encontrar localmente, usar dados da espécie
    console.log('🔄 Traduções locais não encontradas, usando dados da espécie...');
    this.extractFlavorTexts(species);
    this.isLoadingFlavor = false;
  }

  private async getLocalTranslations(pokemonId: number): Promise<string[] | null> {
    try {
      console.log('🔍 Buscando traduções locais para Pokémon ID:', pokemonId);

      // Tentar carregar as traduções locais
      const localFlavors = await this.http.get('/assets/data/flavors_ptbr.json').toPromise() as any;

      if (localFlavors && localFlavors[pokemonId]) {
        console.log('✅ Traduções locais encontradas!');
        return localFlavors[pokemonId];
      }

      console.log('⚠️ Nenhuma tradução local encontrada para este Pokémon');
      return null;
    } catch (error) {
      console.log('❌ Erro ao carregar traduções locais:', error);
      return null;
    }
  }

  private extractFlavorTexts(species: any) {
    if (!species.flavor_text_entries) {
      this.flavorTexts = [];
      this.currentFlavorIndex = 0;
      return;
    }

    const currentLang = this.translate.currentLang || 'pt-BR';
    console.log(`🔍 Extraindo flavor texts para idioma: ${currentLang}`);

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

    const targetLanguages = apiLangMap[currentLang] || ['en'];

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
        entry.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ')
      );

      // Remover duplicatas baseado no conteúdo
      const uniqueFlavors = flavorStrings.filter((flavor: string, index: number, array: string[]) => {
        return array.findIndex((f: string) => f.trim() === flavor.trim()) === index;
      });

      this.flavorTexts = uniqueFlavors;
      console.log(`✅ Flavor texts processados: ${targetEntries.length} → ${uniqueFlavors.length}`);
    }

    this.currentFlavorIndex = 0;
  }

  // Métodos de navegação de flavors (seguindo padrão do modal web)
  getCurrentFlavorText(): string {
    if (!this.flavorTexts || this.flavorTexts.length === 0) {
      return this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
    }
    return this.flavorTexts[this.currentFlavorIndex] || this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
  }

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

  private loadEvolutionChain(url: string) {
    if (!url) return;

    this.evolutionLoading = true;
    // Usar cache service para cadeia de evolução
    this.cacheService.getEvolutionChain(url)
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

  private processEvolutionChain(chain: any) {
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
    const matches = url.match(/\/(\d+)\/$/);
    return matches ? parseInt(matches[1], 10) : 0;
  }

  // Métodos do carrossel aprimorados
  nextCarouselImage() {
    if (this.carouselImages.length > 1 && !this.carouselTransitioning) {
      this.carouselTransitioning = true;
      this.imageLoading = true;

      setTimeout(() => {
        this.currentCarouselIndex = (this.currentCarouselIndex + 1) % this.carouselImages.length;
        this.currentCarouselImage = this.carouselImages[this.currentCarouselIndex].url;
      }, 150);
    }
  }

  previousCarouselImage() {
    if (this.carouselImages.length > 1 && !this.carouselTransitioning) {
      this.carouselTransitioning = true;
      this.imageLoading = true;

      setTimeout(() => {
        this.currentCarouselIndex = this.currentCarouselIndex === 0
          ? this.carouselImages.length - 1
          : this.currentCarouselIndex - 1;
        this.currentCarouselImage = this.carouselImages[this.currentCarouselIndex].url;
      }, 150);
    }
  }

  selectCarouselImage(index: number) {
    if (!this.carouselTransitioning && index !== this.currentCarouselIndex) {
      this.carouselTransitioning = true;
      this.imageLoading = true;

      setTimeout(() => {
        this.currentCarouselIndex = index;
        this.currentCarouselImage = this.carouselImages[index].url;
      }, 150);
    }
  }

  // Métodos das abas - estáticas
  setActiveTab(tab: string) {
    this.activeTab = tab;
  }

  // Métodos de utilidade
  getTranslatedTypeName(typeName: string): string {
    return this.translate.instant(`types.${typeName}`) || typeName;
  }

  getTranslatedStatName(statName: string): string {
    return this.translate.instant(`stats.${statName}`) || statName;
  }

  getStatPercentage(baseStat: number): number {
    return Math.min((baseStat / 255) * 100, 100);
  }

  isValidImageUrl(url: string): boolean {
    return !!(url && url.trim() !== '' && !url.includes('null'));
  }

  getTotalStats(): number {
    if (!this.pokemon?.stats) return 0;
    return this.pokemon.stats.reduce((sum: number, stat: any) => sum + stat.base_stat, 0);
  }

  // Métodos de stats categorizados (compatibilidade com modal web)
  getOffensiveStats(): any[] {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter((stat: any) =>
      ['attack', 'special-attack'].includes(stat.stat.name)
    );
  }

  getDefensiveStats(): any[] {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter((stat: any) =>
      ['defense', 'special-defense', 'hp'].includes(stat.stat.name)
    );
  }

  getUtilityStats(): any[] {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter((stat: any) =>
      ['speed'].includes(stat.stat.name)
    );
  }

  onImageError(event: any) {
    console.warn('Erro ao carregar imagem:', event.target.src);
  }

  // Métodos para as novas abas
  getStatColor(baseStat: number): string {
    if (baseStat >= 100) return '#4ade80'; // Verde
    if (baseStat >= 70) return '#fbbf24';  // Amarelo
    if (baseStat >= 40) return '#fb923c';  // Laranja
    return '#ef4444'; // Vermelho
  }

  getAbilityDescription(abilityName: string): string {
    const description = this.translate.instant(`abilities.${abilityName}`);
    return description !== `abilities.${abilityName}` ? description : this.translate.instant('modal.NO_ABILITY_DESCRIPTION_AVAILABLE');
  }

  // Métodos de evolução
  isEvolutionChainReady(): boolean {
    return this.evolutionChain && this.evolutionChain.length > 0;
  }

  ensureValidImage(): string {
    return 'assets/img/pokemon-placeholder.png';
  }

  getEvolutionMethodText(method: string): string {
    return this.translate.instant(`evolution.methods.${method}`) || method;
  }

  getEvolutionTriggerText(trigger: string): string {
    // Converter trigger para formato correto (level-up -> level_up)
    const triggerKey = trigger.replace(/-/g, '_');
    return this.translate.instant(`evolution.triggers.${triggerKey}`) || trigger;
  }

  // Métodos de curiosidades
  getCaptureRate(): string {
    if (!this.pokemonSpecies?.capture_rate) {
      return this.translate.instant('app.not_available');
    }
    return this.pokemonSpecies.capture_rate.toString();
  }

  getPokemonColor(): string {
    const colorName = this.pokemonSpecies?.color?.name;
    if (!colorName) return this.translate.instant('app.not_available');

    const translated = this.translate.instant(`colors.${colorName}`);
    return translated !== `colors.${colorName}` ? translated : colorName;
  }

  // Métodos do carrossel aprimorado
  getImageTypeName(index: number): string {
    if (!this.carouselImages[index]) return '';

    // Usar o label da imagem que já está traduzido
    const label = this.carouselImages[index].label;
    return this.translate.instant(label) || label;
  }

  onImageLoad(): void {
    this.imageLoading = false;
    this.carouselTransitioning = false;
  }

  toggleImageZoom(): void {
    this.imageZoomed = !this.imageZoomed;
  }

  // Métodos de gestos para carrossel
  onTouchStart(event: TouchEvent): void {
    this.touchStartX = event.touches[0].clientX;
    this.touchStartY = event.touches[0].clientY;
    this.touchStartTime = Date.now();
  }

  onTouchMove(event: TouchEvent): void {
    // Prevenir scroll durante swipe horizontal no carrossel
    const deltaX = Math.abs(event.touches[0].clientX - this.touchStartX);
    const deltaY = Math.abs(event.touches[0].clientY - this.touchStartY);

    // Só prevenir scroll se movimento horizontal for significativamente maior que vertical
    if (deltaX > deltaY && deltaX > 15) {
      event.preventDefault();
    }
  }

  onTouchEnd(event: TouchEvent): void {
    const touchEndX = event.changedTouches[0].clientX;
    const touchEndTime = Date.now();
    const deltaX = touchEndX - this.touchStartX;
    const deltaTime = touchEndTime - this.touchStartTime;

    if (Math.abs(deltaX) > this.SWIPE_THRESHOLD && deltaTime < this.SWIPE_TIME_THRESHOLD) {
      if (deltaX > 0) {
        this.previousCarouselImage();
      } else {
        this.nextCarouselImage();
      }
    }
  }

  onPan(event: any): void {
    // Implementar feedback visual durante pan
    if (Math.abs(event.deltaX) > 10) {
      // Adicionar classe de transição
    }
  }

  onPanEnd(event: any): void {
    if (Math.abs(event.deltaX) > this.SWIPE_THRESHOLD) {
      if (event.deltaX > 0) {
        this.previousCarouselImage();
      } else {
        this.nextCarouselImage();
      }
    }
  }

  // Navegação entre abas - apenas clique (sem gestos)
  private tabs = ['overview', 'combat', 'evolution', 'curiosities'];

  // Fechar modal
  closeModal() {
    // Remover classe modal-open do body
    document.body.classList.remove('modal-open');
    this.modalClosed.emit();
  }

  onBackdropClick(event: Event) {
    if (event.target === event.currentTarget) {
      this.closeModal();
    }
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

    if (this.pokemon) {
      // Trivia baseada em stats
      const totalStats = this.getTotalStats();
      if (totalStats > 600) {
        trivia.push(this.translate.instant('details.trivia.legendary_stats'));
      } else if (totalStats > 500) {
        trivia.push(this.translate.instant('details.trivia.exceptional_stats'));
      }

      // Trivia baseada em peso e altura
      const weight = this.pokemon.weight / 10;
      const height = this.pokemon.height / 10;

      if (weight > 100) {
        trivia.push(this.translate.instant('details.trivia.very_heavy', { weight }));
      }

      if (height > 2) {
        trivia.push(this.translate.instant('details.trivia.very_tall', { height }));
      }

      // Trivia baseada em tipos
      if (this.pokemon.types) {
        const typeNames = this.pokemon.types.map((t: any) => t.type.name);

        if (typeNames.includes('dragon')) {
          trivia.push(this.translate.instant('details.trivia.dragon_type'));
        }

        if (typeNames.includes('psychic')) {
          trivia.push(this.translate.instant('details.trivia.psychic_type'));
        }

        if (typeNames.includes('ghost')) {
          trivia.push(this.translate.instant('details.trivia.ghost_type'));
        }

        if (typeNames.length === 2) {
          const translatedTypes = typeNames.map((t: any) => this.getTranslatedTypeName(t)).join(' e ');
          trivia.push(this.translate.instant('details.trivia.dual_type', { types: translatedTypes }));
        }
      }

      // Trivia baseada em experiência
      if (this.pokemon.base_experience && this.pokemon.base_experience > 250) {
        trivia.push(this.translate.instant('details.trivia.high_experience'));
      }

      // Easter eggs específicos
      if (this.pokemon.id === 1) {
        trivia.push(this.translate.instant('details.trivia.bulbasaur_first'));
      }

      if (this.pokemon.id === 150) {
        trivia.push(this.translate.instant('details.trivia.mewtwo_origin'));
      }

      if (this.pokemon.id === 151) {
        trivia.push(this.translate.instant('details.trivia.mew_original'));
      }

      if (this.pokemon.id === 25) {
        trivia.push(this.translate.instant('details.trivia.pikachu_mascot'));
      }
    }

    // Se não houver trivia específica, adicionar uma genérica
    if (trivia.length === 0) {
      trivia.push(this.translate.instant('details.trivia.generic'));
    }

    return trivia;
  }
}
