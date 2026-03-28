import { Component, Input } from '@angular/core';
import { IonBackdrop } from '@ionic/angular/standalone';

/**
 * Componente DUMB — Overlay de carga a pantalla completa.
 *
 * Muestra un backdrop y un spinner animado mientras `visible` sea true.
 * Ideal para bloquear la UI durante operaciones asíncronas largas (p. ej., inicialización de BD).
 *
 * @example
 * ```html
 * <app-loading-overlay [visible]="isLoading" [message]="'Cargando datos...'" />
 * ```
 *
 * Inputs:
 *   - `visible`  — controla si el overlay está activo (acepta null, tratado como false).
 *   - `message`  — texto descriptivo bajo el spinner (acepta null).
 */
@Component({
  standalone: true,
  selector: 'app-loading-overlay',
  imports: [IonBackdrop],
  templateUrl: './loading-overlay.component.html',
  styleUrls: ['./loading-overlay.component.scss'],
})
export class LoadingOverlayComponent {
  @Input() message: string | null = 'Cargando...';
  @Input() visible: boolean | null = false;
}
