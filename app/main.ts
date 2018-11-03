import {enableProdMode, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app.module';
import {Translations} from './translations';

const remote = require('electron').remote;


if (['production', 'test'].includes(remote.getGlobal('mode'))) enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule, {
    providers: [
        { provide: TRANSLATIONS, useValue: Translations.getTranslations() },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf' }
    ]
});
