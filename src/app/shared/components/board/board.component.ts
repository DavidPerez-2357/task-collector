import { Component, Input } from '@angular/core';

/**
 * Componente DUMB — Contenedor con borde decorativo estilo tablero de madera.
 *
 * Envuelve su contenido en un marco con imagen de borde escalable. El tamaño del marco
 * y del contenedor son configurables mediante inputs.
 *
 * @example
 * ```html
 * <app-board width="300px" height="200px" borderSize="medium">
 *   <p>Contenido del tablero</p>
 * </app-board>
 * ```
 *
 * Inputs:
 *   - `width`       — ancho del contenedor (por defecto: 'fit-content').
 *   - `height`      — alto del contenedor (por defecto: 'fit-content').
 *   - `borderSize`  — tamaño del borde: 'small' (20 px), 'medium' (25 px) o 'large' (30 px).
 */

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  imports: [],
})
export class BoardComponent {
  @Input() width: string = 'fit-content';
  @Input() height: string = 'fit-content';
  @Input() borderSize: 'small' | 'medium' | 'large' = 'small';

  get borderSizeValue() {
    switch (this.borderSize) {
      case 'small':
        return 20;
      case 'medium':
        return 25;
      case 'large':
        return 30;
      default:
        return 25;
    }
  }

  get borderSizeValuePx() {
    return `${this.borderSizeValue}px`;
  }

  get borderSource() {
    return `url(/assets/ui/board-${this.borderSize}.png)`;
  }
}
