import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-board',
  templateUrl: './board.component.html',
  styleUrls: ['./board.component.scss'],
  imports: [],
})
export class BoardComponent {
  @Input() width: string = 'fit-content';
  @Input() height: string = 'fit-content';
  @Input() borderSize: 'small' | 'medium' | 'large' = 'small';

  get borderSizeValue() {
    switch (this.borderSize) {
      case 'small':
        return 20;
      case 'medium':
        return 25;
      case 'large':
        return 30;
      default:
        return 25;
    }
  }

  get borderSizeValuePx() {
    return `${this.borderSizeValue}px`;
  }

  get borderSource() {
    return `url(/assets/ui/board-${this.borderSize}.png)`;
  }
}
