import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-pokemon-image',
  templateUrl: './pokemon-image.component.html',
  styleUrls: ['./pokemon-image.component.scss']
})
export class PokemonImageComponent {
  @Input() imageUrl!: string;
  @Input() name!: string;
  @Output() error = new EventEmitter<void>();
  loading = true;
  errored = false;

  onLoad() { this.loading = false; }
  onError() { this.errored = true; this.loading = false; this.error.emit(); }
} 