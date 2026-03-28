import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/**
 * Servicio global del overlay de carga.
 *
 * ## Estrategia de loading
 *
 * ### Loading global (overlay a nivel de aplicación)
 * Usar para operaciones que bloquean toda la UI (p. ej. inicialización de BD,
 * carga de datos de una pestaña en el primer acceso). El overlay cubre toda la pantalla.
 *
 * **Patrón recomendado – llamada única:**
 * ```ts
 * await this.loadingService.runWithLoading(
 *   () => this.myService.fetchData(),
 *   'Cargando datos...',
 * );
 * ```
 *
 * **Alternativa – show / hide manual (usar solo cuando `runWithLoading` no sea suficiente):**
 * ```ts
 * this.loadingService.show('Cargando...');
 * try {
 *   await this.myService.fetchData();
 * } finally {
 *   this.loadingService.hide();
 * }
 * ```
 *
 * ### Loading local (vista / componente individual)
 * Para operaciones que solo deben indicar carga dentro de una vista concreta
 * (p. ej. refrescar una tarjeta), gestionar un booleano local del componente
 * o una señal de Angular en lugar de usar este servicio:
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
 * Enlazarlo a un spinner o skeleton en la plantilla sin tocar el overlay global.
 */
@Injectable({
  providedIn: 'root',
})
export class LoadingService {
  // Contador para gestionar llamadas anidadas a show/hide
  private loadingCounter = 0;

  private loadingSubject = new BehaviorSubject<boolean>(false);
  private messageSubject = new BehaviorSubject<string | null>(null);

  /** Emite `true` mientras el overlay de carga global es visible. */
  readonly loading$: Observable<boolean> = this.loadingSubject.asObservable();

  /** Emite el mensaje de carga actual (o `null` cuando está inactivo). */
  readonly message$: Observable<string | null> = this.messageSubject.asObservable();

  constructor() {}

  /**
   * Muestra el overlay de carga global.
   * Admite llamadas anidadas: el overlay permanece visible hasta que cada `show()`
   * tenga su correspondiente `hide()`.
   *
   * @param message – Etiqueta opcional a mostrar en el overlay.
   */
  show(message?: string): void {
    this.loadingCounter += 1;
    if (message !== undefined) {
      this.messageSubject.next(message);
    }
    this.loadingSubject.next(true);
  }

  /**
   * Oculta el overlay de carga global.
   * El overlay solo se cierra cuando el contador interno llega a cero,
   * lo que permite anidar de forma segura las llamadas a `show()` / `hide()`.
   */
  hide(): void {
    if (this.loadingCounter <= 0) {
      // Protección frente a llamadas a hide() sin su show() correspondiente
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

  /** Ayudante síncrono – devuelve `true` mientras el overlay es visible. */
  isLoading(): boolean {
    return this.loadingSubject.getValue();
  }

  /** Ayudante síncrono – devuelve el mensaje de carga actual. */
  currentMessage(): string | null {
    return this.messageSubject.getValue();
  }

  /**
   * Ejecuta una operación asíncrona mostrando el overlay de carga global.
   *
   * El overlay se muestra solo después de `delayMs` milisegundos (por defecto 150 ms)
   * para evitar un parpadeo visual en operaciones muy rápidas. Cuando el overlay
   * llega a mostrarse, permanece visible al menos `minVisibleMs` (400 ms) para
   * evitar un cierre brusco.
   *
   * Utiliza una llamada interna retardada a `show()`, que incrementa el contador global del overlay.
   * Si se llama a `runWithLoading()` mientras otra operación controla el overlay
   * (vía `show()`/`hide()` o un `runWithLoading()` distinto), el tiempo total que
   * permanece visible será el resultado combinado de todas las operaciones activas,
   * pudiendo mantenerse abierto más tiempo para evitar parpadeos de cierre/apertura.
   *
   * Si se necesita un comportamiento estrictamente controlado (por ejemplo, que una
   * operación concreta no extienda el overlay más allá de su propio trabajo), es
   * preferible usar `show()` / `hide()` manual alrededor del trabajo asíncrono en
   * lugar de componer varios `runWithLoading()` en paralelo.
   *
   * Los errores lanzados por `work` **no se capturan** – se propagan al llamante
   * para que cada punto de uso aplique su propia estrategia de gestión de errores
   * (p. ej. `errorService.handle()`).
   *
   * ### Uso típico
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
   * @param work     – Trabajo asíncrono a realizar.
   * @param message  – Etiqueta opcional del overlay.
   * @param delayMs  – Milisegundos a esperar antes de mostrar el overlay (por defecto 150).
   */
  async runWithLoading<T>(
    work: () => Promise<T>,
    message?: string,
    delayMs: number = 150,
  ): Promise<T> {
    // Tiempo mínimo de visibilidad cuando el overlay se muestra para evitar parpadeos muy cortos
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
