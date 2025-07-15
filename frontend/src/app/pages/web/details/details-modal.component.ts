import { Component, OnInit, Input, ViewChild, ElementRef, AfterViewInit, Output, EventEmitter, OnDestroy, SimpleChanges, OnChanges } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { HttpClient } from '@angular/common/http';
import { forkJoin, Subject } from 'rxjs';
import { map, takeUntil } from 'rxjs/operators';
import { modalAnimations } from './modal.animations';
import { ViewedPokemonService } from '../../../core/services/viewed-pokemon.service';
import { PokemonCacheService } from '../../../core/services/pokemon-cache.service';

@Component({
  selector: 'app-details-modal',
  templateUrl: './details-modal.component.html',
  styleUrls: ['./details-modal.component.scss'],
  animations: modalAnimations
})
export class DetailsModalComponent implements OnInit, AfterViewInit, OnDestroy, OnChanges {
  @Input() pokemon: any;
  @Input() pokemonId: number = 0; // Adicionar suporte para pokemonId
  @Input() isOpen: boolean = false; // Adicionar input para detectar reopen
  @Output() close = new EventEmitter<void>();
  @ViewChild('flavorTextWrapper', { static: false }) flavorTextWrapper?: ElementRef;

  private destroy$ = new Subject<void>();

  // Propriedades do carrossel
  carouselImages: any[] = [];
  currentImageIndex: number = 0;
  currentCarouselIndex: number = 0;
  currentCarouselImage: string = '';

  // Propriedades das abas
  activeTab: string = 'overview';
  isTabTransitioning: boolean = false; // Flag para controlar transições entre abas

  // Controle específico para debugging Overview ↔ Combat
  isOverviewCombatTransition: boolean = false;
  disableTabAnimation: boolean = false; // Nova propriedade para desabilitar animações

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

  // Add the missing property
  isSpeciesDataReady = false;

  // Métodos de verificação de dados para as abas
  isOverviewDataReady(): boolean {
    return !!this.pokemon;
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
    return this.isSpeciesDataReady && !!this.speciesData;
  }

  shouldShowSpeciesDataInCuriosities(): boolean {
    return this.isSpeciesDataReady && !!this.speciesData;
  }

  isEvolutionChainReady(): boolean {
    return this.evolutionChain.length > 0;
  }

  constructor(
    private modalController: ModalController,
    private translate: TranslateService,
    private http: HttpClient,
    private viewedPokemonService: ViewedPokemonService,
    private cacheService: PokemonCacheService
  ) {}

