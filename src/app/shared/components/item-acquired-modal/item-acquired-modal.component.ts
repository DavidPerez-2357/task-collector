import {
  Component,
  EventEmitter,
  Input,
  Output,
  ViewChild,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from '@angular/core';
import { IonModal } from '@ionic/angular/standalone';
import { BoardComponent } from '@shared/components/board/board.component';
import { ButtonComponent } from '@shared/components/button/button.component';
import { ItemInventory } from '@core/models/item.model';
import { rarityBackgroundColors, rarityNames, rarityTextColors } from '@core/consts/rarity.const';
import { blockBodyScroll, unblockBodyScroll } from '@core/utils/modal-scroll.util';

/**
 * Componente DUMB — Modal de notificación de item obtenido.
 *
 * Muestra los detalles del item adquirido (nombre, imagen, rareza, cantidad).
 * No contiene lógica de negocio; solo presenta los datos recibidos por inputs.
 *
 * @example
 * ```html
 * <app-item-acquired-modal
 *   [isOpen]="showModal"
 *   [item]="acquiredItem"
 *   [amount]="1"
 *   (closed)="showModal = false"
 *   (acknowledged)="onAcknowledged()"
 * />
 * ```
 *
 * Inputs:
 *   - `isOpen`  — controla la visibilidad del modal.
 *   - `item`    — item obtenido a mostrar (puede ser null mientras el modal está cerrado).
 *   - `amount`  — cantidad obtenida del item (por defecto: 1).
 *
 * Outputs:
 *   - `closed`        — emitido cuando el modal se cierra (cualquier motivo).
 *   - `acknowledged`  — emitido cuando el usuario pulsa el botón de confirmación.
 *
 * Métodos públicos:
 *   - `close()` — cierra el modal programáticamente y emite `acknowledged`.
 */
@Component({
  selector: 'app-item-acquired-modal',
  templateUrl: './item-acquired-modal.component.html',
  styleUrls: ['./item-acquired-modal.component.scss'],
  imports: [IonModal, BoardComponent, ButtonComponent],
})
export class ItemAcquiredModalComponent implements OnChanges, OnDestroy {
  @ViewChild(IonModal) modal!: IonModal;

  @Input() isOpen: boolean = false;
  @Input() item: ItemInventory | null = null;
  @Input() amount: number = 1;

  @Output() closed = new EventEmitter<void>();
  @Output() acknowledged = new EventEmitter<void>();

  private scrollLocked = false;

  ngOnChanges(changes: SimpleChanges): void {
    const isOpenChange = changes['isOpen'];
    if (isOpenChange) {
      const { currentValue, firstChange } = isOpenChange;
      if (firstChange && !currentValue) return;
      if (currentValue) {
        this.scrollLocked = true;
        blockBodyScroll();
      } else {
        this.releaseScrollLock();
      }
    }
  }

  ngOnDestroy(): void {
    this.releaseScrollLock();
  }

  onDismiss() {
    this.releaseScrollLock();
    this.closed.emit();
  }

  private releaseScrollLock(): void {
    if (this.scrollLocked) {
      this.scrollLocked = false;
      unblockBodyScroll();
    }
  }

  /** Cierra el modal programáticamente y emite el evento `acknowledged`. */
  close() {
    try {
      this.modal.dismiss();
    } catch (e) {
      // Ignorar si el modal ya estaba cerrado
    }
    this.acknowledged.emit();
  }

  get rarityName(): string {
    if (!this.item) return 'Desconocida';

    return rarityNames[this.item.rarity] || 'Desconocida';
  }

  get rarityBackgroundColor(): string {
    if (!this.item) return '#fff';

    return rarityBackgroundColors[this.item.rarity];
  }

  get rarityTextColor(): string {
    if (!this.item) return '#000';

    return rarityTextColors[this.item.rarity];
  }

  get itemImage(): string {
    if (!this.item) return '';
    return `/assets/item-images/${this.item.imageName}`;
  }
}
