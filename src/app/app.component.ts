import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet, Platform } from '@ionic/angular/standalone';
import { DatabaseService } from '@core/services/database.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, arrowUndoOutline, closeOutline } from 'ionicons/icons';
import { NativeAudio } from '@capacitor-community/native-audio';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private databaseService = inject(DatabaseService);
  private platform = inject(Platform);

  constructor() {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'arrow-undo-outline': arrowUndoOutline,
      'close-outline': closeOutline,
    });
  }

  async ngOnInit() {
    await this.databaseService.init();
    await this.platform.ready();
    await this.initBackgroundMusic();
  }

  private async initBackgroundMusic() {
    try {
      await NativeAudio.preload({
        assetId: 'bg-music',
        assetPath: 'main-theme.mp3',
        audioChannelNum: 1,
        isUrl: false
      });
      await NativeAudio.setVolume({
        assetId: 'bg-music',
        volume: 0.3
      });
      await NativeAudio.loop({
        assetId: 'bg-music'
      });

    } catch (error) {
      console.error('Error al cargar o reproducir el audio nativo:', error);
    }
  }
}