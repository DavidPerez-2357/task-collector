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
}
