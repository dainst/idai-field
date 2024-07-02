import * as fs from 'fs';

const remote = typeof window !== 'undefined' ? window.require('@electron/remote') : undefined;


/**
 * @author Thomas Kleinke
 */
export module Translations {

    export function getTranslations(): string {

        const locale: string = remote.getGlobal('getLocale')();
        const filePath: string = remote.app.getAppPath() + '/src/app/i18n/angular/messages.' + locale + '.xlf';

        return fs.readFileSync(filePath, 'utf8');
    }
}
