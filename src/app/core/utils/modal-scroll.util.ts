/**
 * Contador de modales/overlays que han solicitado bloquear el scroll del body.
 * El bloqueo solo se aplica al pasar de 0 a 1, y se libera al volver a 0.
 */
let scrollLockCount = 0;

/**
 * Valor previo de `document.body.style.overflow`, restaurado al liberar el bloqueo.
 */
let previousOverflow = '';

function preventTouchMove(e: TouchEvent): void {
  e.preventDefault();
}

/**
 * Bloquea el scroll del body y el desplazamiento táctil.
 * Usa un contador de referencias: el bloqueo se aplica solo cuando el primer caller
 * lo solicita (transición 0 → 1), de modo que modales anidados coexisten correctamente.
 * Llamar cuando se abre un modal o overlay de pantalla completa.
 */
export function blockBodyScroll(): void {
  scrollLockCount++;
  if (scrollLockCount === 1) {
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.addEventListener('touchmove', preventTouchMove, { passive: false });
  }
}

/**
 * Libera el bloqueo de scroll del body solicitado por un modal/overlay.
 * El scroll solo se restaura cuando todos los callers hayan liberado su bloqueo
 * (contador llega a 0), evitando que un modal anidado quite el bloqueo de otro.
 * Llamar cuando se cierra un modal o overlay de pantalla completa.
 */
export function unblockBodyScroll(): void {
  if (scrollLockCount === 0) return;
  scrollLockCount--;
  if (scrollLockCount === 0) {
    document.body.style.overflow = previousOverflow;
    previousOverflow = '';
    document.body.removeEventListener('touchmove', preventTouchMove);
  }
}
