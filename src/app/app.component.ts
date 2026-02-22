import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { DatabaseService } from '@core/services/database.service';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet],
})
export class AppComponent implements OnInit {
  private databaseService = inject(DatabaseService);

  async ngOnInit() {
    // TODO: Implement loading screen while database is being initialized
    await this.databaseService.init();
  }
}
