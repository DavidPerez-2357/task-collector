import { Component, inject, OnInit } from '@angular/core';
import { IonApp, IonRouterOutlet } from '@ionic/angular/standalone';
import { LoadingOverlayComponent } from '@shared/components/loading-overlay/loading-overlay.component';
import { LoadingService } from '@core/services/loading.service';
import { AsyncPipe } from '@angular/common';
import { ErrorService } from '@core/services/error.service';
import { ErrorModalComponent } from '@shared/components/error-modal/error-modal.component';
import { AppInitializerService } from '@core/services/app-initializer.service';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  imports: [IonApp, IonRouterOutlet, LoadingOverlayComponent, AsyncPipe, ErrorModalComponent],
})
export class AppComponent implements OnInit {
  private appInitializerService = inject(AppInitializerService);
  private loadingService = inject(LoadingService);
  private errorService = inject(ErrorService);

  loading$ = this.loadingService.loading$;
  message$ = this.loadingService.message$;
  error$ = this.errorService.error$;
  errorOpen$ = this.errorService.error$.pipe(map((e) => !!e));

  clearError() {
    this.errorService.clear();
  }

  async ngOnInit() {
    await this.appInitializerService.initialize();
  }
}
