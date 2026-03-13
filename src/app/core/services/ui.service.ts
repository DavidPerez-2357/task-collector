/**
 * Servicio para controlar la visibilidad de los "corner buttons" (config/shop).
 * Por defecto están visibles.
 *
 * Uso desde un componente standalone:
 *
 * import { inject } from '@angular/core';
 * import { UIService } from '@core/services/ui.service';
 *
 * export default function MyComponent() {
 *   const ui = inject(UIService);
 *   // en la plantilla: *ngIf="ui.showCornerButtons()"
 * }
 *
 * También puedes inyectarlo con el array providers o en el constructor si usas esa forma.
 */

import { Injectable, signal, Signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class UIService {
  // Señal que controla la visibilidad; true por defecto
  private _showCornerButtons = signal<boolean>(true);

  // Getter para exponer la signal (se puede llamar desde plantilla con ui.showCornerButtons())
  get showCornerButtons(): Signal<boolean> {
    return this._showCornerButtons;
  }

  // Métodos de conveniencia
  setVisible(visible: boolean): void {
    this._showCornerButtons.set(visible);
  }

  show(): void {
    this._showCornerButtons.set(true);
  }

  hide(): void {
    this._showCornerButtons.set(false);
  }

  toggle(): void {
    this._showCornerButtons.update((v) => !v);
  }
}
