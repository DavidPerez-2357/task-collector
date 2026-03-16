import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  // Contador para manejar llamadas anidadas a show/hide
  private loadingCounter = 0;

  // Subjects para estado de loading y mensaje opcional
  private loadingSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string | null>(null);

  // Observables públicos
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();
  readonly message$: Observable<string | null> = this.messageSubject.asObservable();

  constructor() {}

  /**
   * Muestra el loading. Si ya había un loading activo, incrementa el contador.
   * message es opcional y se emite por el subject de mensaje.
   */
  show(message?: string): void {
    this.loadingCounter += 1;
    if (message !== undefined) {
      this.messageSubject.next(message);
    }
    this.loadingSubject.next(true);
  }

  /**
   * Oculta el loading. Solo cuando el contador llega a 0 se emite false.
   */
  hide(): void {
    if (this.loadingCounter <= 0) {
      // Evitar contador negativo; garantizar estado consistente
      this.loadingCounter = 0;
      this.loadingSubject.next(false);
      this.messageSubject.next(null);
      return;
    }

    this.loadingCounter -= 1;
    if (this.loadingCounter === 0) {
      this.loadingSubject.next(false);
      this.messageSubject.next(null);
    }
  }

  // Helper sincrónicos útiles
  isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  currentMessage(): string | null {
    return this.messageSubject.getValue();
  }

  /**
   * Ejecuta una promesa mientras muestra el overlay de loading solo si la operación tarda más
   * que `delayMs`. Esto evita un parpadeo del overlay cuando la operación es muy rápida.
   */
  async runWithLoading<T>(
    work: () => Promise<T>,
    message?: string,
    delayMs: number = 150,
  ): Promise<T> {
    // Minimum visible time when the overlay is shown to avoid very short flashes
    const minVisibleMs = 400;
    let shown = false;
    let shownAt = 0;

    const timer = setTimeout(() => {
      shown = true;
      shownAt = Date.now();
      this.show(message);
    }, delayMs);

    let result: T;
    try {
      result = await work();
    } finally {
      clearTimeout(timer);

      if (shown) {
        const elapsed = Date.now() - shownAt;
        const remaining = minVisibleMs - elapsed;
        if (remaining > 0) {
          await new Promise((resolve) => setTimeout(resolve, remaining));
        }

        this.hide();
      }
    }

    return result;
  }
}
