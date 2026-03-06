import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';

@Component({
  selector: 'app-shop-tab',
  templateUrl: 'shop-tab.component.html',
  styleUrls: ['shop-tab.component.scss'],
  imports: [IonContent, TitleSignComponent],
})
export class ShopTabComponent {}
