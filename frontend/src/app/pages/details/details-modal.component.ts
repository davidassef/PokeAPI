import { Component, Input, OnInit, EventEmitter, Output, ElementRef, ViewChild, AfterViewInit, OnDestroy } from '@angular/core';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { Pokemon } from '../../models/pokemon.model';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-details-modal',
  templateUrl: './details-modal.component.html',
  styleUrls: ['./details-modal.component.scss']
})
export class DetailsModalComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() pokemonId!: number;
  @Output() close = new EventEmitter<void>();
  @ViewChild('closeBtn', { static: false }) closeBtn!: ElementRef<HTMLButtonElement>;

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

  // Flavor text
  flavorText: string = '';
  flavorTexts: string[] = [];
  currentFlavorIndex: number = 0;

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

  constructor(private pokeApiService: PokeApiService, private http: HttpClient) {}

  ngOnInit(): void {
    if (this.pokemonId) {
      this.loading = true;
      this.pokeApiService.getPokemon(this.pokemonId).subscribe({
        next: (data) => {
          this.pokemon = data;
          this.currentImageUrl = this.getCurrentImage();
          this.setupCarouselImages();
          this.fetchFlavorText();
          this.loading = false;
        },
        error: () => {
          this.loading = false;
        }
      });
    }
    window.addEventListener('keydown', this.escListener);
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.closeBtn?.nativeElement?.focus();
    }, 100);
  }

  ngOnDestroy(): void {
    window.removeEventListener('keydown', this.escListener);
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
    this.http.get<any>(`https://pokeapi.co/api/v2/pokemon-species/${this.pokemonId}/`).subscribe({
      next: (data) => {
        // Filtra por PT-BR, se não houver, pega EN
        const ptEntries = data.flavor_text_entries.filter((e: any) => e.language.name === 'pt');
        const enEntries = data.flavor_text_entries.filter((e: any) => e.language.name === 'en');
        const entries = ptEntries.length > 0 ? ptEntries : enEntries;
        this.flavorTexts = entries.map((e: any) => e.flavor_text.replace(/\f|\n/g, ' ')).filter((txt: string, idx: number, arr: string[]) => arr.indexOf(txt) === idx);
        this.flavorText = this.flavorTexts[0] || '';
        this.currentFlavorIndex = 0;
      }
    });
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
} 