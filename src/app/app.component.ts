import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { DatabaseService } from '@core/services/database.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, arrowUndoOutline, closeOutline } from 'ionicons/icons';
import { AudioService } from '@core/services/audio.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private databaseService = inject(DatabaseService);
  private platform = inject(Platform);
  private audioService = inject(AudioService);

  constructor() {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'arrow-undo-outline': arrowUndoOutline,
      'close-outline': closeOutline,
    });
  }

  async ngOnInit() {
    await this.databaseService.init();
    await this.audioService.init();
  }
}