import { Injectable, signal } from '@angular/core';
import { Preferences } from '@capacitor/preferences';

@Injectable({
  providedIn: 'root',
})
export class PreferencesService {
  private readonly MUSIC_MUTED_KEY = 'audio_music_muted';
  private readonly SOUNDS_MUTED_KEY = 'audio_sounds_muted';

  musicMuted = signal<boolean>(false);
  soundsMuted = signal<boolean>(false);

  private isInitialized = false;

  async init() {
    if (this.isInitialized) return;

    const musicResult = await Preferences.get({ key: this.MUSIC_MUTED_KEY });
    const soundsResult = await Preferences.get({ key: this.SOUNDS_MUTED_KEY });

    this.musicMuted.set(musicResult.value === 'true');
    this.soundsMuted.set(soundsResult.value === 'true');

    this.isInitialized = true;
  }

  async toggleMusic() {
    const newValue = !this.musicMuted();
    this.musicMuted.set(newValue);
    await Preferences.set({ key: this.MUSIC_MUTED_KEY, value: String(newValue) });
    return newValue;
  }

  async toggleSounds() {
    const newValue = !this.soundsMuted();
    this.soundsMuted.set(newValue);
    await Preferences.set({ key: this.SOUNDS_MUTED_KEY, value: String(newValue) });
    return newValue;
  }
}
