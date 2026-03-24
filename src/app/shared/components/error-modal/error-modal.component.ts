import { booleanAttribute, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonIcon, IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AppError } from '@core/types/error.types';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent, IonIcon],
})
export class ErrorModalComponent {
  @ViewChild(IonModal) modal!: IonModal;

  @Input({ transform: booleanAttribute }) isOpen: boolean = false;

  /**
   * Error estructurado a mostrar. Pasar el valor emitido por
   * `ErrorService.error$`. Cuando se proporciona, tiene precedencia sobre
   * el input `message` heredado.
   */
  @Input() error: AppError | null = null;

  /** @deprecated Pasar un {@link AppError} mediante el input `error` en su lugar. */
  @Input() message: string | null = null;

  @Input() title: string = 'Error';
  @Input() okLabel: string = 'Cerrar';
  @Input() okColor: 'primary' | 'danger' | 'success' | 'warning' = 'danger';

  @Output() dismissed = new EventEmitter<void>();
  @Output() acknowledged = new EventEmitter<void>();

  onDismiss() {
    this.dismissed.emit();
  }

  onAcknowledge() {
    this.closeModal();
    this.acknowledged.emit();
  }

  closeModal() {
    this.modal.dismiss();
  }

  /** Mensaje resuelto a mostrar; prioriza `error.message` sobre el `message` heredado. */
  get displayMessage(): string {
    const msg = this.error?.message ?? this.message;
    if (msg === null || msg === undefined) return '';
    return msg;
  }

  /** Icono a mostrar según el tipo de error; 'bug' para errores técnicos, 'error-user' para errores de usuario. */
  get errorKindIcon(): string {
    console.log('Error recibido en modal:', this.error?.kind);
    return this.error?.kind === 'technical' ? 'close-circle-outline' : 'warning-outline';
  }
}
