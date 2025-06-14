import { Component, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { AudioService } from './services/audio.service';
import { LocalizationService } from './services/localization.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  constructor(
    private audioService: AudioService,
    private localizationService: LocalizationService
  ) {}

  ngOnInit() {
    // Inicializa os serviços
    // O AudioService se auto-inicializa e escuta mudanças de idioma
    // O LocalizationService carrega a configuração salva
  }
}
