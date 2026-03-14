import { Component, EventEmitter, Input, Output, ViewChild } from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';

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

  @Output() dismissed = new EventEmitter<void>();
  @Output() confirmed = new EventEmitter<boolean>();

  onDismiss() {
    this.dismissed.emit();
  }

  onConfirm() {
    this.closeModal();
    this.confirmed.emit(true);
  }

  closeModal() {
    this.modal.dismiss();
  }
}
