import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { Router, RouterModule } from '@angular/router';
import { PokeUiHomeComponent } from '../../poke-ui/poke-ui-home.component';

/**
 * Página principal do aplicativo Pokémon.
 * Integra o componente PokeUI dentro da estrutura de navegação por tabs.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,  imports: [
    CommonModule,
    FormsModule,
    IonicModule,
    RouterModule,
    PokeUiHomeComponent,
  ],
})
export class HomePage implements OnInit {
  /**
   * Construtor da página home.
   */
  constructor() {}

  /**
   * Método de inicialização do componente.
   * Executado após a criação do componente.
   */  ngOnInit(): void {
    // HomePage inicializada - integra PokeUI com navegação por tabs
  }

  /**
   * Método executado quando a página está prestes a aparecer.
   * Usado para atualizar dados quando o usuário navega para esta página.
   */  ionViewWillEnter(): void {
    // HomePage será exibida
  }

}