  ngOnInit() {
    if (this.pokemon) {
      this.initializePokemonData();
    } else if (this.pokemonId) {
      this.loadPokemonById(this.pokemonId);
    }

    // Ouvir mudanças de idioma
    this.translate.onLangChange
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.onLanguageChange();
      });
  }

  private loadPokemonById(id: number) {
    console.log(`🔍 Carregando dados do Pokémon ID: ${id}`);

    // Usar cache service como a versão mobile para consistência
    this.cacheService.getPokemon(id)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (pokemon: any) => {
          console.log('✅ Dados do Pokémon carregados:', pokemon.name);
          this.pokemon = pokemon;
          this.initializePokemonData();
        },
        error: (error) => {
          console.error('❌ Erro ao carregar Pokémon:', error);
          // Criar um Pokémon placeholder para evitar erros
          this.pokemon = this.createPlaceholderPokemon(id);
          this.initializePokemonData();
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
    if (!this.pokemon) return;

    console.log(`Inicializando dados para: ${this.pokemon.name} (ID: ${this.pokemon.id})`);

    // Mark Pokemon as viewed when details are initialized
    this.viewedPokemonService.markPokemonAsViewed(this.pokemon.id);

    // Resetar todos os dados de abas
    this.tabDataLoaded = {
      overview: false,
      combat: false,
      evolution: false,
      curiosities: false
    };

    // Limpar dados existentes para evitar vazamentos
    this.abilityDescriptions = {};
    this.flavorTexts = [];
    this.flavorText = '';
    this.currentFlavorIndex = 0;
    this.isLoadingFlavor = false;
    this.evolutionChain = [];
    this.speciesData = null;
    this.isSpeciesDataReady = false; // Resetar flag de dados da espécie

    // Resetar estado das abas
    this.activeTab = 'overview';
    this.isTabTransitioning = false;
    this.isOverviewCombatTransition = false;
    this.disableTabAnimation = false;

    // Gerar tema baseado nos tipos do Pokémon primeiro
    this.generatePokemonTheme();

    // Configurar carrossel de imagens
    this.setupCarousel();

    // Carregar dados da aba ativa (overview por padrão)
    this.loadTabData(this.activeTab);
  }

  ngAfterViewInit() {
    // Pequeno delay para garantir que os elementos foram renderizados
    setTimeout(() => {
      this.animateElements();
    }, 100);
  }

  setupCarousel() {
    const sprites = this.pokemon?.sprites;
    const fallbackImage = this.ensureValidImage();

    console.log('🖼️ Configurando carrossel para:', this.pokemon?.name);
    console.log('Sprites disponíveis:', sprites);

    // Criar array de imagens com validação (incluindo mais variações)
    const potentialImages = [
      {
        url: sprites?.other?.['official-artwork']?.front_default,
        label: 'Artwork Oficial'
      },
      {
        url: sprites?.other?.dream_world?.front_default,
        label: 'Dream World'
      },
      {
        url: sprites?.other?.home?.front_default,
        label: 'Home'
      },
      {
        url: sprites?.other?.['official-artwork']?.front_shiny,
        label: 'Artwork Shiny'
      },
      {
        url: sprites?.front_default,
        label: 'Frente'
      },
      {
        url: sprites?.back_default,
        label: 'Costas'
      },
      {
        url: sprites?.front_shiny,
        label: 'Frente Shiny'
      },
      {
        url: sprites?.back_shiny,
        label: 'Costas Shiny'
      },
      {
        url: sprites?.front_female,
        label: 'Frente Fêmea'
      },
      {
        url: sprites?.back_female,
        label: 'Costas Fêmea'
      },
      {
        url: sprites?.front_shiny_female,
        label: 'Frente Shiny Fêmea'
      },
      {
        url: sprites?.back_shiny_female,
        label: 'Costas Shiny Fêmea'
      }
    ];

    // Filtrar apenas imagens válidas e adicionar fallback se necessário
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
        label: 'Imagem Padrão'
      }];
    }

    console.log('Imagens do carrossel:', this.carouselImages);

    // Inicializar com a primeira imagem válida
    this.currentImageIndex = 0;
    this.currentCarouselIndex = 0;
    this.updateCurrentCarouselImage();
  }

  private fetchFlavorText(lang: string, pokemonId: number): void {
    console.log(`🔍 Iniciando busca de flavor text para: ${lang}, Pokémon ID: ${pokemonId}`);
    this.isLoadingFlavor = true;

    // Tentar usar cache inteligente primeiro
    this.cacheService.getFlavorTexts(pokemonId, lang)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (cachedFlavors: string[]) => {
          if (cachedFlavors && cachedFlavors.length > 0) {
            console.log(`✅ Flavor texts obtidos do cache: ${cachedFlavors.length} textos`);
            this.flavorTexts = cachedFlavors;
            this.flavorText = cachedFlavors[0];
            this.currentFlavorIndex = 0;
            this.isLoadingFlavor = false;

            // Pré-carregar flavor texts dos Pokémon adjacentes
            this.cacheService.preloadAdjacentPokemon(pokemonId, lang);

            // Verificar indicador de scroll após carregamento
            setTimeout(() => this.checkScrollIndicator(), 100);
            return;
          }

          // Fallback para método anterior se cache não retornar dados
          this.fetchFlavorTextFallback(lang, pokemonId);
        },
        error: (error) => {
          console.error('❌ Erro ao buscar flavor texts do cache:', error);
          this.fetchFlavorTextFallback(lang, pokemonId);
        }
      });
  }

  private fetchFlavorTextFallback(lang: string, pokemonId: number) {
    // Para pt-BR, sempre usar tradução local primeiro
    if (lang === 'pt-BR' || lang === 'pt') {
      console.log('🇧🇷 Idioma português detectado, priorizando traduções locais');
      this.fetchFlavorTextFromLocalThenAPI();
      return;
    }

    // Para japonês, ir direto para PokeAPI nativa (backend não suporta japonês)
    if (lang === 'ja-JP' || lang === 'ja') {
      console.log('🇯🇵 Idioma japonês detectado, buscando diretamente da PokeAPI nativa');
      this.fetchFlavorTextFromPokeAPINative(lang);
      return;
    }

    // Para outros idiomas, tentar backend primeiro e depois PokeAPI nativa
    console.log(`🌐 Idioma ${lang} detectado, buscando do backend/API nativa`);
    return this.http.get(`/api/v1/pokemon/${pokemonId}/flavor?lang=${lang}`)
      .pipe(
        map((data: any) => {
          console.log('📦 Dados recebidos do backend:', data);
          return data;
        }),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data: any) => {
          console.log('✅ Resposta do backend recebida:', data);

          // Para idiomas não português, usar diretamente os flavors da API
          const flavors = data.flavors || [];
          this.flavorTexts = flavors.length > 0 ? flavors : [this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE')];
          this.flavorText = this.flavorTexts[0];
          this.currentFlavorIndex = 0;
          this.isLoadingFlavor = false;

          console.log(`✅ Flavor texts em ${lang} carregados:`, this.flavorTexts.length);

          // Verificar indicador de scroll após carregamento
          setTimeout(() => this.checkScrollIndicator(), 100);
        },
        error: (error) => {
          console.error('❌ Erro ao buscar flavor text do backend:');
          console.error('  Status:', error.status);
          console.error('  Message:', error.message);
          console.error('  Full error:', error);

          if (error.status === 504) {
            console.log('🔄 Erro 504 (Gateway Timeout) detectado, acionando fallback para PokeAPI');
          } else {
            console.log('🔄 Erro do backend detectado, acionando fallback');
          }

          // Fallback direto para PokeAPI quando backend falha
          this.fetchFlavorTextFromPokeAPINative(lang);
        }
      });
  }

  private fetchFlavorTextFromPokeAPI(): void {
    if (!this.pokemon?.species?.url) {
      console.warn('⚠️ URL da espécie não disponível para fallback');
      this.flavorText = this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
      return;
    }

    console.log('🔄 Iniciando fallback: buscando flavor text da PokeAPI para:', this.pokemon.species.url);

    this.http.get(this.pokemon.species.url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log('📦 Dados da espécie recebidos via fallback:', {
            name: data.name,
            totalFlavors: data.flavor_text_entries?.length || 0
          });

          const flavorEntries = data.flavor_text_entries || [];

          // Buscar primeiro em pt-br
          const ptBrEntries = flavorEntries.filter((entry: any) => entry.language.name === 'pt-br');
          console.log('🇧🇷 Entradas em pt-br encontradas:', ptBrEntries.length);

          // Se não encontrar pt-br, buscar em pt
          const ptEntries = flavorEntries.filter((entry: any) => entry.language.name === 'pt');
          console.log('🇵🇹 Entradas em pt encontradas:', ptEntries.length);

          if (ptBrEntries.length === 0 && ptEntries.length === 0) {
            console.log(' ⚠️ Nenhuma entrada em português encontrada via fallback');
            this.flavorText = this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
            this.flavorTexts = [this.flavorText];
            this.currentFlavorIndex = 0;
          } else {
            // Usar pt-br se disponível, senão pt
            const selectedEntries = ptBrEntries.length > 0 ? ptBrEntries : ptEntries;
            this.flavorTexts = selectedEntries.map((entry: any) =>
              entry.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ')
            );
            this.flavorText = this.flavorTexts[0] || this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
            this.currentFlavorIndex = 0;

            console.log('✅ Fallback bem-sucedido! Flavor texts em português carregados:', this.flavorTexts.length);
            console.log('📝 Primeiro flavor:', this.flavorText.substring(0, 100) + '...');

            // Verificar indicador de scroll
            setTimeout(() => this.checkScrollIndicator(), 100);
          }
          this.isLoadingFlavor = false;
        },
        error: (error) => {
          console.error('❌ Erro no fallback da PokeAPI:', error);
          this.flavorText = this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
          this.isLoadingFlavor = false;
        }
      });
  }

  private fetchFlavorTextFromPokeAPINative(lang: string): void {
    if (!this.pokemon?.species?.url) {
      console.warn('⚠️ URL da espécie não disponível para fallback');
      this.flavorText = this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
      this.isLoadingFlavor = false;
      return;
    }

    console.log(`🔄 Iniciando fallback nativo: buscando flavor text da PokeAPI em ${lang} para:`, this.pokemon.species.url);

    this.http.get(this.pokemon.species.url)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log('📦 Dados da espécie recebidos via fallback nativo:', {
            name: data.name,
            totalFlavors: data.flavor_text_entries?.length || 0
          });

          const flavorEntries = data.flavor_text_entries || [];

          // Mapear idioma do translate para formato da PokeAPI
          const apiLangMap: { [key: string]: string[] } = {
            'en-US': ['en'],
            'en': ['en'],
            'es': ['es'],
            'es-ES': ['es'],
            'fr': ['fr'],
            'de': ['de'],
            'it': ['it'],
            'ja': ['ja', 'ja-Hrkt'],
            'ja-JP': ['ja', 'ja-Hrkt'],
            'ko': ['ko']
          };

          const targetLanguages = apiLangMap[lang] || ['en']; // fallback para inglês

          // Buscar entradas no idioma específico
          let targetEntries = flavorEntries.filter((entry: any) =>
            targetLanguages.includes(entry.language.name)
          );

          console.log(`🌐 Entradas em ${lang} (${targetLanguages.join(',')}) encontradas:`, targetEntries.length);

          // Se não encontrar no idioma específico, usar inglês como fallback
          if (targetEntries.length === 0 && !targetLanguages.includes('en')) {
            console.log('🔄 Tentando fallback para inglês...');
            targetEntries = flavorEntries.filter((entry: any) => entry.language.name === 'en');
            console.log('🇺🇸 Entradas em inglês encontradas:', targetEntries.length);
          }

          if (targetEntries.length === 0) {
            console.log('⚠️ Nenhuma entrada encontrada em idiomas suportados');
            this.flavorText = this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
            this.flavorTexts = [this.flavorText];
            this.currentFlavorIndex = 0;
          } else {
            this.flavorTexts = targetEntries.map((entry: any) =>
              entry.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ')
            );
            this.flavorText = this.flavorTexts[0] || this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
            this.currentFlavorIndex = 0;

            console.log(`✅ Fallback nativo bem-sucedido! Flavor texts em ${lang} carregados:`, this.flavorTexts.length);
            console.log('📝 Primeiro flavor:', this.flavorText.substring(0, 100) + '...');

            // Verificar indicador de scroll
            setTimeout(() => this.checkScrollIndicator(), 100);
          }
          this.isLoadingFlavor = false;
        },
        error: (error) => {
          console.error('❌ Erro no fallback nativo da PokeAPI:', error);
          this.flavorText = this.translate.instant('modal.NO_FLAVOR_TEXT_AVAILABLE');
          this.isLoadingFlavor = false;
        }
      });
  }

  private extractAbilityDescription(abilityData: any): string {
    const flavorTextEntries = abilityData.flavor_text_entries || [];

    // Obter idioma atual do serviço de tradução
    const currentLang = this.translate.currentLang || 'pt-BR';

    // Buscar descrição no idioma atual primeiro
    let description = flavorTextEntries.find((entry: any) => {
      if (currentLang === 'pt-BR' || currentLang === 'pt') {
        return entry.language.name === 'pt-br' || entry.language.name === 'pt';
      }
      return entry.language.name === currentLang;
    });

    // Se não encontrar no idioma atual, usar inglês como fallback
    if (!description) {
      description = flavorTextEntries.find((entry: any) => entry.language.name === 'en');
    }

    if (description) {
      return description.flavor_text.replace(/\n/g, ' ').replace(/\f/g, ' ');
    }

    // Fallback para effect_entries se não houver flavor_text
    const effectEntries = abilityData.effect_entries || [];
    const effect = effectEntries.find((entry: any) => {
      if (currentLang === 'pt-BR' || currentLang === 'pt') {
        return entry.language.name === 'pt-br' || entry.language.name === 'pt' || entry.language.name === 'en';
      }
      return entry.language.name === currentLang || entry.language.name === 'en';
    });

    return effect ? effect.effect.replace(/\n/g, ' ') : this.translate.instant('modal.NO_ABILITY_DESCRIPTION_AVAILABLE');
  }

  private fetchSpeciesData(): void {
    if (!this.pokemon?.species?.url) return;

    this.http.get(this.pokemon.species.url).subscribe({
      next: (data) => {
        this.speciesData = data;
        this.isSpeciesDataReady = true;
      },
      error: (error) => {
        console.error('Erro ao buscar dados da espécie:', error);
      }
    });
  }

  private fetchEvolutionChain(): void {
    if (!this.pokemon?.species?.url) {
      console.warn('⚠️ Não foi possível carregar evolução: URL da espécie não disponível');
      return;
    }

    console.log(`🧬 Iniciando busca da cadeia evolutiva para: ${this.pokemon.name}`);
    console.log(`📍 URL da espécie: ${this.pokemon.species.url}`);

    // Primeiro buscar os dados da espécie para obter a URL da cadeia evolutiva
    this.http.get(this.pokemon.species.url).subscribe({
      next: (speciesData: any) => {
        console.log(`✅ Dados da espécie carregados: ${speciesData.name}`);

        if (speciesData.evolution_chain?.url) {
          console.log(`🔗 URL da cadeia evolutiva encontrada: ${speciesData.evolution_chain.url}`);

          this.http.get(speciesData.evolution_chain.url).subscribe({
            next: (evolutionData: any) => {
              console.log(`✅ Dados da cadeia evolutiva carregados`);
              console.log(`🧬 Processando cadeia evolutiva...`);
              this.processEvolutionChain(evolutionData.chain);
            },
            error: (error) => {
              console.error('❌ Erro ao buscar cadeia evolutiva:', error);
              this.evolutionChain = [];
            }
          });
        } else {
          console.warn('⚠️ URL da cadeia evolutiva não encontrada nos dados da espécie');
          this.evolutionChain = [];
        }
      },
      error: (error) => {
        console.error('❌ Erro ao buscar dados da espécie para evolução:', error);
        this.evolutionChain = [];
      }
    });
  }

  private processEvolutionChain(chain: any): void {
    const evolutionChain: any[] = [];
    let current = chain;

    while (current) {
      const pokemonId = this.extractIdFromUrl(current.species.url);
      const potentialImageUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`;

      const evolutionData: any = {
        id: pokemonId,
        name: current.species.name,
        imageUrl: this.isValidImageUrl(potentialImageUrl) ? potentialImageUrl : this.ensureValidImage(),
        isCurrent: pokemonId === this.pokemon.id,
        method: this.translate.instant('evolution.methods.base_form')
      };

      // Adicionar método de evolução se não for o primeiro
      if (current.evolution_details && current.evolution_details.length > 0) {
        const details = current.evolution_details[0];
        evolutionData.trigger = this.getEvolutionTriggerText(details);
      }

      evolutionChain.push(evolutionData);

      // Continuar para a próxima evolução
      current = current.evolves_to.length > 0 ? current.evolves_to[0] : null;
    }

    this.evolutionChain = evolutionChain;
    console.log('🧬 Cadeia de evolução processada:', this.evolutionChain);
  }

  private extractIdFromUrl(url: string): number {
    const parts = url.split('/');
    return parseInt(parts[parts.length - 2], 10);
  }

  getEvolutionTriggerText(detailsOrTrigger: any): string {
    // Se for uma string simples (trigger name), traduzir diretamente
    if (typeof detailsOrTrigger === 'string') {
      const triggerKey = detailsOrTrigger.replace(/-/g, '_');
      return this.translate.instant(`evolution.triggers.${triggerKey}`) || detailsOrTrigger;
    }

    // Se for um objeto details, processar como antes
    const details = detailsOrTrigger;
    if (details.min_level) {
      return `${this.translate.instant('evolution.methods.level')} ${details.min_level}`;
    }

    if (details.item) {
      return `${this.translate.instant('evolution.triggers.use_item')} ${details.item.name}`;
    }

    if (details.trigger?.name === 'trade') {
      return this.translate.instant('evolution.methods.trade');
    }

    if (details.min_happiness) {
      return `${this.translate.instant('evolution.methods.happiness')} ${details.min_happiness}`;
    }

    return this.translate.instant('evolution.methods.special');
  }

  private fetchAbilityDescriptions(): void {
    if (!this.pokemon?.abilities) return;

    const abilityRequests = this.pokemon.abilities.map((ability: any) =>
      this.http.get(ability.ability.url).pipe(
        map((data: any) => ({
          name: ability.ability.name,
          description: this.extractAbilityDescription(data)
        })),
        takeUntil(this.destroy$)
      )
    );

    forkJoin(abilityRequests)
      .pipe(takeUntil(this.destroy$))
      .subscribe(
        (descriptions: any) => {
          descriptions.forEach((desc: any) => {
            this.abilityDescriptions[desc.name] = desc.description;
          });
        },
        (error) => {
          console.error('Erro ao buscar descrições das habilidades:', error);
        }
      );
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

    if (this.pokemon) {
      // Trivia baseada nas stats
      const totalStats = this.getTotalStats();
      if (totalStats > 600) {
        trivia.push(this.translate.instant('details.trivia.legendary_stats'));
      } else if (totalStats > 500) {
        trivia.push(this.translate.instant('details.trivia.exceptional_stats'));
      }

      // Trivia baseada no peso e altura
      const weight = (this.pokemon.weight || 0) / 10;
      const height = (this.pokemon.height || 0) / 10;

      if (weight > 100) {
        trivia.push(this.translate.instant('details.trivia.very_heavy', { weight }));
      }

      if (height > 2) {
        trivia.push(this.translate.instant('details.trivia.very_tall', { height }));
      }

      // Trivia baseada nos tipos
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

      // Trivia baseada na experiência
      if (this.pokemon.base_experience) {
        if (this.pokemon.base_experience > 250) {
          trivia.push(this.translate.instant('details.trivia.high_experience'));
        }
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

  getTotalStats(): number {
    if (!this.pokemon?.stats) return 0;
    return this.pokemon.stats.reduce((total: number, stat: any) => total + stat.base_stat, 0);
  }

  getBaseExperience(): string {
    return this.pokemon?.base_experience?.toString() || this.translate.instant('app.not_available');
  }
  getCaptureRate(): string {
    // BLOQUEIO POR ABA: só retornar dados se estivermos na aba correta
    if (this.activeTab !== 'curiosities') {
      return ''; // Retorna vazio para não exibir nada no template
    }

    if (!this.isSpeciesDataReady) {
      return this.translate.instant('app.loading');
    }
    return this.speciesData?.capture_rate?.toString() || this.translate.instant('app.not_available');
  }

  getBaseHappiness(): string {
    // BLOQUEIO POR ABA: só retornar dados se estivermos na aba correta
    if (this.activeTab !== 'curiosities') {
      return ''; // Retorna vazio para não exibir nada no template
    }

    if (!this.isSpeciesDataReady) {
      return this.translate.instant('app.loading');
    }
    return this.speciesData?.base_happiness?.toString() || this.translate.instant('app.not_available');
  }
  getPokemonColor(): string {
    // BLOQUEIO POR ABA: só retornar dados se estivermos na aba correta
    if (this.activeTab !== 'curiosities') {
      return ''; // Retorna vazio para não exibir nada no template
    }

    if (!this.isSpeciesDataReady) {
      return this.translate.instant('app.loading');
    }

    const colorName = this.speciesData?.color?.name;
    if (!colorName) return this.translate.instant('app.not_available');

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
        // Carregar APENAS descrições das habilidades para esta aba
        if (!this.tabDataLoaded['combat'] && this.pokemon?.abilities) {
          this.isTabTransitioning = true;
          this.fetchAbilityDescriptions();
          this.tabDataLoaded['combat'] = true;
          setTimeout(() => {
            this.isTabTransitioning = false;
          }, 100);
        }
        break;

      case 'evolution':
        // CORREÇÃO: Sempre verificar se a cadeia de evolução precisa ser recarregada
        // Se os dados já foram carregados E a cadeia não foi limpa, não carregar novamente
        if (this.tabDataLoaded['evolution'] && this.evolutionChain.length > 0) {
          console.log(`✅ Dados da aba ${toTab} já carregados e cadeia válida`);
          return;
        }

        // Carregar dados de evolução e espécie para esta aba
        console.log(`🧬 Carregando/recarregando cadeia de evolução`);
        this.isTabTransitioning = true;
        this.fetchEvolutionChain();
        // fetchSpeciesData apenas se não foi carregado por outra aba
        if (!this.speciesData) {
          this.fetchSpeciesData();
        }
        this.tabDataLoaded['evolution'] = true;
        setTimeout(() => {
          this.isTabTransitioning = false;
        }, 100);
        break;

      case 'curiosities':
        // CORREÇÃO: Sempre verificar se os flavor texts precisam ser recarregados
        // Se os dados já foram carregados E os flavors não foram limpos E não houve mudança de idioma, não carregar novamente
        if (this.tabDataLoaded['curiosities'] && this.flavorTexts.length > 0 && !this.isLoadingFlavor) {
          console.log(`✅ Dados da aba ${toTab} já carregados e flavors válidos`);
          return;
        }

        // Carregar flavor texts para esta aba
        console.log(`🍃 Carregando/recarregando flavor texts`);
        this.isTabTransitioning = true;
        this.fetchFlavorTextFromPokeAPI();
        this.tabDataLoaded['curiosities'] = true;
        setTimeout(() => {
          this.isTabTransitioning = false;
        }, 100);
        break;
    }
  }

  loadTabData(tab: string): void {
    console.log(`Loading tab data for ${tab}`);

    if (!this.pokemon) return;

    switch (tab) {
      case 'overview':
        // Dados básicos já estão disponíveis no pokemon
        this.tabDataLoaded['overview'] = true;
        break;

      case 'combat':
        // Carregar descrições das habilidades se ainda não foram carregadas
        if (!this.tabDataLoaded['combat'] && this.pokemon.abilities) {
          this.fetchAbilityDescriptions();
          this.tabDataLoaded['combat'] = true;
        }
        break;

      case 'evolution':
        // Carregar dados de evolução e espécie
        if (!this.tabDataLoaded['evolution']) {
          this.fetchEvolutionChain();
          if (!this.speciesData) {
            this.fetchSpeciesData();
          }
          this.tabDataLoaded['evolution'] = true;
        }
        break;

      case 'curiosities':
        // Carregar dados da espécie e flavor texts
        if (!this.tabDataLoaded['curiosities']) {
          if (!this.speciesData) {
            this.fetchSpeciesData();
          }
          // Sempre carregar flavor texts quando a aba é acessada
          this.isLoadingFlavor = true;
          this.fetchFlavorText(this.translate.currentLang || 'pt-BR', this.pokemon.id);
          this.tabDataLoaded['curiosities'] = true;
        }
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

  // Métodos de tradução inteligente
  private async fetchFlavorTextFromLocalThenAPI(): Promise<void> {
    console.log('🔍 Iniciando busca com prioridade para traduções locais...');

    // Primeiro tentar buscar localmente (somente para português)
    const localTranslations = await this.getLocalTranslations(this.pokemon.id);

    if (localTranslations && localTranslations.length > 0) {
      console.log('✅ Usando traduções locais encontradas');
      this.flavorTexts = localTranslations;
      this.flavorText = localTranslations[0];
      this.currentFlavorIndex = 0;
      this.isLoadingFlavor = false;
      setTimeout(() => this.checkScrollIndicator(), 100);
      return;
    }

    // Se não encontrar localmente, buscar na PokeAPI em português
    console.log('🔄 Traduções locais não encontradas, buscando na PokeAPI...');
    this.fetchFlavorTextFromPokeAPI();
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

  // Método para fechar o modal
  closeModal() {
    this.close.emit();
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

  // Add the missing method for language change
  onLanguageChange(): void {
    if (this.pokemonId) {
      this.loadPokemonById(this.pokemonId);
    }
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('DetailsModalComponent - ngOnChanges', changes);

    if (changes['pokemonId'] && changes['pokemonId'].currentValue !== changes['pokemonId'].previousValue) {
      if (changes['pokemonId'].currentValue && changes['pokemonId'].currentValue > 0) {
        this.loadPokemonById(changes['pokemonId'].currentValue);
      }
    }

    // Melhorar o tratamento de reabertura do modal
    if (changes['isOpen'] && changes['isOpen'].currentValue === true &&
        changes['isOpen'].previousValue === false) {
      console.log('🔄 Modal reaberto - reinicializando dados');

      // Resetar o subject destroy$ para evitar problemas de subscription
      this.destroy$.next();
      this.destroy$ = new Subject<void>();

      // Recarregar dados se temos pokemonId
      if (this.pokemonId && this.pokemonId > 0) {
        this.loadPokemonById(this.pokemonId);
      } else if (this.pokemon) {
        // Se já temos dados do pokemon, apenas reinicializar
        this.initializePokemonData();
      }

      // Reconfigurar listener de mudança de idioma
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
      this.pokemonTheme = {
        gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        primaryColor: '#667eea',
        secondaryColor: '#764ba2'
      };
      return;
    }

    const typeColors = this.getTypeColors();
    const pokemonTypes = this.pokemon.types.map((type: any) => type.type.name);
    const colors = pokemonTypes.map((typeName: string) => typeColors[typeName] || '#888888');

    console.log(`🎨 Gerando tema para ${this.pokemon.name}:`, {
      types: pokemonTypes,
      colors: colors
    });

    if (colors.length === 1) {
      // Um tipo: criar variações harmoniosas da mesma cor
      const baseColor = colors[0];
      const lighterColor = this.lightenColor(baseColor, 30);
      const darkerColor = this.darkenColor(baseColor, 20);
      const midColor = this.blendColors(baseColor, lighterColor, 0.3);

      this.pokemonTheme = {
        gradient: `linear-gradient(135deg, ${lighterColor} 0%, ${midColor} 35%, ${baseColor} 70%, ${darkerColor} 100%)`,
        primaryColor: baseColor,
        secondaryColor: darkerColor
      };

      console.log(`✨ Gradiente de tipo único criado: ${baseColor} com variações`);
    } else {
      // Dois tipos: misturar as cores dos tipos de forma harmoniosa
      const primaryColor = colors[0];
      const secondaryColor = colors[1];
      const blendedColor = this.blendColors(primaryColor, secondaryColor, 0.5);

      // Criar gradiente mais suave com cor misturada no meio
      this.pokemonTheme = {
        gradient: `linear-gradient(135deg, ${primaryColor} 0%, ${blendedColor} 50%, ${secondaryColor} 100%)`,
        primaryColor: primaryColor,
        secondaryColor: secondaryColor
      };

      console.log(`🌈 Gradiente de duplo tipo criado: ${primaryColor} → ${blendedColor} → ${secondaryColor}`);
    }
  }

  private getTypeColors(): { [key: string]: string } {
    return {
      normal: '#A8A878',
      fighting: '#C03028',
      flying: '#A890F0',
      poison: '#A040A0',
      ground: '#E0C068',
      rock: '#B8A038',
      bug: '#A8B820',
      ghost: '#705898',
      steel: '#B8B8D0',
      fire: '#F08030',
      water: '#6890F0',
      grass: '#78C850',
      electric: '#F8D030',
      psychic: '#F85888',
      ice: '#98D8D8',
      dragon: '#7038F8',
      dark: '#705848',
      fairy: '#EE99AC',
      stellar: '#40B5A8',
      unknown: '#68A090'
    };
  }

  private lightenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) + amt;
    const B = (num >> 8 & 0x00FF) + amt;
    const G = (num & 0x0000FF) + amt;

    return "#" + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
                  (B < 255 ? B < 1 ? 0 : B : 255) * 0x100 +
                  (G < 255 ? G < 1 ? 0 : G : 255))
                  .toString(16).slice(1);
  }

  private darkenColor(color: string, percent: number): string {
    const num = parseInt(color.replace("#", ""), 16);
    const amt = Math.round(2.55 * percent);
    const R = (num >> 16) - amt;
    const B = (num >> 8 & 0x00FF) - amt;
    const G = (num & 0x0000FF) - amt;

    return "#" + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
                  (B > 255 ? 255 : B < 0 ? 0 : B) * 0x100 +
                  (G > 255 ? 255 : G < 0 ? 0 : G))
                  .toString(16).slice(1);
  }

  private blendColors(color1: string, color2: string, ratio: number): string {
    // Converter cores hex para RGB
    const hex1 = color1.replace('#', '');
    const hex2 = color2.replace('#', '');

    const r1 = parseInt(hex1.substr(0, 2), 16);
    const g1 = parseInt(hex1.substr(2, 2), 16);
    const b1 = parseInt(hex1.substr(4, 2), 16);

    const r2 = parseInt(hex2.substr(0, 2), 16);
    const g2 = parseInt(hex2.substr(2, 2), 16);
    const b2 = parseInt(hex2.substr(4, 2), 16);

    // Misturar as cores com base no ratio
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

    // Converter de volta para hex
    const toHex = (n: number) => {
      const hex = n.toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
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