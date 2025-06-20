import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

/**
 * Componente de conquistas do usuário na Pokédex.
 * Exibe conquistas desbloqueadas e progresso.
 */
@Component({
  selector: 'poke-ui-achievements',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './poke-ui-achievements.component.html',
  styleUrls: ['./poke-ui-achievements.component.scss'],
})
export class PokeUiAchievementsComponent {
  @Input() achievements: { id: string; name: string; unlocked: boolean; description: string }[] = [];
}
