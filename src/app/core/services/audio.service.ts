import { inject, Injectable } from '@angular/core';
import { Platform } from '@ionic/angular/standalone';
import { NativeAudio } from '@capacitor-community/native-audio';

@Injectable({
  providedIn: 'root',
})
export class AudioService {
  private platform = inject(Platform);

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
    
    await this.platform.ready();
    await this.preloadAll();
    this.startBgMusic();
    
    this.isInitialized = true;
  }

  private async preloadAll() {
    try {
      // Preload background music
      await NativeAudio.preload({
        assetId: this.SOUNDS.BG_MUSIC.id,
        assetPath: this.SOUNDS.BG_MUSIC.path,
        audioChannelNum: 1,
        isUrl: false,
      });

      await NativeAudio.setVolume({
        assetId: this.SOUNDS.BG_MUSIC.id,
        volume: 0.2,
      });

      // Preload sound effects
      const effects = [
        this.SOUNDS.BUY_COLLECTION,
        this.SOUNDS.COMPLETE_COLLECTION,
        this.SOUNDS.COMPLETED_TASK,
        this.SOUNDS.SELL_ITEM,
        this.SOUNDS.REMOVE_TASK,
        this.SOUNDS.PUT_ITEM_COLLECTION,
      ];

      for (const effect of effects) {
        await NativeAudio.preload({
          assetId: effect.id,
          assetPath: effect.path,
          audioChannelNum: 4,
          isUrl: false,
        });
      }
    } catch (e) {
      console.error('Error preloading sounds:', e);
    }
  }

  private async startBgMusic() {
    try {
      await NativeAudio.loop({
        assetId: this.SOUNDS.BG_MUSIC.id,
      });
    } catch (e) {
      console.error('Error starting bg music:', e);
    }
  }

  async playBuyCollection() {
    await this.play(this.SOUNDS.BUY_COLLECTION.id);
  }

  async playCompleteCollection() {
    await this.play(this.SOUNDS.COMPLETE_COLLECTION.id);
  }

  async playCompletedTask() {
    await this.play(this.SOUNDS.COMPLETED_TASK.id);
  }

  async playSellItem() {
    await this.play(this.SOUNDS.SELL_ITEM.id);
  }

  async playRemoveTask() {
    await this.play(this.SOUNDS.REMOVE_TASK.id);
  }

  async playPutItemCollection() {
    await this.play(this.SOUNDS.PUT_ITEM_COLLECTION.id);
  }

  private async play(id: string) {
    try {
      await NativeAudio.play({ assetId: id });
    } catch (e) {
      // Usamos warn para no ensuciar la consola si falla en ambientes sin audio
      console.warn(`Error playing sound ${id}:`, e);
    }
  }
}
