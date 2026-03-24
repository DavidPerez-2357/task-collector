import {
  Component,
  EventEmitter,
  inject,
  Input,
  Output,
  ViewChild,
  OnChanges,
  SimpleChanges,
} from '@angular/core';
import { IonModal, IonIcon } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AudioService } from '@core/services/audio.service';
import { blockBodyScroll, unblockBodyScroll } from '@core/utils/modal-scroll.util';
import { App } from '@capacitor/app';

/**
 * Componente SMART — Modal de ajustes de la aplicación.
 *
 * Controla opciones de audio y cierre de la app a través de `AudioService`.
 *
 * @example
 * ```html
 * <app-settings-modal [isOpen]="isOpen" (closed)="isOpen = false" />
 * ```
 *
 * Inputs:
 *   - `isOpen` — controla la visibilidad del modal.
 *
 * Outputs:
 *   - `closed` — emitido cuando el modal se cierra (cualquier motivo).
 *
 * Métodos públicos:
 *   - `close()` — cierra el modal programáticamente.
 */
@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
  imports: [IonModal, IonIcon, BoardComponent, ButtonComponent],
})
export class SettingsModalComponent implements OnChanges {
  private audioService = inject(AudioService);

  @ViewChild(IonModal) modal!: IonModal;

  @Input() isOpen: boolean = false;
  @Output() closed = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    const isOpenChange = changes['isOpen'];
    if (isOpenChange) {
      const { currentValue, firstChange } = isOpenChange;
      if (firstChange && !currentValue) return;
      if (currentValue) {
        blockBodyScroll();
      } else {
        unblockBodyScroll();
      }
    }
  }

  onDismiss() {
    unblockBodyScroll();
    this.closed.emit();
  }

  isMusicMuted() {
    return this.audioService.isMusicMuted();
  }

  isSoundsMuted() {
    return this.audioService.isSoundsMuted();
  }

  toggleMusic() {
    this.audioService.toggleMusic();
  }

  toggleSounds() {
    this.audioService.toggleSounds();
  }

  async exitApp() {
    await App.exitApp();
  }

  /** Cierra el modal programáticamente. */
  close() {
    this.modal.dismiss();
  }
}
