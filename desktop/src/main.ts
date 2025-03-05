import { enableProdMode } from '@angular/core';
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/components/app.module';
import { InitializationProgress } from './app/components/initialization-progress';
import { Settings } from './app/services/settings/settings';
import { environment } from './environments/environment';

const detectPort = window.require('detect-port');


if (environment.production) enableProdMode();

suppressWarnings();
start();


async function start() {

    if (await isAlreadyOpen()) {
        showAlreadyOpenError();
    } else {
        platformBrowserDynamic()
            .bootstrapModule(AppModule)
            .catch(err => console.error(err));
    } 
}


async function isAlreadyOpen(): Promise<boolean> {

    return await detectPort(3000) !== 3000;
}


function showAlreadyOpenError() {

    const progress = new InitializationProgress(null);
    progress.setLocale(Settings.getLocale());
    progress.setError('alreadyOpenError');
}


function suppressWarnings() {

    const warningTexts: string[] = [
        'The vm module of Node.js is deprecated in the renderer process and will be removed.'
    ];

    const warnFunction = console.warn;

    console.warn = function() {
        if (!warningTexts.find(text => arguments[0].includes(text))) {
            return warnFunction.apply(console, arguments);
        }
    };
}
