import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/components/app.module';
import { environment } from './environments/environment';


if (environment.production) {
  console.debug('Enabling production mode...');
  enableProdMode();
}

console.debug('Start bootstrapping module...');

platformBrowserDynamic().bootstrapModule(AppModule)
  .catch(err => console.error(err));
