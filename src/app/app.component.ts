import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from '@core/services/database.service';
import { addIcons } from 'ionicons';
import { checkmarkCircle, arrowUndoOutline, closeOutline } from 'ionicons/icons';
import { AudioService } from '@core/services/audio.service';
import { StatusBar } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { LoadingOverlayComponent } from '@shared/components/loading-overlay/loading-overlay.component';
import { LoadingService } from '@core/services/loading.service';
import { AsyncPipe } from '@angular/common';
import { ErrorService } from '@core/services/error.service';
import { ErrorModalComponent } from '@shared/components/error-modal/error-modal.component';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, LoadingOverlayComponent, AsyncPipe, ErrorModalComponent],
})
export class AppComponent implements OnInit {
  private databaseService = inject(DatabaseService);
  private audioService = inject(AudioService);
  private loadingService = inject(LoadingService);
  private errorService = inject(ErrorService);

  loading$ = this.loadingService.loading$;
  message$ = this.loadingService.message$;
  error$ = this.errorService.error$;
  errorOpen$ = this.errorService.error$.pipe(map((m) => !!m));

  constructor() {
    addIcons({
      'checkmark-circle': checkmarkCircle,
      'arrow-undo-outline': arrowUndoOutline,
      'close-outline': closeOutline,
    });
  }

  clearError() {
    this.errorService.clear();
  }

  async ngOnInit() {
    this.loadingService.show('Iniciando base de datos...');

    try {
      await this.databaseService.init();
      await this.audioService.init();
    } finally {
      if (Capacitor.isNativePlatform()) {
        await StatusBar.hide();
      }

      this.loadingService.hide();
    }
  }
}
