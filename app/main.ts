import {enableProdMode, TRANSLATIONS, TRANSLATIONS_FORMAT} from '@angular/core';
import {platformBrowserDynamic} from '@angular/platform-browser-dynamic';
import {AppModule} from './app.module';

const remote = require('electron').remote;
const fs = require('fs');


if (['production', 'test'].includes(remote.getGlobal('mode'))) enableProdMode();

platformBrowserDynamic().bootstrapModule(AppModule, {
    providers: [
        { provide: TRANSLATIONS, useValue: getTranslations() },
        { provide: TRANSLATIONS_FORMAT, useValue: 'xlf '}
    ]
});


function getTranslations(): string {

    const locale: string = remote.getGlobal('config').locale;
    const filePath: string = remote.app.getAppPath() + '/app/i18n/messages.' + locale + '.xlf';

    return fs.readFileSync(filePath, 'utf8');
}