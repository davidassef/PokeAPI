import { Component, Input } from '@angular/core';

/**
 * Componente de spinner de carregamento personalizado
 * 
 * Este componente exibe um indicador de carregamento com diferentes estilos
 * e tamanhos. Pode ser usado como overlay ou inline, com animações
 * baseadas em Pokébola ou spinner padrão.
 * 
 * @example
 * <!-- Spinner padrão -->
 * <app-loading-spinner message="Carregando..."></app-loading-spinner>
 * 
 * <!-- Spinner com Pokébola -->
 * <app-loading-spinner 
 *   type="pokeball" 
 *   size="large" 
 *   message="Capturando Pokémon..."
 *   [overlay]="true">
 * </app-loading-spinner>
 */
@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.scss']
})
export class LoadingSpinnerComponent {
  /** Mensagem exibida durante o carregamento */
  @Input() message = 'Loading...';
  
  /** Tipo de spinner: 'pokeball' para animação de Pokébola ou 'standard' para spinner circular */
  @Input() type: 'pokeball' | 'standard' = 'pokeball';
  
  /** Tamanho do spinner: 'small', 'medium' ou 'large' */
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  
  /** Se true, o spinner é exibido como overlay sobre o conteúdo */
  @Input() overlay = false;
}
