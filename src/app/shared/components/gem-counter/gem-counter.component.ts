import { Component, Input } from '@angular/core';
import { BoardComponent } from '@shared/components/board/board.component';

/**
 * Componente DUMB — Contador de gemas del jugador.
 *
 * Muestra la cantidad de gemas dentro de un tablero decorativo. No contiene lógica;
 * recibe la cantidad como input desde el componente padre.
 *
 * @example
 * ```html
 * <app-gem-counter [amount]="playerGems" />
 * ```
 *
 * Inputs:
 *   - `amount` — cantidad de gemas a mostrar (por defecto: 0).
 */

@Component({
  selector: 'app-gem-counter',
  templateUrl: './gem-counter.component.html',
  styleUrls: ['./gem-counter.component.scss'],
  imports: [BoardComponent], // Importamos el board porque lo usa internamente
})
export class GemCounterComponent {
  // Recibe la cantidad de gemas desde el componente padre
  @Input() amount: number = 0;
}
