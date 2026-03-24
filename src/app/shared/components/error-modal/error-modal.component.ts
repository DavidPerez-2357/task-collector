import { booleanAttribute, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';

/**
 * Componente DUMB — Modal de error genérico.
 *
 * Muestra un mensaje de error con un botón de confirmación. No contiene lógica de negocio.
 *
 * @example
 * ```html
 * <app-error-modal
 *   [isOpen]="hasError"
 *   [message]="errorMessage"
 *   (closed)="hasError = false"
 *   (acknowledged)="onErrorAcknowledged()"
 * />
 * ```
 *
 * Inputs:
 *   - `isOpen`    — controla la visibilidad del modal.
 *   - `message`   — mensaje de error a mostrar (acepta null).
 *   - `title`     — título del modal (por defecto: 'Error').
 *   - `okLabel`   — etiqueta del botón de confirmación (por defecto: 'OK').
 *   - `okColor`   — color del botón de confirmación.
 *
 * Outputs:
 *   - `closed`        — emitido cuando el modal se cierra (cualquier motivo).
 *   - `acknowledged`  — emitido cuando el usuario pulsa el botón OK.
 *
 * Métodos públicos:
 *   - `close()` — cierra el modal programáticamente.
 */
@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class ErrorModalComponent {
  @ViewChild(IonModal) modal!: IonModal;

  @Input({ transform: booleanAttribute }) isOpen: boolean = false;
  @Input() message: string | null = null;
  @Input() title: string = 'Error';
  @Input() okLabel: string = 'OK';
  @Input() okColor: 'primary' | 'danger' | 'success' | 'warning' = 'danger';

  @Output() closed = new EventEmitter<void>();
  @Output() acknowledged = new EventEmitter<void>();

  onDismiss() {
    this.closed.emit();
  }

  onAcknowledge() {
    this.close();
    this.acknowledged.emit();
  }

  /** Cierra el modal programáticamente. */
  close() {
    this.modal.dismiss();
  }

  /** Convierte el mensaje a string de forma segura para mostrarlo en la plantilla. */
  get displayMessage(): string {
    const msg = this.message;
    if (msg === null || msg === undefined) return '';
    return msg;
  }
}
