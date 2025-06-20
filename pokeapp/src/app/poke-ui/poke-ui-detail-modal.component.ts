import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Pokemon, PokemonSpecies } from '../models/pokemon.model';
import { PokemonApiService } from '../services/pokemon-api.service';
import { EvolutionChain } from '../models/evolution.model';

/**
 * Modal de detalhes do Pokémon.
 * Exibe informações completas, sprites, stats, flavor text, linha evolutiva e curiosidades.
 * Acessível e responsivo.
 */
@Component({
  selector: 'poke-ui-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poke-ui-detail-modal.component.html',
  styleUrls: ['./poke-ui-detail-modal.component.scss'],
  providers: [PokemonApiService],
})
export class PokeUiDetailModalComponent implements OnInit, OnDestroy, OnChanges {
  /** Pokémon a ser exibido no modal */
  @Input() pokemon: Pokemon | null = null;
  /** Evento de fechamento do modal */
  @Output() close = new EventEmitter<void>();
  /** Evento para navegar para o próximo Pokémon */
  @Output() next = new EventEmitter<void>();
  /** Evento para navegar para o Pokémon anterior */
  @Output() prev = new EventEmitter<void>();

  species: PokemonSpecies | null = null;
  flavorText: string = '';
  evolutionChain: EvolutionChain | null = null;
  curiosidades: string[] = [
    'Pikachu foi o primeiro Pokémon a ter voz própria no anime.',
    'MissingNo é um famoso glitch da primeira geração.',
    'Magikarp é considerado o Pokémon mais inútil, mas evolui para Gyarados.',
    'Ditto pode se transformar em qualquer outro Pokémon.',
    'Eevee possui o maior número de evoluções possíveis.',
    'Wobbuffet é inspirado em um boneco de mola japonês.',
    'Jynx já teve sua cor alterada por questões culturais.',
    'Mewtwo foi criado a partir do DNA de Mew.',
    'Snorlax dorme em locais que bloqueiam o caminho dos treinadores.',
    'Farfetch’d sempre carrega um alho-poró.',
  ];
  easterEgg: boolean = false;

  constructor(private pokemonApi: PokemonApiService) {}

  /** Retorna a URL do sprite padrão do Pokémon. */
  getSpriteUrl(): string {
    return this.pokemon?.sprites?.front_default || '';
  }

  /** Retorna a URL do sprite shiny do Pokémon. */
  getShinyUrl(): string {
    return this.pokemon?.sprites?.front_shiny || '';
  }

  /** Fecha o modal */
  fecharModal() {
    this.close.emit();
  }

  /** Próximo Pokémon */
  proximoPokemon() {
    this.next.emit();
  }

  /** Pokémon anterior */
  anteriorPokemon() {
    this.prev.emit();
  }

  ngOnChanges() {
    if (this.pokemon) {
      this.loadSpecies(this.pokemon.id);
      this.easterEgg = this.pokemon.name.toLowerCase() === 'missingno';
    }
  }

  ngOnInit() {
    window.addEventListener('pokeui:selectByName', this.handleSelectByName as EventListener);
  }

  ngOnDestroy() {
    window.removeEventListener('pokeui:selectByName', this.handleSelectByName as EventListener);
  }

  handleSelectByName = (event: any) => {
    const name = event.detail;
    // Emite evento para o componente pai buscar e exibir o Pokémon pelo nome
    this.close.emit();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pokeui:externalSelect', { detail: name }));
    }, 200);
  };

  loadSpecies(id: number) {
    this.pokemonApi.getPokemonSpecies(id).subscribe({
      next: (species) => {
        this.species = species;
        const entry = species.flavor_text_entries?.find(e => e.language.name === 'pt' || e.language.name === 'en');
        this.flavorText = entry ? entry.flavor_text.replace(/\f|\n/g, ' ') : '';
        if (species && (species as any).evolution_chain?.url) {
          this.loadEvolutionChain((species as any).evolution_chain.url);
        } else {
          this.evolutionChain = null;
        }
      },
      error: () => {
        this.flavorText = '';
        this.evolutionChain = null;
      },
    });
  }

  loadEvolutionChain(url: string) {
    this.pokemonApi.getEvolutionChain(url).subscribe({
      next: (chain) => {
        this.evolutionChain = chain;
      },
      error: () => {
        this.evolutionChain = null;
      },
    });
  }

  /**
   * Retorna a lista linear de espécies da cadeia evolutiva
   */
  getEvolutionSpeciesList(): { name: string; url: string }[] {
    const list: { name: string; url: string }[] = [];
    function traverse(link: any) {
      if (link && link.species) {
        list.push(link.species);
        if (link.evolves_to && link.evolves_to.length > 0) {
          traverse(link.evolves_to[0]);
        }
      }
    }
    if (this.evolutionChain) {
      traverse(this.evolutionChain.chain);
    }
    return list;
  }

  /**
   * Navega para o Pokémon da linha evolutiva selecionado
   */
  selecionarEvolucao(nome: string) {
    // Emite evento para o componente pai buscar e exibir o Pokémon pelo nome
    this.close.emit();
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('pokeui:selectByName', { detail: nome }));
    }, 200);
  }

  getCuriosidadeAleatoria(): string {
    return this.curiosidades[Math.floor(Math.random() * this.curiosidades.length)];
  }

  /**
   * Extrai o ID do Pokémon a partir da URL da espécie evolutiva
   */
  getIdFromSpeciesUrl(url: string): string {
    const parts = url.split('/').filter(u => !!u);
    return parts[parts.length - 1] || '';
  }
}
