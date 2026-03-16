import { Component, EventEmitter, inject, Input, Output, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { IonModal, IonIcon } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { AudioService } from '@core/services/audio.service';
import { App } from '@capacitor/app';

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
  @Output() dismissed = new EventEmitter<void>();

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['isOpen']) {
      this.toggleBodyScroll(changes['isOpen'].currentValue);
    }
  }

  onDismiss() {
    this.toggleBodyScroll(false);
    this.dismissed.emit();
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

  closeModal() {
    this.modal.dismiss();
  }

  private toggleBodyScroll(block: boolean) {
    if (block) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
  }
}
