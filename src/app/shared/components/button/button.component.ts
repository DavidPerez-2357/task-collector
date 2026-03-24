import { Component, EventEmitter, Input, Output } from '@angular/core';
import { AppColors } from '@core/types/colors.types';
import { NgStyle } from '@angular/common';

/**
 * Componente DUMB — Botón personalizado con estilos del tema de la aplicación.
 *
 * Presenta un botón estilizado que adapta colores, relleno y borde según los tokens de color
 * definidos en `AppColors`. No contiene lógica de negocio.
 *
 * @example
 * ```html
 * <app-button type="primary" [fill]="true" [border]="false" (handleClick)="doSomething()">
 *   Aceptar
 * </app-button>
 * ```
 *
 * Inputs:
 *   - `type`      — color del botón según `AppColors` (por defecto: 'primary').
 *   - `fill`      — si es true, el fondo es sólido; si es false, es transparente con texto coloreado.
 *   - `border`    — si es true, añade un borde del color del tipo.
 *   - `disabled`  — deshabilita el botón nativo: aplica estado visual y evita clics del DOM (solo seguirán siendo posibles clics disparados de forma programática o manejadores personalizados externos).
 *   - `btnClass`  — clase CSS extra que se aplica al botón nativo.
 *
 * Outputs:
 *   - `handleClick` — emitido al hacer clic en el botón.
 */

@Component({
  selector: 'app-button',
  templateUrl: './button.component.html',
  styleUrls: ['./button.component.scss'],
  imports: [NgStyle],
})
export class ButtonComponent {
  @Input() type: AppColors = 'primary';
  @Input() fill: boolean = true;
  @Input() border: boolean = false;
  @Input() disabled: boolean = false;
  @Input() btnClass: string = '';

  @Output() handleClick = new EventEmitter<Event>();

  typeColors: Record<AppColors, string> = {
    primary: 'primary',
    secondary: 'secondary',
    tertiary: 'tertiary',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    light: 'light',
    medium: 'medium',
    dark: 'dark',
    gem: 'gem',
    gold: 'gold',
    darkBrown: 'dark-brown',
  };

  get backgroundColor(): string {
    if (!this.fill) return 'transparent';
    return `var(--ion-color-${this.typeColors[this.type]})`;
  }

  get textColor(): string {
    if (!this.fill) return `var(--ion-color-${this.typeColors[this.type]})`;

    if (this.type === 'light') return `var(--ion-color-dark)`;
    if (this.type === 'secondary') return `var(--ion-color-dark)`;
    if (this.type === 'gem') return `var(--ion-color-gem-shade)`;
    if (this.type === 'warning') return `var(--ion-color-dark)`;

    return `var(--ion-color-light)`;
  }

  get borderStyle(): string {
    if (!this.border) return 'none';

    const base = this.typeColors[this.type];

    if (this.fill) {
      // Usa shade cuando es fill + border
      return `2px solid var(--ion-color-${base}-shade)`;
    }

    return `2px solid var(--ion-color-${base})`;
  }

  get opacity(): string {
    return this.disabled ? '0.6' : '1';
  }
}
