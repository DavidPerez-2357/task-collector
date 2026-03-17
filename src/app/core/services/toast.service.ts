import { inject, Injectable } from '@angular/core';
import { ToastController } from '@ionic/angular/standalone';

export type ToastColor =
  | 'success'
  | 'danger'
  | 'primary'
  | 'secondary'
  | 'tertiary'
  | 'warning'
  | 'light'
  | 'medium'
  | 'dark'
  | 'gem'
  | 'gold'
  | 'dark-brown';

@Injectable({ providedIn: 'root' })
export class ToastService {
  private toastController = inject(ToastController);

  async show(options: {
    message: string;
    duration?: number;
    color?: ToastColor;
    position?: 'top' | 'bottom' | 'middle';
    icon?: string;
  }) {
    const toast = await this.toastController.create({
      message: options.message,
      duration: options.duration ?? 2500,
      color: options.color ?? 'primary',
      position: options.position ?? 'top',
      icon: options.icon,
    });

    await toast.present();
  }

  async success(message: string, duration = 2000, icon = 'checkmark-circle') {
    return this.show({ message, duration, color: 'success', position: 'top', icon });
  }

  async error(message: string, duration = 3000, icon = 'close-outline') {
    return this.show({ message, duration, color: 'danger', position: 'top', icon });
  }

  async info(message: string, duration = 2000, icon?: string) {
    return this.show({ message, duration, color: 'primary', position: 'top', icon });
  }
}
