import { booleanAttribute, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AppError } from '@core/types/error.types';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class ErrorModalComponent {
  @ViewChild(IonModal) modal!: IonModal;

  @Input({ transform: booleanAttribute }) isOpen: boolean = false;

  /**
   * Structured error to display.  Pass the value emitted by
   * `ErrorService.error$`.  When provided it takes precedence over
   * the legacy `message` input.
   */
  @Input() error: AppError | null = null;

  /** @deprecated Pass an {@link AppError} via the `error` input instead. */
  @Input() message: string | null = null;

  @Input() title: string = 'Error';
  @Input() okLabel: string = 'OK';
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

  /** Resolved message to display; prefers `error.message` over legacy `message`. */
  get displayMessage(): string {
    const msg = this.error?.message ?? this.message;
    if (msg === null || msg === undefined) return '';
    return msg;
  }

  /** CSS class applied to the modal root based on the error kind. */
  get errorKindClass(): string {
    return this.error?.kind === 'technical' ? 'error-technical' : 'error-user';
  }
}
