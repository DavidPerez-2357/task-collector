import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { RouterLink } from '@angular/router';
import { UIService } from '@core/services/ui.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, RouterLink],
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);

  // Exponer el servicio para que la plantilla pueda leer la signal
  public ui = inject(UIService);
}
