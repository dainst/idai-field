import {enableProdMode} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app.module';

// TODO Activate prod mode
//if (require('electron').remote.getGlobal('mode') === 'production') enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule);