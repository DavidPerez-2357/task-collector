/**
 * Evita el scroll del body cuando un modal está abierto en móvil.
 * Útil para prevenir que el fondo se desplace bajo un overlay.
 */
function preventTouchMove(e: TouchEvent): void {
  e.preventDefault();
}

/**
 * Bloquea el scroll del body y el desplazamiento táctil.
 * Llamar cuando se abre un modal o overlay de pantalla completa.
 */
export function blockBodyScroll(): void {
  document.body.style.overflow = 'hidden';
  document.body.addEventListener('touchmove', preventTouchMove, { passive: false });
}

/**
 * Restaura el scroll del body y elimina el bloqueo táctil.
 * Llamar cuando se cierra un modal o overlay de pantalla completa.
 */
export function unblockBodyScroll(): void {
  document.body.style.overflow = '';
  document.body.removeEventListener('touchmove', preventTouchMove);
}
