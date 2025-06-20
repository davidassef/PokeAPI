// Componente de ranking dos Pokémon mais favoritados
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PokeUiRankingService } from './poke-ui-ranking.service';

@Component({
  selector: 'poke-ui-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poke-ui-ranking.component.html',
  styleUrls: ['./poke-ui-ranking.component.scss'],
})
export class PokeUiRankingComponent implements OnInit {
  ranking: {pokemonId: number, count: number}[] = [];
  isLoading = true;
  constructor(private rankingService: PokeUiRankingService) {}
  ngOnInit() {
    this.rankingService.getRanking().subscribe(r => {
      this.ranking = r;
      this.isLoading = false;
    });
  }
}
