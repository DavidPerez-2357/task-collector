import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';

@Component({
  selector: 'app-inventory-tab',
  templateUrl: 'inventory-tab.component.html',
  styleUrls: ['inventory-tab.component.scss'],
  imports: [IonContent, TitleSignComponent],
})
export class InventoryTabComponent {}
