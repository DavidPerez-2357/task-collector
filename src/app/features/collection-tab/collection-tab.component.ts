import { Component } from '@angular/core';
import { IonContent } from '@ionic/angular/standalone';
import { TitleSignComponent } from '@shared/components/title-sign/title-sign.component';

@Component({
  selector: 'app-collection-tab',
  templateUrl: 'collection-tab.component.html',
  styleUrls: ['collection-tab.component.scss'],
  imports: [IonContent, TitleSignComponent],
})
export class CollectionTabComponent {}
