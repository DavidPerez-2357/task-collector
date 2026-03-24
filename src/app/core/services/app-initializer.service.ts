import { inject, Injectable } from '@angular/core';
import { DatabaseService } from '@core/services/database.service';
import { AudioService } from '@core/services/audio.service';
import { LoadingService } from '@core/services/loading.service';
import { ErrorService } from '@core/services/error.service';
import { NativePlatformService } from '@core/services/native-platform.service';

/**
 * Orquesta el arranque de la aplicación: inicialización de la base de datos,
 * el servicio de audio y la barra de estado nativa. Muestra y oculta el
 * overlay de carga durante el proceso.
 */
@Injectable({ providedIn: 'root' })
export class AppInitializerService {
  private databaseService = inject(DatabaseService);
  private audioService = inject(AudioService);
  private loadingService = inject(LoadingService);
  private errorService = inject(ErrorService);
  private nativePlatformService = inject(NativePlatformService);

  async initialize(): Promise<void> {
    this.loadingService.show('Iniciando base de datos...');

    try {
      await this.databaseService.init();
      await this.audioService.init();
    } catch (e) {
      console.error('Error al inicializar la aplicación:', e);
      this.errorService.show('Error al inicializar la aplicación');
    } finally {
      await this.nativePlatformService.hideStatusBar();
      this.loadingService.hide();
    }
  }
}
