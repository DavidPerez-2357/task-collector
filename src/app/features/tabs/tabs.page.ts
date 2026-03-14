import { Component, EnvironmentInjector, inject } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { triangle, ellipse, square } from 'ionicons/icons';
import { RouterLink } from '@angular/router';
import { CreateTaskModalComponent } from '@shared/components/create-task-modal/create-task-modal.component';
import { UIService } from '@core/services/ui.service';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.page.html',
  styleUrls: ['tabs.page.scss'],
  imports: [IonTabs, IonTabBar, IonTabButton, RouterLink, CreateTaskModalComponent], // Añadido
})
export class TabsPage {
  public environmentInjector = inject(EnvironmentInjector);
  public ui = inject(UIService);
  
  public isConfigOpen = false;
  public isCreateModalOpen = false; // Añadido

  constructor() {
    addIcons({ triangle, ellipse, square });
  }
}