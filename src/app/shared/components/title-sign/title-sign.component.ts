import {
  AfterViewInit,
  Component,
  ElementRef,
  HostBinding,
  Input,
  signal,
  ViewChild,
} from '@angular/core';

@Component({
  selector: 'app-title-sign',
  templateUrl: './title-sign.component.html',
  styleUrls: ['./title-sign.component.scss'],
})
export class TitleSignComponent implements AfterViewInit {
  @HostBinding('style.display') display = 'block';

  @Input() title: string = '';

  @ViewChild('sign') signElement!: ElementRef<HTMLDivElement>;

  // Signal reactiva con altura del host
  public signHeight = signal(0);

  private resizeObserver!: ResizeObserver;

  @HostBinding('style.height.px')
  get hostHeight(): number {
    return this.signHeight() || 110;
  }

  ngAfterViewInit(): void {
    const element = this.signElement.nativeElement;

    // Inicializa con la altura real
    const initialHeight = element.getBoundingClientRect().height;
    if (initialHeight > 0) {
      this.signHeight.set(initialHeight);
      return;
    }

    // Solo observar mientras la altura sea 0
    this.resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const h = entry.contentRect.height;
        if (h > 0) {
          this.signHeight.set(h * 0.7);
          this.resizeObserver.disconnect(); // desconectar para no seguir consumiendo memoria
        }
      }
    });

    this.resizeObserver.observe(element);
  }
}
