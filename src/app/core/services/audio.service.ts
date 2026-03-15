import { inject, Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { NativeAudio } from '@capacitor-community/native-audio';
import { Capacitor } from '@capacitor/core';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private platform = inject(Platform);

  // NOTA: Recuerda que los archivos reales en src/assets/sounds/ deben ser convertidos a .mp3
  private readonly SOUNDS = {
    BUY_COLLECTION: { id: 'buy-collection', path: 'assets/sounds/buy-collection.ogg' },
    COMPLETE_COLLECTION: { id: 'complete-collection', path: 'assets/sounds/complete-collection.ogg' },
    COMPLETED_TASK: { id: 'completed-task', path: 'assets/sounds/completed-task.ogg' },
    SELL_ITEM: { id: 'sell-item', path: 'assets/sounds/sell-item.ogg' },
    REMOVE_TASK: { id: 'remove-task', path: 'assets/sounds/remove-task.ogg' },
    PUT_ITEM_COLLECTION: { id: 'put-item-collection', path: 'assets/sounds/put-item-collection.ogg' },
    BG_MUSIC: { id: 'bg-music', path: 'assets/sounds/main-theme.mp3' },
  };

  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;
    
    try {
      if (Capacitor.isNativePlatform()) {
        await this.platform.ready();
      }
      await this.preloadAll();
      this.startBgMusic();
      this.isInitialized = true;
    } catch (e) {
      console.error('Core Audio init error:', e);
    }
  }

  // Helper que detecta si estamos en nativo (iOS/Android) y antepone "public/"
  private getAssetPath(path: string): string {
    return Capacitor.isNativePlatform() ? `public/${path}` : path;
  }

  private async preloadAll() {
    const soundsToLoad = [
      { ...this.SOUNDS.BG_MUSIC, channels: 1 },
      { ...this.SOUNDS.BUY_COLLECTION, channels: 4 },
      { ...this.SOUNDS.COMPLETE_COLLECTION, channels: 4 },
      { ...this.SOUNDS.COMPLETED_TASK, channels: 4 },
      { ...this.SOUNDS.SELL_ITEM, channels: 4 },
      { ...this.SOUNDS.REMOVE_TASK, channels: 4 },
      { ...this.SOUNDS.PUT_ITEM_COLLECTION, channels: 4 },
    ];

    for (const s of soundsToLoad) {
      try {
        await NativeAudio.preload({
          assetId: s.id,
          assetPath: this.getAssetPath(s.path), 
          audioChannelNum: s.channels,
          isUrl: false,
        });
      } catch (e) {
        console.warn(`Could not preload ${s.id}:`, e);
      }
    }
  }

  private async startBgMusic() {
    setTimeout(async () => {
      try {
        await NativeAudio.loop({
          assetId: this.SOUNDS.BG_MUSIC.id,
        });

        await NativeAudio.setVolume({
          assetId: this.SOUNDS.BG_MUSIC.id,
          volume: 0.2,
        });
      } catch (e) {
        console.warn('Error starting bg music:', e);
      }
    }, 500);
  }

  playBuyCollection() {
    this.play(this.SOUNDS.BUY_COLLECTION.id);
  }

  playCompleteCollection() {
    this.play(this.SOUNDS.COMPLETE_COLLECTION.id);
  }

  playCompletedTask() {
    this.play(this.SOUNDS.COMPLETED_TASK.id);
  }

  playSellItem() {
    this.play(this.SOUNDS.SELL_ITEM.id);
  }

  playRemoveTask() {
    this.play(this.SOUNDS.REMOVE_TASK.id);
  }

  playPutItemCollection() {
    this.play(this.SOUNDS.PUT_ITEM_COLLECTION.id);
  }

  private async play(id: string) {
    try {
      // No bloqueamos aunque sea async por si falla en nativo
      await NativeAudio.play({ assetId: id });
    } catch (e) {
      console.warn(`Error playing sound ${id}:`, e);
    }
  }
}