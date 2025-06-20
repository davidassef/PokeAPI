// Serviço para integração com webhook de ranking de favoritos
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const WEBHOOK_URL = 'https://seu-webhook-url.com/pokemon-favorite'; // Substitua pelo endpoint real
const RANKING_URL = 'https://seu-webhook-url.com/pokemon-ranking';

@Injectable({ providedIn: 'root' })
export class PokeUiRankingService {
  constructor(private http: HttpClient) {}

  sendFavoriteEvent(pokemonId: number, action: 'favorite'|'unfavorite') {
    return this.http.post(WEBHOOK_URL, { pokemonId, action }).subscribe();
  }

  getRanking(): Observable<{pokemonId: number, count: number}[]> {
    return this.http.get<{pokemonId: number, count: number}[]>(RANKING_URL);
  }
}
