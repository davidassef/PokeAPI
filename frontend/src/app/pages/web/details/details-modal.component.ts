import { Component, Input, OnInit, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit, OnDestroy, HostListener } from '@angular/core';
import { PokeApiService } from '../../../core/services/pokeapi.service';
import { Pokemon } from '../../../models/pokemon.model';
import { HttpClient } from '@angular/common/http';
import { TranslateService } from '@ngx-translate/core';
import { SettingsService } from '../../../core/services/settings.service';
import { TranslationService } from '../../../core/services/translation.service';
import { PokemonThemeService } from './pokemon-theme.service';
import { forkJoin, of, Subscription } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { modalAnimations } from './modal.animations';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-details-modal',
  templateUrl: './details-modal.component.html',
  styleUrls: ['./details-modal.component.scss'],
  animations: [
    ...modalAnimations,
    trigger('fadeInOut', [
      state('visible', style({ opacity: 1 })),
      state('hidden', style({ opacity: 0 })),
      transition('visible <=> hidden', animate('300ms ease-in-out'))
    ])
  ]
})
export class DetailsModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() pokemonId!: number;
  @Output() close = new EventEmitter<void>();
  @ViewChild('closeBtn', { static: false }) closeBtn!: ElementRef<HTMLButtonElement>;
  @ViewChild('flavorTextWrapper', { static: false }) flavorTextWrapper!: ElementRef<HTMLDivElement>;

  pokemon: Pokemon | null = null;
  loading = false;
  selectedImageType: 'default' | 'shiny' = 'default';
  currentImageUrl: string = '';

  // Carrossel de imagens
  carouselImages: { url: string, label: string }[] = [];
  currentCarouselIndex = 0;
  get currentCarouselImage() {
    const image = this.carouselImages[this.currentCarouselIndex]?.url || '';
    return image;
  }
  selectCarouselImage(idx: number) {
    this.currentCarouselIndex = idx;
  }

  previousCarouselImage() {
    if (this.carouselImages.length > 0) {
      this.currentCarouselIndex = this.currentCarouselIndex === 0
        ? this.carouselImages.length - 1
        : this.currentCarouselIndex - 1;
    }
  }

  getThumbnailSlideOffset(): number {
    const maxVisibleThumbnails = 3;
    const thumbnailWidth = 60; // Largura de cada miniatura + gap

    if (this.carouselImages.length <= maxVisibleThumbnails) {
      return 0; // Não precisa deslizar
    }

    // Calcular offset para centralizar a miniatura ativa
    const centerPosition = Math.floor(maxVisibleThumbnails / 2);
    let offset = 0;

    if (this.currentCarouselIndex >= centerPosition) {
      const maxOffset = (this.carouselImages.length - maxVisibleThumbnails) * thumbnailWidth;
      offset = Math.min((this.currentCarouselIndex - centerPosition) * thumbnailWidth, maxOffset);
    }

    return -offset;
  }

  // Flavor text
  flavorText: string = '';
  flavorTexts: string[] = [];
  currentFlavorIndex: number = 0;
  currentFlavorLanguage: string = 'en'; // Idioma atual do flavor
  isTranslating: boolean = false; // Indicador de tradução em andamento

  // Controle do indicador de scroll
  showScrollIndicator: boolean = false;

  private escListener = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      this.onClose();
    }
  };

  private typeColorMap: { [key: string]: string } = {
    normal: '#A8A77A',
    fire: '#EE8130',
    water: '#6390F0',
    electric: '#F7D02C',
    grass: '#7AC74C',
    ice: '#96D9D6',
    fighting: '#C22E28',
    poison: '#A33EA1',
    ground: '#E2BF65',
    flying: '#A98FF3',
    psychic: '#F95587',
    bug: '#A6B91A',
    rock: '#B6A136',
    ghost: '#735797',
    dragon: '#6F35FC',
    dark: '#705746',
    steel: '#B7B7CE',
    fairy: '#D685AD'
  };

  touchStartX = 0;
  touchEndX = 0;
  isDragging = false;
  mouseStartX = 0;

  private langChangeSub?: Subscription;

  // Aba ativa
  activeTab: string = 'overview';
  headerState: string = 'idle';

  // Dados adicionais para as abas
  evolutionChain: any[] = [];
  speciesData: any = null;
  abilityDescriptions: { [key: string]: string } = {};

  constructor(
    private pokeApiService: PokeApiService,
    private http: HttpClient,
    private translate: TranslateService,
    private settingsService: SettingsService,
    private translationService: TranslationService,
    public pokemonThemeService: PokemonThemeService
  ) {}

  ngOnInit(): void {
    if (this.pokemonId) {
      this.loading = true;
      this.pokeApiService.getPokemon(this.pokemonId).subscribe({
        next: (data) => {
          this.pokemon = data;
          this.currentImageUrl = this.getCurrentImage();
          this.setupCarouselImages();
          this.fetchFlavorText();
          this.fetchSpeciesData();
          this.fetchEvolutionChain();
          this.fetchAbilityDescriptions();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
    window.addEventListener('keydown', this.escListener);
    // Listener para mudança de idioma
    this.langChangeSub = this.translate.onLangChange.subscribe(() => {
      this.fetchFlavorText();
    });

    this.animateElements();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.closeBtn?.nativeElement?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.escListener);
    this.langChangeSub?.unsubscribe();
  }

  onClose(event?: Event) {
    if (event) event.preventDefault();
    this.close.emit();
  }

  // Métodos para estatísticas
  getStatName(statName: string): string {
    const statNames: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Ataque',
      'defense': 'Defesa',
      'special-attack': 'Ataque Especial',
      'special-defense': 'Defesa Especial',
      'speed': 'Velocidade'
    };
    return statNames[statName] || statName;
  }

  getStatPercentage(stat: number): number {
    return Math.min((stat / 255) * 100, 100);
  }

  getTotalStats(): number {
    if (!this.pokemon?.stats) return 0;
    return this.pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  // Métodos para imagens
  getCurrentImage(): string {
    if (!this.pokemon) return '';

    if (this.selectedImageType === 'shiny') {
      return (this.pokemon.sprites?.other?.['official-artwork'] as any)?.front_shiny ||
             (this.pokemon.sprites as any)?.front_shiny ||
             this.pokemon.sprites?.front_default ||
             'assets/img/pokemon-placeholder.png';
    }

    return (this.pokemon.sprites?.other?.['official-artwork'] as any)?.front_default ||
           this.pokemon.sprites?.front_default ||
           'assets/img/pokemon-placeholder.png';
  }

  onImageError(event: any) {
    event.target.src = 'assets/img/pokemon-placeholder.png';
  }

  // Métodos para cores e gradientes
  getBackgroundGradient(): string {
    if (!this.pokemon?.types || this.pokemon.types.length === 0) {
      return 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
    }

    const typeColors: { [key: string]: string } = {
      'normal': '#A8A878',
      'fire': '#F08030',
      'water': '#6890F0',
      'electric': '#F8D030',
      'grass': '#78C850',
      'ice': '#98D8D8',
      'fighting': '#C03028',
      'poison': '#A040A0',
      'ground': '#E0C068',
      'flying': '#A890F0',
      'psychic': '#F85888',
      'bug': '#A8B820',
      'rock': '#B8A038',
      'ghost': '#705898',
      'dragon': '#7038F8',
      'dark': '#705848',
      'steel': '#B8B8D0',
      'fairy': '#EE99AC'
    };

    if (this.pokemon.types.length === 1) {
      const color = typeColors[this.pokemon.types[0].type.name] || '#667eea';
      return `linear-gradient(135deg, ${color} 0%, ${color}dd 100%)`;
    }

    const color1 = typeColors[this.pokemon.types[0].type.name] || '#667eea';
    const color2 = typeColors[this.pokemon.types[1].type.name] || '#764ba2';
    return `linear-gradient(135deg, ${color1} 0%, ${color2} 100%)`;
  }

  getTypeIcon(type: string): string {
    const icons: { [key: string]: string } = {
      grass: `<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#78C850'/><path d='M12 7v10M12 7c-2.5 2-5 5.5-5 8 0 2 2 2 2 0 0-2.5 2.5-6 3-8z' stroke='#fff' stroke-width='2' stroke-linecap='round'/></svg>`,
      fire: `<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#F08030'/><path d='M12 7c1.5 2 4 5.5 4 8 0 2-2 2-2 0 0-2.5-2.5-6-3-8z' stroke='#fff' stroke-width='2' stroke-linecap='round'/></svg>`,
      water: `<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#6890F0'/><path d='M12 7c2 2.5 4 5.5 4 8 0 2-2 2-2 0 0-2.5-2.5-6-3-8z' stroke='#fff' stroke-width='2' stroke-linecap='round'/></svg>`,
      poison: `<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#A040A0'/><path d='M8 16c2-2 6-2 8 0' stroke='#fff' stroke-width='2' stroke-linecap='round'/></svg>`,
      bug: `<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#A8B820'/><path d='M8 12h8M12 8v8' stroke='#fff' stroke-width='2' stroke-linecap='round'/></svg>`,
      electric: `<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#F8D030'/><path d='M10 14l2-4 2 4' stroke='#fff' stroke-width='2' stroke-linecap='round'/></svg>`,
      flying: `<svg width='18' height='18' viewBox='0 0 24 24' fill='none'><circle cx='12' cy='12' r='10' fill='#A890F0'/><path d='M8 14c2-2 6-2 8 0' stroke='#fff' stroke-width='2' stroke-linecap='round'/></svg>`,
      // ...adicione outros tipos se desejar
    };
    return icons[type] || '';
  }

  // Método para obter nome da geração
  getGenerationName(): string {
    if (!this.pokemon?.id) return 'N/A';

    const generationRanges: { [key: string]: { min: number; max: number; name: string } } = {
      'I': { min: 1, max: 151, name: 'I' },
      'II': { min: 152, max: 251, name: 'II' },
      'III': { min: 252, max: 386, name: 'III' },
      'IV': { min: 387, max: 493, name: 'IV' },
      'V': { min: 494, max: 649, name: 'V' },
      'VI': { min: 650, max: 721, name: 'VI' },
      'VII': { min: 722, max: 809, name: 'VII' },
      'VIII': { min: 810, max: 898, name: 'VIII' },
      'IX': { min: 899, max: 1025, name: 'IX' }
    };

    for (const gen of Object.values(generationRanges)) {
      if (this.pokemon.id >= gen.min && this.pokemon.id <= gen.max) {
        return gen.name;
      }
    }

    return 'N/A';
  }

  // Método para obter movimentos recentes
  getRecentMoves(): any[] {
    if (!this.pokemon?.moves) return [];

    // Retorna os primeiros 8 movimentos para não sobrecarregar a interface
    return this.pokemon.moves.slice(0, 8);
  }

  setupCarouselImages() {
    if (!this.pokemon) return;
    const sprites = this.pokemon.sprites;
    this.carouselImages = [];

    // 1. Artwork oficial (MESMA DOS CARDS - melhor qualidade)
    if (sprites?.other?.['official-artwork']?.front_default) {
      this.carouselImages.push({ url: sprites.other['official-artwork'].front_default, label: 'Artwork Oficial' });
    }

    // 2. Sprite normal (frente) - BÁSICO
    if (sprites?.front_default) {
      this.carouselImages.push({ url: sprites.front_default, label: 'Sprite Normal' });
    }

    // 3. Sprite shiny (frente) - BÁSICO SHINY
    if (sprites?.front_shiny) {
      this.carouselImages.push({ url: sprites.front_shiny, label: 'Sprite Shiny' });
    }

    // 4. Sprite normal (costas) - BÁSICO COSTAS
    if (sprites?.back_default) {
      this.carouselImages.push({ url: sprites.back_default, label: 'Costas Normal' });
    }

    // 5. Sprite shiny (costas) - BÁSICO SHINY COSTAS
    if (sprites?.back_shiny) {
      this.carouselImages.push({ url: sprites.back_shiny, label: 'Costas Shiny' });
    }

    // 6. Dream World (ESPECIAL)
    const otherSprites = sprites?.other as any;
    if (otherSprites?.dream_world?.front_default) {
      this.carouselImages.push({ url: otherSprites.dream_world.front_default, label: 'Dream World' });
    }

    // 7. Home (ESPECIAL)
    if (otherSprites?.home?.front_default) {
      this.carouselImages.push({ url: otherSprites.home.front_default, label: 'Home' });
    }

    // 8. Home Shiny (ESPECIAL)
    if (otherSprites?.home?.front_shiny) {
      this.carouselImages.push({ url: otherSprites.home.front_shiny, label: 'Home Shiny' });
    }

    // Reset para primeira imagem
    this.currentCarouselIndex = 0;
  }

  fetchFlavorText() {
    this.flavorText = '';
    this.flavorTexts = [];
    this.currentFlavorIndex = 0;
    this.isTranslating = false;
    this.showScrollIndicator = false;

    const currentAppLanguage = this.translate.currentLang || 'pt-BR';
    console.log('Buscando flavors para idioma:', currentAppLanguage, 'Pokemon ID:', this.pokemonId);

    // Primeiro tenta buscar flavors traduzidos do backend
    this.http.get<any>(`/api/v1/pokemon/${this.pokemonId}/flavor?lang=${currentAppLanguage}`).subscribe({
      next: (data) => {
        console.log('Resposta do backend para flavors:', data);
        if (data && data.flavors && data.flavors.length > 0) {
          // Verificar se os flavors retornados estão realmente em português
          const isPortuguese = this.isTextInPortuguese(data.flavors[0]);

          if (currentAppLanguage.startsWith('pt') && !isPortuguese) {
            console.log('Flavors do backend estão em inglês, tentando traduções locais');

            // Primeiro tenta buscar traduções locais
            this.fetchLocalFlavorTexts(this.pokemonId).then(localTranslations => {
              if (localTranslations.length > 0) {
                console.log(`Traduções locais encontradas: ${localTranslations.length} textos`);
                this.flavorTexts = localTranslations;
                this.flavorText = this.flavorTexts[0] || '';
                this.currentFlavorIndex = 0;
                this.currentFlavorLanguage = 'pt';

                // Verificar scroll após carregar o texto
                setTimeout(() => this.checkScrollIndicator(), 100);
                return;
              }

              // Se não encontrar traduções locais, usa PokeAPI como fallback
              console.log('Nenhuma tradução local encontrada, buscando da PokeAPI');
              this.fetchFlavorTextFromPokeAPI();
            });
            return;
          }

          this.flavorTexts = data.flavors;
          this.flavorText = this.flavorTexts[0] || '';
          this.currentFlavorIndex = 0;
          this.currentFlavorLanguage = currentAppLanguage.startsWith('pt') ? 'pt' : currentAppLanguage.startsWith('es') ? 'es' : 'en';
          console.log('Flavors carregados do backend:', this.flavorTexts.length, 'textos');

          // Verificar scroll após carregar o texto
          setTimeout(() => this.checkScrollIndicator(), 100);
        } else {
          console.log('Nenhum flavor encontrado no backend, buscando da PokeAPI');
          // Fallback para buscar da PokeAPI
          this.fetchFlavorTextFromPokeAPI();
        }
      },
      error: (error) => {
        console.error('Erro ao buscar flavor text do backend:', error);
        // Fallback para buscar da PokeAPI
        this.fetchFlavorTextFromPokeAPI();
      }
    });
  }

  private fetchFlavorTextFromPokeAPI(): void {
    if (!this.pokemon?.species?.url) return;

    console.log('Buscando flavor text da PokeAPI para:', this.pokemon.species.url);

    this.http.get(this.pokemon.species.url).subscribe({
      next: (speciesData: any) => {
        console.log('Dados da espécie recebidos:', speciesData.name, 'Entradas de flavor:', speciesData.flavor_text_entries?.length);

        if (speciesData.flavor_text_entries) {
          const currentAppLanguage = this.translate.currentLang || 'pt-BR';
          console.log('Idioma atual da aplicação:', currentAppLanguage);

          // Buscar textos no idioma da aplicação primeiro
          let flavorEntries = [];

          if (currentAppLanguage.startsWith('pt')) {
            // Buscar português brasileiro primeiro, depois português geral
            flavorEntries = speciesData.flavor_text_entries.filter((entry: any) =>
              entry.language.name === 'pt-br' || entry.language.name === 'pt'
            );
            console.log('Entradas em português encontradas:', flavorEntries.length);
          } else if (currentAppLanguage.startsWith('es')) {
            // Buscar espanhol
            flavorEntries = speciesData.flavor_text_entries.filter((entry: any) =>
              entry.language.name === 'es'
            );
            console.log('Entradas em espanhol encontradas:', flavorEntries.length);
          }

          // Se não houver no idioma preferido, usar inglês como fallback
          if (flavorEntries.length === 0) {
            flavorEntries = speciesData.flavor_text_entries.filter((entry: any) =>
              entry.language.name === 'en'
            );
            console.log('Fallback para inglês, entradas encontradas:', flavorEntries.length);
          }

          this.flavorTexts = flavorEntries
            .map((entry: any) => entry.flavor_text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim())
            .filter((text: string, index: number, arr: string[]) => arr.indexOf(text) === index); // Remove duplicatas

          this.flavorText = this.flavorTexts[0] || 'Descrição não disponível.';
          this.currentFlavorIndex = 0;
          this.currentFlavorLanguage = flavorEntries[0]?.language?.name || 'en';

          console.log('Flavor texts processados:', this.flavorTexts.length, 'Idioma:', this.currentFlavorLanguage);

          // Verificar scroll após carregar o texto
          setTimeout(() => this.checkScrollIndicator(), 100);
        }
      },
      error: (error) => {
        console.error('Erro ao buscar flavor text da espécie:', error);
        this.flavorTexts = ['Descrição não disponível para este Pokémon.'];
        this.flavorText = this.flavorTexts[0];
        this.currentFlavorLanguage = 'en';
        setTimeout(() => this.checkScrollIndicator(), 100);
      }
    });
  }

  /**
   * Busca traduções locais dos flavor texts quando o backend não tem traduções
   */
  private async fetchLocalFlavorTexts(pokemonId: number): Promise<string[]> {
    try {
      console.log('Buscando traduções locais para Pokémon ID:', pokemonId);

      // URL para o arquivo de traduções no backend
      const localTranslationsUrl = `http://localhost:8000/static/flavors_ptbr.json`;

      const response = await fetch(localTranslationsUrl);
      if (!response.ok) {
        console.log('Arquivo de traduções locais não encontrado, usando PokeAPI');
        return [];
      }

      const translations = await response.json();
      const pokemonIdStr = pokemonId.toString();

      if (translations[pokemonIdStr] && Array.isArray(translations[pokemonIdStr])) {
        console.log(`Traduções locais encontradas para Pokémon ${pokemonId}: ${translations[pokemonIdStr].length} flavors`);
        return translations[pokemonIdStr];
      }

      console.log(`Nenhuma tradução local encontrada para Pokémon ${pokemonId}`);
      return [];

    } catch (error) {
      console.error('Erro ao buscar traduções locais:', error);
      return [];
    }
  }

  getTypeGradientBackground(): string {
    const mainType = this.pokemon?.types?.[0]?.type?.name || 'normal';
    const typeColor = this.typeColorMap[mainType] || '#A8A77A';
    return `linear-gradient(135deg, #181a20 70%, ${typeColor} 100%)`;
  }

  onMouseDown(event: MouseEvent) {
    // Não iniciar drag se clicou em um botão
    if ((event.target as HTMLElement).closest('button')) {
      this.isDragging = false;
      return;
    }

    this.mouseStartX = event.clientX;
    this.isDragging = true;
  }

  onMouseMove(event: MouseEvent) {
    if (!this.isDragging) return;
    this.touchEndX = event.clientX;
  }

  onMouseUp(event: MouseEvent) {
    if (!this.isDragging) return;

    // Não processar drag se clicou em um botão
    if ((event.target as HTMLElement).closest('button')) {
      this.isDragging = false;
      this.mouseStartX = 0;
      this.touchEndX = 0;
      return;
    }

    const deltaX = this.touchEndX - this.mouseStartX;
    console.log('🖱️ Mouse up - deltaX:', deltaX);

    // Só processar se foi um drag significativo (mais de 50px)
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        console.log('🖱️ Drag direita - voltando');
        this.prevCarouselImage();
      } else {
        console.log('🖱️ Drag esquerda - avançando');
        this.nextCarouselImage();
      }
    }

    this.isDragging = false;
    this.mouseStartX = 0;
    this.touchEndX = 0;
  }

  onTouchStart(event: TouchEvent) {
    // Não iniciar touch se clicou em um botão
    if ((event.target as HTMLElement).closest('button')) {
      this.isDragging = false;
      return;
    }

    this.touchStartX = event.touches[0].clientX;
    this.isDragging = true;
  }

  onTouchMove(event: TouchEvent) {
    if (!this.isDragging) return;
    this.touchEndX = event.touches[0].clientX;
  }

  onTouchEnd(event: TouchEvent) {
    if (!this.isDragging) return;

    // Não processar touch se clicou em um botão
    if ((event.target as HTMLElement).closest('button')) {
      this.isDragging = false;
      this.touchStartX = 0;
      this.touchEndX = 0;
      return;
    }

    const deltaX = this.touchEndX - this.touchStartX;
    console.log('📱 Touch end - deltaX:', deltaX);

    // Só processar se foi um swipe significativo (mais de 50px)
    if (Math.abs(deltaX) > 50) {
      if (deltaX > 0) {
        console.log('📱 Swipe direita - voltando');
        this.prevCarouselImage();
      } else {
        console.log('📱 Swipe esquerda - avançando');
        this.nextCarouselImage();
      }
    }

    this.isDragging = false;
    this.touchStartX = 0;
    this.touchEndX = 0;
  }

  prevCarouselImage(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (this.carouselImages.length === 0) return;

    if (this.currentCarouselIndex > 0) {
      this.currentCarouselIndex--;
    } else {
      // Volta para a última imagem (loop)
      this.currentCarouselIndex = this.carouselImages.length - 1;
    }
  }

  nextCarouselImage(event?: Event) {
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    if (this.carouselImages.length === 0) return;

    if (this.currentCarouselIndex < this.carouselImages.length - 1) {
      this.currentCarouselIndex++;
    } else {
      // Vai para a primeira imagem (loop)
      this.currentCarouselIndex = 0;
    }
  }

  prevFlavorText() {
    if (this.flavorTexts.length === 0) return;
    if (this.currentFlavorIndex > 0) {
      this.currentFlavorIndex--;
    } else {
      this.currentFlavorIndex = this.flavorTexts.length - 1;
    }
    this.flavorText = this.flavorTexts[this.currentFlavorIndex];
  }

  nextFlavorText() {
    if (this.flavorTexts.length === 0) return;
    if (this.currentFlavorIndex < this.flavorTexts.length - 1) {
      this.currentFlavorIndex++;
    } else {
      this.currentFlavorIndex = 0;
    }
    this.flavorText = this.flavorTexts[this.currentFlavorIndex];
  }

  setActiveTab(tab: string): void {
    this.activeTab = tab;
    this.triggerTabAnimation();
  }

  private animateElements(): void {
    setTimeout(() => {
      this.animateHeader();
    }, 100);

    setTimeout(() => {
      this.animateStats();
    }, 300);

    setTimeout(() => {
      this.animateCards();
    }, 500);
  }

  private animateHeader(): void {
    this.headerState = 'pulse';
    setTimeout(() => {
      this.headerState = 'idle';
    }, 200);
  }

  private animateStats(): void {
    // Implementar animação das stats com delay progressivo
    const statElements = document.querySelectorAll('.stat-bar');
    statElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('animate-fill');
      }, index * 100);
    });
  }

  private animateCards(): void {
    // Implementar animação dos cards com stagger
    const cardElements = document.querySelectorAll('.pokemon-card');
    cardElements.forEach((element, index) => {
      setTimeout(() => {
        element.classList.add('fade-in');
      }, index * 150);
    });
  }

  private triggerTabAnimation(): void {
    const tabContent = document.querySelector('.tab-content');
    if (tabContent) {
      tabContent.classList.remove('slide-in');
      setTimeout(() => {
        tabContent.classList.add('slide-in');
      }, 10);
    }
  }

  onTabKeydown(event: KeyboardEvent): void {
    const tabs = ['overview', 'combat', 'evolution', 'curiosities'];
    const currentIndex = tabs.indexOf(this.activeTab);

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : tabs.length - 1;
        this.setActiveTab(tabs[prevIndex]);
        break;
      case 'ArrowRight':
        event.preventDefault();
        const nextIndex = currentIndex < tabs.length - 1 ? currentIndex + 1 : 0;
        this.setActiveTab(tabs[nextIndex]);
        break;
    }
  }

  get pokemonTheme() {
    if (this.pokemon?.types) {
      const typeNames = this.pokemon.types.map(t => t.type.name);
      return this.pokemonThemeService.getPokemonTheme(typeNames);
    }
    return this.pokemonThemeService.getPokemonTheme(['normal']);
  }

  // =============================
  // MÉTODOS PARA BUSCAR DADOS ADICIONAIS
  // =============================

  private fetchSpeciesData(): void {
    if (!this.pokemon?.species?.url) return;

    this.http.get(this.pokemon.species.url).subscribe({
      next: (data: any) => {
        this.speciesData = data;
      },
      error: (error) => {
        console.error('Erro ao buscar dados da espécie:', error);
      }
    });
  }

  private fetchEvolutionChain(): void {
    if (!this.pokemon?.species?.url) return;

    // Primeiro buscar os dados da espécie para obter a URL da cadeia evolutiva
    this.http.get(this.pokemon.species.url).subscribe({
      next: (speciesData: any) => {
        if (speciesData.evolution_chain?.url) {
          this.http.get(speciesData.evolution_chain.url).subscribe({
            next: (evolutionData: any) => {
              this.processEvolutionChain(evolutionData.chain);
            },
            error: (error) => {
              console.error('Erro ao buscar cadeia evolutiva:', error);
              this.evolutionChain = [];
            }
          });
        }
      },
      error: (error) => {
        console.error('Erro ao buscar dados da espécie para evolução:', error);
      }
    });
  }

  private processEvolutionChain(chain: any): void {
    const evolutionChain: any[] = [];
    let current = chain;

    while (current) {
      const pokemonId = this.extractIdFromUrl(current.species.url);
      const evolutionData: any = {
        id: pokemonId,
        name: current.species.name,
        image: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemonId}.png`,
        level: null,
        method: null,
        trigger: null
      };

      // Processar detalhes da evolução
      if (current.evolution_details && current.evolution_details.length > 0) {
        const details = current.evolution_details[0];
        evolutionData.level = details.min_level;
        evolutionData.method = details.trigger?.name || 'other';
        evolutionData.trigger = this.getEvolutionTriggerText(details);
      }

      evolutionChain.push(evolutionData);

      // Avançar para próxima evolução (assumindo apenas uma linha evolutiva)
      current = current.evolves_to && current.evolves_to.length > 0 ? current.evolves_to[0] : null;
    }

    this.evolutionChain = evolutionChain;
  }

  private extractIdFromUrl(url: string): number {
    const parts = url.split('/');
    return parseInt(parts[parts.length - 2]);
  }

  private getEvolutionTriggerText(details: any): string {
    if (details.min_level) {
      return `Nível ${details.min_level}`;
    }

    if (details.item) {
      return `Usar ${details.item.name}`;
    }

    if (details.trigger?.name === 'trade') {
      return 'Trocar';
    }

    if (details.min_happiness) {
      return `Felicidade ${details.min_happiness}`;
    }

    return 'Condição especial';
  }

  private fetchAbilityDescriptions(): void {
    if (!this.pokemon?.abilities) return;

    const abilityRequests = this.pokemon.abilities.map(ability =>
      this.http.get(ability.ability.url).pipe(
        map((data: any) => ({
          name: ability.ability.name,
          description: this.extractAbilityDescription(data)
        })),
        catchError(() => of({
          name: ability.ability.name,
          description: 'Descrição não disponível.'
        }))
      )
    );

    forkJoin(abilityRequests).subscribe({
      next: (descriptions) => {
        descriptions.forEach(desc => {
          this.abilityDescriptions[desc.name] = desc.description;
        });
      },
      error: (error) => {
        console.error('Erro ao buscar descrições das habilidades:', error);
      }
    });
  }

  private extractAbilityDescription(abilityData: any): string {
    // Tentar buscar descrição em português primeiro, depois inglês
    const flavorTextEntries = abilityData.flavor_text_entries || [];

    const ptbrEntry = flavorTextEntries.find((entry: any) => entry.language.name === 'pt-br');
    if (ptbrEntry) {
      return ptbrEntry.flavor_text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    const enEntry = flavorTextEntries.find((entry: any) => entry.language.name === 'en');
    if (enEntry) {
      return enEntry.flavor_text.replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    }

    return 'Descrição não disponível.';
  }

  // ========================
  // MÉTODOS PARA ABA COMBATE
  // ========================

  getOffensiveStats() {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter(stat =>
      ['attack', 'special-attack'].includes(stat.stat.name)
    );
  }

  getDefensiveStats() {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter(stat =>
      ['hp', 'defense', 'special-defense'].includes(stat.stat.name)
    );
  }

  getUtilityStats() {
    if (!this.pokemon?.stats) return [];
    return this.pokemon.stats.filter(stat =>
      ['speed'].includes(stat.stat.name)
    );
  }

  getAbilityDescription(abilityName: string): string {
    return this.abilityDescriptions[abilityName] || 'Descrição não disponível.';
  }

  // ==========================
  // MÉTODOS PARA ABA EVOLUÇÃO
  // ==========================

  getEvolutionMethodText(method: string): string {
    const methods: { [key: string]: string } = {
      'stone': 'Pedra Evolutiva',
      'trade': 'Troca',
      'happiness': 'Felicidade',
      'level-up': 'Subir de Nível',
      'other': 'Método Especial'
    };
    return methods[method] || method;
  }

  getEggGroups(): string {
    if (!this.speciesData?.egg_groups) return 'N/A';
    return this.speciesData.egg_groups.map((group: any) =>
      group.name.replace('-', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())
    ).join(', ');
  }

  getGrowthRate(): string {
    if (!this.speciesData?.growth_rate) return 'N/A';
    return this.speciesData.growth_rate.name.replace('-', ' ')
      .replace(/\b\w/g, (l: string) => l.toUpperCase());
  }

  // ==============================
  // MÉTODOS PARA ABA CURIOSIDADES
  // ==============================

  getCurrentFlavorText(): string {
    if (!this.flavorTexts || this.flavorTexts.length === 0) {
      return 'Nenhuma descrição disponível para este Pokémon.';
    }
    return this.flavorTexts[this.currentFlavorIndex] || this.flavorTexts[0];
  }

  previousFlavor(): void {
    if (this.currentFlavorIndex > 0) {
      this.currentFlavorIndex--;
      this.resetScrollAndCheckIndicator();
    }
  }

  nextFlavor(): void {
    if (this.currentFlavorIndex < this.flavorTexts.length - 1) {
      this.currentFlavorIndex++;
      this.resetScrollAndCheckIndicator();
    }
  }

  getPokemonBMI(): string {
    if (!this.pokemon?.height || !this.pokemon?.weight) return 'N/A';

    const heightInMeters = this.pokemon.height / 10;
    const weightInKg = this.pokemon.weight / 10;

    if (heightInMeters === 0) return 'N/A';

    const bmi = weightInKg / (heightInMeters * heightInMeters);
    return bmi.toFixed(1);
  }

  getPokemonTrivia(): string[] {
    const trivia: string[] = [];

    if (this.pokemon) {
      // Fatos baseados nas stats
      const totalStats = this.getTotalStats();
      if (totalStats > 600) {
        trivia.push('Este Pokémon tem stats excepcionalmente altas, sendo considerado lendário ou pseudo-lendário!');
      }

      // Fatos baseados no peso/altura
      const weight = (this.pokemon.weight || 0) / 10;
      const height = (this.pokemon.height || 0) / 10;

      if (weight > 100) {
        trivia.push(`Com ${weight}kg, este Pokémon é mais pesado que a maioria dos humanos!`);
      }

      if (height > 3) {
        trivia.push(`Medindo ${height}m de altura, este Pokémon é maior que um ser humano médio!`);
      }

      // Fatos baseados nos tipos
      if (this.pokemon.types) {
        const typeNames = this.pokemon.types.map(t => t.type.name);

        if (typeNames.includes('dragon')) {
          trivia.push('Pokémon do tipo Dragão são raros e poderosos na natureza!');
        }

        if (typeNames.includes('psychic')) {
          trivia.push('Pokémon Psíquicos podem comunicar-se telepaticamente!');
        }

        if (typeNames.includes('ghost')) {
          trivia.push('Pokémon Fantasma podem atravessar paredes sólidas!');
        }

        if (typeNames.length === 2) {
          trivia.push(`Este Pokémon possui duplo tipo: ${typeNames.map(t => t.charAt(0).toUpperCase() + t.slice(1)).join(' e ')}!`);
        }
      }

      // Fatos baseados na experiência base
      if (this.pokemon.base_experience) {
        if (this.pokemon.base_experience > 250) {
          trivia.push('Este Pokémon oferece muita experiência quando derrotado em batalha!');
        }
      }

      // Fatos gerais interessantes
      if (this.pokemon.id === 1) {
        trivia.push('Este é o primeiro Pokémon da Pokédex Nacional!');
      }

      if (this.pokemon.id === 150) {
        trivia.push('Mewtwo foi criado geneticamente por cientistas!');
      }

      if (this.pokemon.id === 151) {
        trivia.push('Mew é considerado o ancestral de todos os Pokémon!');
      }
    }

    // Se não há trivia específica, adicionar fatos gerais
    if (trivia.length === 0) {
      trivia.push('Cada Pokémon é único e especial à sua maneira!');
      trivia.push('Pokémon podem aprender movimentos através de treinamento e evolução.');
    }

    return trivia;
  }

  // ===================
  // MÉTODOS AUXILIARES
  // ===================

  /**
   * Detecta se o texto está em português baseado em palavras comuns
   */
  private isTextInPortuguese(text: string): boolean {
    if (!text) return false;

    const textLower = text.toLowerCase();

    // Palavras em português que são muito comuns nas descrições de Pokémon
    const portugueseWords = [
      'quando', 'que', 'uma', 'como', 'para', 'com', 'seu', 'sua', 'seus', 'suas',
      'este', 'esta', 'estes', 'estas', 'pelo', 'pela', 'pelos', 'pelas',
      'também', 'muito', 'mais', 'pode', 'tem', 'são', 'foi', 'será',
      'pokémon', 'cauda', 'corpo', 'força', 'energia', 'poder', 'ataque',
      'defesa', 'velocidade', 'água', 'fogo', 'terra', 'ar', 'luz', 'sombra'
    ];

    // Palavras em inglês que são muito comuns e indicam que o texto não está em português
    const englishWords = [
      'when', 'that', 'with', 'from', 'they', 'have', 'this', 'will', 'can',
      'its', 'the', 'and', 'but', 'for', 'are', 'was', 'were', 'been',
      'pokemon', 'tail', 'body', 'strength', 'energy', 'power', 'attack',
      'defense', 'speed', 'water', 'fire', 'ground', 'air', 'light', 'shadow'
    ];

    let portugueseCount = 0;
    let englishCount = 0;

    // Contar palavras portuguesas
    for (const word of portugueseWords) {
      if (textLower.includes(word)) {
        portugueseCount++;
      }
    }

    // Contar palavras inglesas
    for (const word of englishWords) {
      if (textLower.includes(word)) {
        englishCount++;
      }
    }

    // Se encontrou mais palavras em português que em inglês, considera português
    // Também considera português se encontrou pelo menos 2 palavras portuguesas e nenhuma inglesa
    return portugueseCount > englishCount || (portugueseCount >= 2 && englishCount === 0);
  }

  getBaseExperience(): string {
    return this.pokemon?.base_experience?.toString() || 'N/A';
  }

  getCaptureRate(): string {
    return this.speciesData?.capture_rate?.toString() || 'N/A';
  }

  getBaseHappiness(): string {
    return this.speciesData?.base_happiness?.toString() || 'N/A';
  }

  getPokemonColor(): string {
    const colorName = this.speciesData?.color?.name;
    if (!colorName) return 'N/A';
    return colorName.charAt(0).toUpperCase() + colorName.slice(1);
  }

  // =====================
  // MÉTODOS DE TRADUÇÃO
  // =====================

  getTranslatedStatName(statName: string): string {
    const statTranslations: { [key: string]: string } = {
      'hp': 'HP',
      'attack': 'Ataque',
      'defense': 'Defesa',
      'special-attack': 'Ataque Especial',
      'special-defense': 'Defesa Especial',
      'speed': 'Velocidade'
    };
    return statTranslations[statName] || statName;
  }

  getTranslatedTypeName(typeName: string): string {
    const typeTranslations: { [key: string]: string } = {
      'normal': 'Normal',
      'fire': 'Fogo',
      'water': 'Água',
      'electric': 'Elétrico',
      'grass': 'Planta',
      'ice': 'Gelo',
      'fighting': 'Lutador',
      'poison': 'Veneno',
      'ground': 'Terra',
      'flying': 'Voador',
      'psychic': 'Psíquico',
      'bug': 'Inseto',
      'rock': 'Pedra',
      'ghost': 'Fantasma',
      'dragon': 'Dragão',
      'dark': 'Sombrio',
      'steel': 'Aço',
      'fairy': 'Fada'
    };
    return typeTranslations[typeName] || typeName;
  }

  getTranslatedAbilityName(abilityName: string): string {
    // Mapear nomes de habilidades em inglês para português
    const abilityTranslations: { [key: string]: string } = {
      'overgrow': 'Supercrescimento',
      'chlorophyll': 'Clorofila',
      'blaze': 'Chama',
      'solar-power': 'Força Solar',
      'torrent': 'Torrente',
      'rain-dish': 'Prato de Chuva',
      'shield-dust': 'Pó do Escudo',
      'run-away': 'Fuga',
      'shed-skin': 'Trocar Pele',
      'compound-eyes': 'Olhos Compostos',
      'tinted-lens': 'Lente Colorida',
      'swarm': 'Enxame',
      'sniper': 'Atirador de Elite',
      'keen-eye': 'Olhar Keen',
      'tangled-feet': 'Pés Emaranhados',
      'big-pecks': 'Peito Grande',
      'guts': 'Coragem',
      'no-guard': 'Sem Guarda',
      'steadfast': 'Firme',
      'inner-focus': 'Foco Interior',
      'cute-charm': 'Charme Fofo',
      'magic-guard': 'Guarda Mágica',
      'friend-guard': 'Guarda Amigo',
      'static': 'Estático',
      'lightning-rod': 'Para-raios'
    };

    return abilityTranslations[abilityName] || abilityName.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getTranslatedAbilityDescription(abilityName: string): string {
    // Primeiro tenta buscar a descrição traduzida
    const translatedDesc = this.abilityDescriptions[abilityName];
    if (translatedDesc && translatedDesc !== 'Descrição não disponível.') {
      return translatedDesc;
    }

    // Fallback para descrições básicas em português
    const basicDescriptions: { [key: string]: string } = {
      'overgrow': 'Potencializa ataques do tipo Planta quando o HP está baixo.',
      'chlorophyll': 'Aumenta a velocidade em dias ensolarados.',
      'blaze': 'Potencializa ataques do tipo Fogo quando o HP está baixo.',
      'solar-power': 'Aumenta o Ataque Especial em dias ensolarados, mas perde HP.',
      'torrent': 'Potencializa ataques do tipo Água quando o HP está baixo.',
      'rain-dish': 'Recupera HP gradualmente em dias chuvosos.',
      'shield-dust': 'Bloqueia efeitos adicionais dos ataques recebidos.',
      'run-away': 'Permite sempre fugir de Pokémon selvagens.',
      'shed-skin': 'Pode curar problemas de status por conta própria.',
      'compound-eyes': 'Aumenta a precisão dos ataques.',
      'tinted-lens': 'Potencializa ataques "não muito eficazes".',
      'swarm': 'Potencializa ataques do tipo Inseto quando o HP está baixo.',
      'sniper': 'Potencializa ainda mais os ataques críticos.',
      'keen-eye': 'Impede a redução da precisão.',
      'tangled-feet': 'Aumenta a evasão quando confuso.',
      'big-pecks': 'Protege contra redução da Defesa.',
      'guts': 'Aumenta o Ataque quando sofre de problemas de status.',
      'no-guard': 'Garante que todos os ataques acertem.',
      'steadfast': 'Aumenta a Velocidade quando recua.',
      'inner-focus': 'Protege contra recuo.',
      'cute-charm': 'Pode causar paixão no oponente ao receber contato.',
      'magic-guard': 'Só recebe dano de ataques diretos.',
      'friend-guard': 'Reduz dano aos aliados.',
      'static': 'Pode causar paralisia no oponente ao receber contato.',
      'lightning-rod': 'Atrai ataques elétricos e aumenta o Ataque Especial.'
    };

    return basicDescriptions[abilityName] || 'Descrição não disponível.';
  }

  // ==============================
  // MÉTODOS PARA CONTROLE DO SCROLL DOS FLAVORS
  // ==============================

  onFlavorTextScroll(event: Event): void {
    const element = event.target as HTMLElement;
    const isScrollable = element.scrollHeight > element.clientHeight;
    const isScrolledToBottom = element.scrollTop + element.clientHeight >= element.scrollHeight - 5;

    this.showScrollIndicator = isScrollable && !isScrolledToBottom;
  }

  private resetScrollAndCheckIndicator(): void {
    // Aguardar a próxima renderização para verificar o scroll
    setTimeout(() => {
      if (this.flavorTextWrapper?.nativeElement) {
        const element = this.flavorTextWrapper.nativeElement;
        element.scrollTop = 0; // Reset scroll position
        this.checkScrollIndicator();
      }
    }, 0);
  }

  private checkScrollIndicator(): void {
    if (this.flavorTextWrapper?.nativeElement) {
      const element = this.flavorTextWrapper.nativeElement;
      const isScrollable = element.scrollHeight > element.clientHeight;
      this.showScrollIndicator = isScrollable;

      // Auto-hide indicator after 3 seconds
      if (this.showScrollIndicator) {
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
}