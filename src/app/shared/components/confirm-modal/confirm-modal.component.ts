import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';

/**
 * Componente DUMB — Modal de confirmación genérico.
 *
 * Presenta un diálogo con título, mensaje opcional y dos acciones (confirmar / cancelar).
 * No tiene lógica de negocio propia: todo el comportamiento lo decide el padre a través
 * de los outputs `closed` y `confirmed`.
 *
 * @example
 * ```html
 * <app-confirm-modal
 *   [isOpen]="showConfirm"
 *   title="Eliminar tarea"
 *   message="¿Estás seguro?"
 *   confirmLabel="Eliminar"
 *   confirmColor="danger"
 *   (closed)="showConfirm = false"
 *   (confirmed)="onConfirmed($event)"
 * />
 * ```
 *
 * Inputs:
 *   - `isOpen`        — controla la visibilidad del modal.
 *   - `title`         — título del modal (por defecto: 'Confirmar').
 *   - `message`       — mensaje descriptivo opcional.
 *   - `confirmLabel`  — etiqueta del botón de confirmación (por defecto: 'Confirmar').
 *   - `cancelLabel`   — etiqueta del botón de cancelación (por defecto: 'Cancelar').
 *   - `confirmColor`  — color del botón de confirmación.
 *
 * Outputs:
 *   - `closed`     — emitido cuando el modal se cierra (cualquier motivo).
 *   - `confirmed`  — emitido con `true` cuando el usuario confirma la acción.
 *
 * Métodos públicos:
 *   - `close()` — cierra el modal programáticamente.
 */
@Component({
  selector: 'app-confirm-modal',
  templateUrl: './confirm-modal.component.html',
  styleUrls: ['./confirm-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class ConfirmModalComponent {
  @ViewChild(IonModal) modal!: IonModal;

  @Input() isOpen: boolean = false;
  @Input() title: string = 'Confirmar';
  @Input() message: string = '';
  @Input() confirmLabel: string = 'Confirmar';
  @Input() cancelLabel: string = 'Cancelar';
  @Input() confirmColor: 'primary' | 'danger' | 'success' | 'warning' = 'danger';

  @Output() closed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<boolean>();

  onDismiss() {
    this.closed.emit();
  }

  onConfirm() {
    this.close();
    this.confirmed.emit(true);
  }

  /** Cierra el modal programáticamente. */
  close() {
    this.modal.dismiss();
  }
}
