import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs } from '@ionic/angular/standalone';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  constructor() {
    // Ícones removidos - navegação agora é pelo header compartilhado
  }
}
