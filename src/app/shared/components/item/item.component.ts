import { Component, EventEmitter, Input, Output } from '@angular/core';
import { Item, ItemInventory } from '@core/models/item.model';
import { NgOptimizedImage } from '@angular/common';
import { rarityBackgroundColors } from '@core/consts/rarity.const';

/**
 * Componente DUMB — Vista previa de un item (inventario o tienda).
 *
 * Muestra la imagen y el color de rareza del item dentro de un contenedor cuadrado.
 * No contiene lógica de negocio; el padre decide qué hacer al hacer clic.
 *
 * @example
 * ```html
 * <app-item [item]="myItem" [pixelSize]="64" (itemClicked)="onItemClicked($event)" />
 * ```
 *
 * Inputs:
 *   - `item`       — item a mostrar (requerido). Acepta `Item` o `ItemInventory`.
 *   - `pixelSize`  — tamaño del contenedor en píxeles (por defecto: 64).
 *
 * Outputs:
 *   - `itemClicked` — emitido con el item al hacer clic.
 */

@Component({
  selector: 'app-item',
  templateUrl: './item.component.html',
  styleUrls: ['./item.component.scss'],
  imports: [NgOptimizedImage],
})
export class ItemComponent {
  @Input({ required: true }) item!: ItemInventory | Item;
  @Input() pixelSize: number = 64;
  @Output() itemClicked = new EventEmitter<Item | ItemInventory>();

  get rarityColor(): string {
    return rarityBackgroundColors[this.item.rarity];
  }

  get itemImagePath(): string {
    return `assets/item-images/${this.item.imageName}`;
  }
}
