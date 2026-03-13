import { Component, Input } from '@angular/core';
import { BoardComponent } from '@shared/components/board/board.component';

@Component({
  selector: 'app-gem-counter',
  templateUrl: './gem-counter.component.html',
  styleUrls: ['./gem-counter.component.scss'],
  imports: [BoardComponent], // Importamos el board porque lo usa internamente
})
export class GemCounterComponent {
  // Recibe la cantidad de gemas desde el componente padre
  @Input() amount: number = 0;
}
