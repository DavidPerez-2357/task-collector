import { APP_INITIALIZER } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import {
  RouteReuseStrategy,
  provideRouter,
  withPreloading,
  PreloadAllModules,
} from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { defineCustomElements as jeepSqlite } from 'jeep-sqlite/loader';

import { routes } from '@app/app.routes';
import { AppComponent } from '@app/app.component';
import { provideHttpClient } from '@angular/common/http';
import { IconRegistryService } from '@core/services/icon-registry.service';

jeepSqlite(window);

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideHttpClient(),
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    {
      provide: APP_INITIALIZER,
      useFactory: (iconRegistry: IconRegistryService) => () => iconRegistry.register(),
      deps: [IconRegistryService],
      multi: true,
    },
  ],
});
