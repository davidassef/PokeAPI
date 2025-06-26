import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AlertController, ToastController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subject, takeUntil } from 'rxjs';
import { Pokemon, FavoritePokemon } from '../../models/pokemon.model';
import { CapturedService } from '../../core/services/captured.service';
import { PokeApiService } from '../../core/services/pokeapi.service';
import { AudioService } from '../../core/services/audio.service';

@Component({
  selector: 'app-captured',
  templateUrl: './captured.page.html',
  styleUrls: ['./captured.page.scss'],
})
export class CapturedPage implements OnInit, OnDestroy {
  capturedPokemon: Pokemon[] = [];
  filteredCaptured: Pokemon[] = [];
  capturedData: FavoritePokemon[] = [];
  searchTerm = '';
  sortBy: 'id' | 'name' = 'id';
  sortOrder: 'asc' | 'desc' = 'asc';
  loading = false;

  private destroy$ = new Subject<void>();

  constructor(
    private capturedService: CapturedService,
    private pokeApiService: PokeApiService,
    private audioService: AudioService,
    private alertController: AlertController,
    private toastController: ToastController,
    private translate: TranslateService,
    public router: Router // Make router public for template access
  ) {}

  ngOnInit() {
    this.loadCaptured();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  async loadCaptured() {
    this.loading = true;
    try {
      this.capturedService.captured$
        .pipe(takeUntil(this.destroy$))
        .subscribe(async (captured) => {
          this.capturedData = captured;
          const pokemonPromises = captured.map(c =>
            this.pokeApiService.getPokemon(c.pokemon_id).toPromise()
          );
          const pokemonData = await Promise.all(pokemonPromises);
          this.capturedPokemon = pokemonData.filter(p => p !== undefined) as Pokemon[];
          this.applyFilters();
          this.loading = false;
        });
    } catch (error) {
      console.error('Erro ao carregar capturados:', error);
      this.loading = false;
    }
  }

  onSearch(event: any) {
    this.searchTerm = event.target.value.toLowerCase().trim();
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = [...this.capturedPokemon];
    if (this.searchTerm) {
      filtered = filtered.filter(pokemon =>
        pokemon.name.toLowerCase().includes(this.searchTerm)
      );
    }
    filtered.sort((a, b) => {
      let comparison = 0;
      if (this.sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else {
        comparison = a.id - b.id;
      }
      return this.sortOrder === 'desc' ? -comparison : comparison;
    });
    this.filteredCaptured = filtered;
  }

  async removeCaptured(pokemon: Pokemon, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    const alert = await this.alertController.create({
      header: await this.translate.get('captured.confirm_removal').toPromise(),
      message: await this.translate.get('captured.confirm_release_captured', { name: pokemon.name }).toPromise(),
      buttons: [
        {
          text: await this.translate.get('captured.cancel').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('captured.release').toPromise(),
          handler: async () => {
            try {
              await this.capturedService.removeFromCaptured(pokemon.id);
              await this.audioService.playSound('/assets/audio/remove.wav');
              await this.showToast('captured.released_captured', pokemon.name);
            } catch (error) {
              console.error('Erro ao soltar capturado:', error);
              await this.showErrorToast('captured.error_release_captured');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async clearAllCaptured() {
    if (this.capturedPokemon.length === 0) {
      return;
    }
    const alert = await this.alertController.create({
      header: await this.translate.get('captured.confirm_clear_all').toPromise(),
      message: await this.translate.get('captured.confirm_clear_all_captured').toPromise(),
      buttons: [
        {
          text: await this.translate.get('captured.cancel').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translate.get('captured.clear_all').toPromise(),
          handler: async () => {
            try {
              await this.capturedService.clearAllCaptured();
              await this.audioService.playSound('/assets/audio/clear.wav');
              await this.showToast('captured.cleared_all_captured');
            } catch (error) {
              console.error('Erro ao limpar capturados:', error);
              await this.showErrorToast('captured.error_clear_captured');
            }
          }
        }
      ]
    });
    await alert.present();
  }

  async exportCaptured() {
    try {
      const exported = await this.capturedService.exportCaptured();
      const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(exported);
      const downloadAnchorNode = document.createElement('a');
      downloadAnchorNode.setAttribute("href", dataStr);
      downloadAnchorNode.setAttribute("download", "pokemon-captured.json");
      document.body.appendChild(downloadAnchorNode);
      downloadAnchorNode.click();
      downloadAnchorNode.remove();
      await this.showToast('captured.captured_exported');
    } catch (error) {
      console.error('Erro ao exportar capturados:', error);
      await this.showErrorToast('captured.error_export_captured');
    }
  }

  async importCaptured(event: any) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result as string;
        await this.capturedService.importCaptured(content);
        await this.showToast('captured.captured_imported');
        event.target.value = '';
      } catch (error) {
        console.error('Erro ao importar capturados:', error);
        await this.showErrorToast('captured.error_import_captured');
      }
    };
    reader.readAsText(file);
  }

  async onRefresh(event: any) {
    await this.loadCaptured();
    event.target.complete();
  }

  getStatsTotal(pokemon: Pokemon): number {
    return pokemon.stats.reduce((total, stat) => total + stat.base_stat, 0);
  }

  getUniqueTypes(): string[] {
    const types = new Set<string>();
    this.capturedPokemon.forEach(pokemon => {
      pokemon.types.forEach(type => types.add(type.type.name));
    });
    return Array.from(types);
  }

  getAverageStats(): number {
    if (this.capturedPokemon.length === 0) return 0;
    const totalStats = this.capturedPokemon.reduce((sum, pokemon) => {
      return sum + this.getStatsTotal(pokemon);
    }, 0);
    return Math.round(totalStats / this.capturedPokemon.length);
  }

  trackByPokemonId(index: number, pokemon: Pokemon): number {
    return pokemon.id;
  }

  getAnimationDelay(index: number): number {
    return index * 100;
  }

  navigateToDetails(pokemonId: number) {
    this.router.navigate(['/pokemon', pokemonId]);
  }

  goToDetails(id: number) {
    this.router.navigate(['/details', id]);
  }

  async onCapturedToggle(pokemon: Pokemon) {
    this.loadCaptured();
  }

  private async showToast(messageKey: string, pokemonName?: string) {
    const message = await this.translate.get(messageKey, { name: pokemonName }).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 2000,
      position: 'bottom',
      color: 'success'
    });
    await toast.present();
  }

  private async showErrorToast(messageKey: string) {
    const message = await this.translate.get(messageKey).toPromise();
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color: 'danger'
    });
    await toast.present();
  }
}
