import { booleanAttribute, Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';

@Component({
  selector: 'app-error-modal',
  templateUrl: './error-modal.component.html',
  styleUrls: ['./error-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class ErrorModalComponent {
  @ViewChild(IonModal) modal!: IonModal;

  @Input({ transform: booleanAttribute }) isOpen: boolean = false;
  // Accept nullable string input; displayMessage will handle conversion
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

  // Getter que convierte el mensaje a string de forma segura
  get displayMessage(): string {
    const msg = this.message;
    if (msg === null || msg === undefined) return '';
    return msg;
  }
}
