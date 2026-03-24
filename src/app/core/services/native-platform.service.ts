import { Injectable } from '@angular/core';
import { Capacitor } from '@capacitor/core';
import { StatusBar } from '@capacitor/status-bar';

/**
 * Abstrae las interacciones específicas de plataforma nativa (iOS/Android)
 * para desacoplar el resto de la app de las APIs de Capacitor.
 */
@Injectable({ providedIn: 'root' })
export class NativePlatformService {
  isNativePlatform(): boolean {
    return Capacitor.isNativePlatform();
  }

  async hideStatusBar(): Promise<void> {
    if (this.isNativePlatform()) {
      await StatusBar.hide();
    }
  }
}
