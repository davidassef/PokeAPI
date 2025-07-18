import { Component, OnInit, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { ModalController, ToastController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { FormBuilder, FormGroup, Validators, FormArray } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { PokemonManagementService, PokemonCreateData, PokemonUpdateData } from '../../../core/services/pokemon-management.service';

export interface PokemonFormData {
  id?: number;
  name: string;
  height: number;
  weight: number;
  base_experience: number;
  types: Array<{ type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  abilities: Array<{ ability: { name: string } }>;
  sprites: {
    front_default?: string;
    front_shiny?: string;
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
}

@Component({
  selector: 'app-admin-pokemon-modal',
  templateUrl: './admin-pokemon-modal.component.html',
  styleUrls: ['./admin-pokemon-modal.component.scss']
})
export class AdminPokemonModalComponent implements OnInit, OnDestroy {
  @Input() pokemon?: PokemonFormData;
  @Input() mode: 'add' | 'edit' = 'add';
  @Output() modalClose = new EventEmitter<{ success: boolean; pokemon?: PokemonFormData }>();

  private destroy$ = new Subject<void>();

  pokemonForm!: FormGroup;
  loading = false;
  error = '';
  success = '';

  // Listas para dropdowns
  availableTypes = [
    'normal', 'fire', 'water', 'electric', 'grass', 'ice',
    'fighting', 'poison', 'ground', 'flying', 'psychic', 'bug',
    'rock', 'ghost', 'dragon', 'dark', 'steel', 'fairy'
  ];

  availableStats = [
    'hp', 'attack', 'defense', 'special-attack', 'special-defense', 'speed'
  ];

  constructor(
    private modalController: ModalController,
    private toastController: ToastController,
    private alertController: AlertController,
    private translateService: TranslateService,
    private formBuilder: FormBuilder,
    private pokemonManagementService: PokemonManagementService
  ) {
    this.initializeForm();
  }

  ngOnInit() {
    if (this.pokemon && this.mode === 'edit') {
      this.populateForm();
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private initializeForm() {
    this.pokemonForm = this.formBuilder.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      height: [0, [Validators.required, Validators.min(1)]],
      weight: [0, [Validators.required, Validators.min(1)]],
      base_experience: [0, [Validators.required, Validators.min(1)]],
      types: this.formBuilder.array([], [Validators.required, Validators.minLength(1)]),
      stats: this.formBuilder.array([]),
      abilities: this.formBuilder.array([]),
      sprites: this.formBuilder.group({
        front_default: [''],
        front_shiny: [''],
        official_artwork: ['']
      })
    });

    // Inicializa com pelo menos um tipo e stats básicos
    this.addType();
    this.initializeStats();
  }

  private populateForm() {
    if (!this.pokemon) return;

    this.pokemonForm.patchValue({
      name: this.pokemon.name,
      height: this.pokemon.height,
      weight: this.pokemon.weight,
      base_experience: this.pokemon.base_experience,
      sprites: {
        front_default: this.pokemon.sprites.front_default || '',
        front_shiny: this.pokemon.sprites.front_shiny || '',
        official_artwork: this.pokemon.sprites.other?.['official-artwork']?.front_default || ''
      }
    });

    // Popula tipos
    const typesArray = this.pokemonForm.get('types') as FormArray;
    typesArray.clear();
    this.pokemon.types.forEach(type => {
      typesArray.push(this.formBuilder.control(type.type.name, Validators.required));
    });

    // Popula stats
    const statsArray = this.pokemonForm.get('stats') as FormArray;
    statsArray.clear();
    this.pokemon.stats.forEach(stat => {
      statsArray.push(this.formBuilder.group({
        name: [stat.stat.name, Validators.required],
        value: [stat.base_stat, [Validators.required, Validators.min(1)]]
      }));
    });

    // Popula habilidades
    const abilitiesArray = this.pokemonForm.get('abilities') as FormArray;
    abilitiesArray.clear();
    this.pokemon.abilities.forEach(ability => {
      abilitiesArray.push(this.formBuilder.control(ability.ability.name, Validators.required));
    });
  }

  private initializeStats() {
    const statsArray = this.pokemonForm.get('stats') as FormArray;
    this.availableStats.forEach(statName => {
      statsArray.push(this.formBuilder.group({
        name: [statName, Validators.required],
        value: [50, [Validators.required, Validators.min(1), Validators.max(255)]]
      }));
    });
  }

  // Getters para FormArrays
  get types(): FormArray {
    return this.pokemonForm.get('types') as FormArray;
  }

  get stats(): FormArray {
    return this.pokemonForm.get('stats') as FormArray;
  }

  get abilities(): FormArray {
    return this.pokemonForm.get('abilities') as FormArray;
  }

  // Métodos para gerenciar tipos
  addType() {
    if (this.types.length < 2) {
      this.types.push(this.formBuilder.control('', Validators.required));
    }
  }

  removeType(index: number) {
    if (this.types.length > 1) {
      this.types.removeAt(index);
    }
  }

  // Métodos para gerenciar habilidades
  addAbility() {
    this.abilities.push(this.formBuilder.control('', Validators.required));
  }

  removeAbility(index: number) {
    this.abilities.removeAt(index);
  }

  // Validação do formulário
  private validateForm(): boolean {
    this.error = '';

    if (this.pokemonForm.invalid) {
      this.showError('admin.pokemon.validation.form_invalid');
      return false;
    }

    // Validações específicas
    const types = this.types.value;
    if (types.length === 0) {
      this.showError('admin.pokemon.validation.types_required');
      return false;
    }

    // Verifica se não há tipos duplicados
    const uniqueTypes = new Set(types);
    if (uniqueTypes.size !== types.length) {
      this.showError('admin.pokemon.validation.duplicate_types');
      return false;
    }

    return true;
  }

  // Salvar Pokemon
  async savePokemon() {
    if (!this.validateForm()) return;

    this.loading = true;
    this.error = '';

    try {
      const formData = this.pokemonForm.value;

      // Formata os dados para o formato esperado pela API
      const pokemonData: PokemonFormData = {
        ...(this.mode === 'edit' && this.pokemon?.id && { id: this.pokemon.id }),
        name: formData.name.toLowerCase(),
        height: formData.height,
        weight: formData.weight,
        base_experience: formData.base_experience,
        types: formData.types.map((type: string) => ({ type: { name: type } })),
        stats: formData.stats.map((stat: any) => ({
          base_stat: stat.value,
          stat: { name: stat.name }
        })),
        abilities: formData.abilities.map((ability: string) => ({ ability: { name: ability } })),
        sprites: {
          front_default: formData.sprites.front_default || null,
          front_shiny: formData.sprites.front_shiny || null,
          other: {
            'official-artwork': {
              front_default: formData.sprites.official_artwork || null
            }
          }
        }
      };

      // Chama a API para salvar o Pokemon
      if (this.mode === 'add') {
        const createObservable = await this.pokemonManagementService.createPokemon(pokemonData as PokemonCreateData);
        createObservable.subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.showSuccess('admin.pokemon.success.created');
              setTimeout(() => {
                this.modalClose.emit({ success: true, pokemon: response.data });
              }, 1500);
            } else {
              throw new Error(response.message || 'Falha ao criar Pokemon');
            }
          },
          error: (error) => {
            console.error('Erro ao criar Pokemon:', error);
            this.showError('admin.pokemon.error.save_failed');
            this.loading = false;
          }
        });
      } else {
        const updateObservable = await this.pokemonManagementService.updatePokemon(pokemonData as PokemonUpdateData);
        updateObservable.subscribe({
          next: (response) => {
            if (response.success && response.data) {
              this.showSuccess('admin.pokemon.success.updated');
              setTimeout(() => {
                this.modalClose.emit({ success: true, pokemon: response.data });
              }, 1500);
            } else {
              throw new Error(response.message || 'Falha ao atualizar Pokemon');
            }
          },
          error: (error) => {
            console.error('Erro ao atualizar Pokemon:', error);
            this.showError('admin.pokemon.error.save_failed');
            this.loading = false;
          }
        });
      }

    } catch (error) {
      console.error('Erro ao salvar Pokemon:', error);
      this.showError('admin.pokemon.error.save_failed');
    } finally {
      this.loading = false;
    }
  }

  // Confirmar exclusão (apenas para modo edit)
  async confirmDelete() {
    const alert = await this.alertController.create({
      header: await this.translateService.get('admin.pokemon.delete.confirm_title').toPromise(),
      message: await this.translateService.get('admin.pokemon.delete.confirm_message', { name: this.pokemon?.name }).toPromise(),
      buttons: [
        {
          text: await this.translateService.get('common.cancel').toPromise(),
          role: 'cancel'
        },
        {
          text: await this.translateService.get('admin.pokemon.delete.confirm_button').toPromise(),
          role: 'destructive',
          handler: () => this.deletePokemon()
        }
      ]
    });

    await alert.present();
  }

  // Deletar Pokemon
  async deletePokemon() {
    if (!this.pokemon?.id) return;

    this.loading = true;
    this.error = '';

    try {
      // Chama a API para deletar o Pokemon
      const deleteObservable = await this.pokemonManagementService.deletePokemon(this.pokemon.id);
      deleteObservable.subscribe({
        next: (response) => {
          if (response.success) {
            this.showSuccess('admin.pokemon.success.deleted');
            setTimeout(() => {
              this.modalClose.emit({ success: true });
            }, 1500);
          } else {
            throw new Error(response.message || 'Falha ao deletar Pokemon');
          }
        },
        error: (error) => {
          console.error('Erro ao deletar Pokemon:', error);
          this.showError('admin.pokemon.error.delete_failed');
          this.loading = false;
        }
      });

    } catch (error) {
      console.error('Erro ao deletar Pokemon:', error);
      this.showError('admin.pokemon.error.delete_failed');
      this.loading = false;
    }
  }

  // Fechar modal
  closeModal() {
    this.modalClose.emit({ success: false });
  }

  // Métodos auxiliares
  private showError(messageKey: string) {
    this.translateService.get(messageKey).pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      this.error = message;
    });
  }

  private showSuccess(messageKey: string) {
    this.translateService.get(messageKey).pipe(
      takeUntil(this.destroy$)
    ).subscribe(message => {
      this.success = message;
    });
  }

  // Getter para título do modal
  get modalTitle(): string {
    return this.mode === 'add' ? 'admin.pokemon.add_title' : 'admin.pokemon.edit_title';
  }
}
