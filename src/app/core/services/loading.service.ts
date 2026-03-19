import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Global loading overlay service.
 *
 * ## Loading strategy
 *
 * ### Global loading (app-wide overlay)
 * Use for operations that block the entire UI (e.g. DB initialisation,
 * tab data fetch on first load).  The overlay is shown over the whole screen.
 *
 * **Preferred pattern – single call:**
 * ```ts
 * await this.loadingService.runWithLoading(
 *   () => this.myService.fetchData(),
 *   'Cargando datos...',
 * );
 * ```
 *
 * **Alternative – manual show / hide (use only when `runWithLoading` is insufficient):**
 * ```ts
 * this.loadingService.show('Cargando...');
 * try {
 *   await this.myService.fetchData();
 * } finally {
 *   this.loadingService.hide();
 * }
 * ```
 *
 * ### Local loading (single view / component)
 * For operations that should only indicate loading within a specific view
 * (e.g. refreshing a single card), manage a component-local boolean or
 * Angular signal instead of using this service:
 * ```ts
 * isLoading = signal(false);
 *
 * async reload() {
 *   this.isLoading.set(true);
 *   try {
 *     await this.myService.fetchData();
 *   } finally {
 *     this.isLoading.set(false);
 *   }
 * }
 * ```
 * Bind it to a spinner or skeleton in the template without touching the global overlay.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  // Counter to handle nested show/hide calls
  private loadingCounter = 0;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string | null>(null);

  /** Emits `true` while the global loading overlay is visible. */
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /** Emits the current loading message (or `null` when idle). */
  readonly message$: Observable<string | null> = this.messageSubject.asObservable();

  constructor() {}

  /**
   * Show the global loading overlay.
   * Supports nested calls – the overlay stays visible until each `show()`
   * has a matching `hide()`.
   *
   * @param message – Optional label to display in the overlay.
   */
  show(message?: string): void {
    this.loadingCounter += 1;
    if (message !== undefined) {
      this.messageSubject.next(message);
    }
    this.loadingSubject.next(true);
  }

  /**
   * Hide the global loading overlay.
   * The overlay is only dismissed once the internal counter reaches zero,
   * allowing safe nesting of `show()` / `hide()` calls.
   */
  hide(): void {
    if (this.loadingCounter <= 0) {
      // Guard against unbalanced hide() calls
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

  /** Synchronous helper – returns `true` while the overlay is visible. */
  isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  /** Synchronous helper – returns the current loading message. */
  currentMessage(): string | null {
    return this.messageSubject.getValue();
  }

  /**
   * Execute an async operation while showing the global loading overlay.
   *
   * The overlay is shown only after `delayMs` milliseconds (default 150 ms)
   * to avoid a visual flash for very fast operations.  When the overlay
   * does appear it stays visible for at least `minVisibleMs` (400 ms) to
   * prevent an abrupt flicker.
   *
   * Errors thrown by `work` are **not caught** – they propagate to the
   * caller so that each call-site can apply its own error-handling strategy
   * (e.g. `errorService.handle()`).
   *
   * ### Typical usage
   * ```ts
   * try {
   *   await this.loadingService.runWithLoading(
   *     () => this.myService.fetchData(),
   *     'Cargando datos...',
   *   );
   * } catch (e) {
   *   this.errorService.handle(e, 'Error al cargar los datos.');
   * }
   * ```
   *
   * @param work     – Async work to perform.
   * @param message  – Optional overlay label.
   * @param delayMs  – Milliseconds to wait before showing the overlay (default 150).
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
